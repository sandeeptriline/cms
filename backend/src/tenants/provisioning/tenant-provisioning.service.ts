import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { tenants_status } from '@prisma/client';
import { DatabaseValidator } from '../../common/utils/database-validator';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Provision a new tenant database
   */
  async provisionTenant(tenantId: string, dbName: string): Promise<void> {
    this.logger.log(`Starting provisioning for tenant ${tenantId}, database: ${dbName}`);

    // Validate database name - ensure it's a valid CMS tenant database
    try {
      DatabaseValidator.validateTenantDatabaseName(dbName);
    } catch (error) {
      this.logger.error(`Invalid database name: ${dbName} - ${error.message}`);
      throw new BadRequestException(
        `Invalid database name: ${error.message}. CMS only works with cms_platform and cms_tenant_* databases.`,
      );
    }

    try {
      // Step 1: Create the database
      await this.createDatabase(dbName);
      this.logger.log(`Database ${dbName} created successfully`);

      // Step 2: Grant privileges to the database user
      await this.grantPrivileges(dbName);
      this.logger.log(`Privileges granted for ${dbName}`);

      // Step 3: Run tenant database migrations
      await this.runTenantMigrations(dbName);
      this.logger.log(`Migrations completed for ${dbName}`);

      // Step 4: Setup default data (roles, schemas, etc.)
      await this.setupDefaultData(dbName, tenantId);
      this.logger.log(`Default data setup completed for ${dbName}`);

      // Step 5: Update tenant status to ACTIVE
      await this.prisma.tenants.update({
        where: { id: tenantId },
        data: { status: tenants_status.active },
      });

      this.logger.log(`Tenant ${tenantId} provisioned successfully`);
    } catch (error) {
      this.logger.error(`Failed to provision tenant ${tenantId}: ${error.message}`, error.stack);
      
      // Update tenant status to failed
      await this.prisma.tenants.update({
        where: { id: tenantId },
        data: { status: tenants_status.suspended },
      });

      throw new InternalServerErrorException(
        `Failed to provision tenant: ${error.message}`,
      );
    }
  }

  /**
   * Create a new MySQL database
   */
  private async createDatabase(dbName: string): Promise<void> {
    // Validate it's a CMS database before creating
    if (!DatabaseValidator.isValidCmsDatabase(dbName)) {
      throw new BadRequestException(
        `Cannot create database "${dbName}". CMS only works with cms_platform and cms_tenant_* databases.`,
      );
    }

    // Sanitize database name to prevent SQL injection
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    // Try to use root connection if available (required for CREATE DATABASE)
    const rootUrl = this.configService.get<string>('MYSQL_ROOT_URL', '');
    let rootPrisma: any = null;
    
    if (rootUrl) {
      try {
        // Create a temporary Prisma client with root connection
        const { PrismaClient } = require('@prisma/client');
        rootPrisma = new PrismaClient({
          datasources: {
            db: { url: rootUrl },
          },
        });
        // Connect the root client
        await rootPrisma.$connect();
        this.logger.log('Using MySQL root connection for database creation');
      } catch (error) {
        this.logger.warn(`Failed to create root Prisma client: ${error.message}`);
        this.logger.warn('Falling back to regular connection (may fail if user lacks CREATE DATABASE privilege)');
      }
    } else {
      this.logger.warn('MYSQL_ROOT_URL not configured. Database creation may fail if cms_user lacks CREATE DATABASE privilege.');
      this.logger.warn('Set MYSQL_ROOT_URL in .env file for automatic database creation.');
    }

    const prismaClient = rootPrisma || this.prisma;

    try {
      await prismaClient.$executeRawUnsafe(
        `CREATE DATABASE IF NOT EXISTS \`${sanitizedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      this.logger.log(`Database ${dbName} created successfully`);
    } catch (error: any) {
      this.logger.error(`Failed to create database ${dbName}: ${error.message}`);
      if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message?.includes('Access denied')) {
        throw new InternalServerErrorException(
          `Failed to create database: Access denied. ` +
          `The database user needs CREATE DATABASE privilege, or set MYSQL_ROOT_URL in .env file. ` +
          `You can manually create the database: CREATE DATABASE \`${sanitizedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
        );
      }
      throw error;
    } finally {
      if (rootPrisma) {
        await rootPrisma.$disconnect();
      }
    }
  }

  /**
   * Grant privileges to the database user
   * Note: This requires MySQL root/admin privileges to grant privileges to other users
   */
  private async grantPrivileges(dbName: string): Promise<void> {
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);
    
    // Extract user from DATABASE_URL or use default
    const dbUrl = this.configService.get<string>('DATABASE_URL', '');
    let dbUser = 'cms_user';
    let dbHost = 'localhost';
    
    if (dbUrl) {
      // Parse DATABASE_URL: mysql://user:password@host:port/database
      const match = dbUrl.match(/mysql:\/\/([^:]+):[^@]+@([^:]+):/);
      if (match) {
        dbUser = match[1];
        dbHost = match[2];
      }
    }

    // Try to use root connection if available
    const rootUrl = this.configService.get<string>('MYSQL_ROOT_URL', '');
    let rootPrisma: any = null;
    
    if (rootUrl) {
      try {
        // Create a temporary Prisma client with root connection
        const { PrismaClient } = require('@prisma/client');
        rootPrisma = new PrismaClient({
          datasources: {
            db: { url: rootUrl },
          },
        });
        // Connect the root client
        await rootPrisma.$connect();
        this.logger.log('Using MySQL root connection for privilege grants');
      } catch (error) {
        this.logger.warn(`Failed to create root Prisma client: ${error.message}`);
        this.logger.warn('Falling back to regular connection (privilege grants may fail)');
      }
    }

    const prismaClient = rootPrisma || this.prisma;

    try {
      await prismaClient.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON \`${sanitizedDbName}\`.* TO '${dbUser}'@'${dbHost}'`,
      );
      await prismaClient.$executeRawUnsafe('FLUSH PRIVILEGES');
      this.logger.log(`Privileges granted successfully for ${dbName}`);
    } catch (error) {
      this.logger.error(`Failed to grant privileges: ${error.message}`);
      this.logger.warn(
        `Privilege grant failed. This requires MySQL root/admin access. ` +
        `You can manually grant privileges using: ` +
        `GRANT ALL PRIVILEGES ON \`${sanitizedDbName}\`.* TO '${dbUser}'@'${dbHost}'; FLUSH PRIVILEGES;`
      );
      // Don't throw - allow provisioning to continue, but log the issue
      // The database will be created but privileges need to be granted manually
    } finally {
      if (rootPrisma) {
        await rootPrisma.$disconnect();
      }
    }
  }

  /**
   * Run tenant database migrations
   */
  private async runTenantMigrations(dbName: string): Promise<void> {
    // For now, we'll create the basic tenant schema
    // Later, this can use Prisma migrations or SQL files
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    try {
      // Switch to tenant database
      await this.prisma.$executeRawUnsafe(`USE \`${sanitizedDbName}\``);

      // Create basic tenant tables
      // This will be replaced with proper Prisma migrations later
      await this.createTenantSchema(sanitizedDbName);
    } catch (error) {
      this.logger.error(`Failed to run migrations for ${dbName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create basic tenant database schema
   * Reads and executes the tenant-db.sql schema file
   */
  private async createTenantSchema(dbName: string): Promise<void> {
    this.logger.log(`Creating schema for ${dbName}`);
    
    const fs = require('fs');
    const path = require('path');
    
    // Path to tenant-db.sql file (relative to project root)
    // Try multiple possible paths
    const possiblePaths = [
      path.join(process.cwd(), '..', 'docs', 'tenant-db.sql'), // From backend/
      path.join(process.cwd(), 'docs', 'tenant-db.sql'), // From root/
      path.join(__dirname, '..', '..', '..', '..', 'docs', 'tenant-db.sql'), // From backend/src/tenants/provisioning/
    ];
    
    let schemaPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        schemaPath = possiblePath;
        break;
      }
    }
    
    if (!schemaPath) {
      throw new Error(`Schema file not found. Tried: ${possiblePaths.join(', ')}`);
    }
    
    try {
      // Read the SQL file
      const sql = fs.readFileSync(schemaPath, 'utf8');
      
      // Switch to the tenant database first
      await this.prisma.$executeRawUnsafe(`USE \`${this.sanitizeDatabaseName(dbName)}\``);
      
      // Split SQL by semicolons, but be careful with JSON and strings
      // Simple approach: split by semicolon followed by newline or end of string
      const statements = sql
        .split(/;\s*\n/)
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string) => {
          // Filter out comments and empty statements
          const cleaned = stmt.replace(/--.*$/gm, '').trim();
          return cleaned.length > 0 && !cleaned.startsWith('--');
        });
      
      // Execute each statement
      let successCount = 0;
      let errorCount = 0;
      
      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            await this.prisma.$executeRawUnsafe(statement);
            successCount++;
          } catch (error: any) {
            // Ignore "table already exists" and "duplicate key" errors
            const errorMsg = error.message?.toLowerCase() || '';
            if (
              errorMsg.includes('already exists') ||
              errorMsg.includes('duplicate') ||
              errorMsg.includes('duplicate key')
            ) {
              // Table/constraint already exists, that's okay
              successCount++;
            } else {
              errorCount++;
              this.logger.warn(`Schema statement warning: ${error.message}`);
              this.logger.debug(`Failed statement: ${statement.substring(0, 100)}...`);
            }
          }
        }
      }
      
      this.logger.log(`Schema created for ${dbName}: ${successCount} statements executed, ${errorCount} warnings`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`Schema file not found at ${schemaPath}. Skipping schema creation.`);
        this.logger.warn('You may need to manually run migrations for this tenant.');
      } else {
        this.logger.error(`Failed to create schema: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Setup default data for tenant
   */
  private async setupDefaultData(dbName: string, tenantId: string): Promise<void> {
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    try {
      await this.prisma.$executeRawUnsafe(`USE \`${sanitizedDbName}\``);

      // Create default project if none exists
      const existingProjects = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM projects LIMIT 1`
      );

      if (existingProjects.length === 0) {
        const defaultProjectId = uuidv4();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO projects (id, name, slug, config, feature_flags, created_at, updated_at)
           VALUES (?, ?, ?, '{}', '{}', NOW(), NOW())`,
          defaultProjectId,
          'Default Project',
          'default'
        );
        this.logger.log(`Default project created for tenant ${tenantId}`);
      }

      // Insert default schema (e.g., "Page" content type)
      // This is optional - can be done later via API
    } catch (error) {
      this.logger.warn(`Failed to setup default data: ${error.message}`);
      // Don't throw - default data is optional
    }
  }

  /**
   * Sanitize database name to prevent SQL injection
   */
  private sanitizeDatabaseName(dbName: string): string {
    // Only allow alphanumeric, underscore, and hyphen
    return dbName.replace(/[^a-z0-9_-]/gi, '');
  }

  /**
   * Drop tenant database (for cleanup/testing)
   */
  async dropTenantDatabase(dbName: string): Promise<void> {
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    try {
      await this.prisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS \`${sanitizedDbName}\``);
      this.logger.log(`Database ${dbName} dropped successfully`);
    } catch (error) {
      this.logger.error(`Failed to drop database ${dbName}: ${error.message}`);
      throw error;
    }
  }
}
