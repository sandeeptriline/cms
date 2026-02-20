import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { tenants_status } from '@prisma/client';
import { DatabaseValidator } from '../../common/utils/database-validator';
import { TENANT_ADMIN_ROLE_ID } from '../../constants/tenant-defaults';
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

    let tenantDbUser: string | null = null;
    let tenantDbPassword: string | null = null;

    try {
      // Step 1: Create the database
      await this.createDatabase(dbName);
      this.logger.log(`Database ${dbName} created successfully`);

      // Step 2: Grant privileges to the app database user (so migrations can run)
      await this.grantPrivileges(dbName);
      this.logger.log(`Privileges granted for ${dbName}`);

      // Step 3: Run tenant database migrations
      await this.runTenantMigrations(dbName);
      this.logger.log(`Migrations completed for ${dbName}`);

      // Step 4: Setup default data (roles, schemas, etc.)
      await this.setupDefaultData(dbName, tenantId);
      this.logger.log(`Default data setup completed for ${dbName}`);

      // Step 5: Create dedicated DB user for this tenant (for external access)
      const creds = await this.createTenantDbUser(dbName);
      if (creds) {
        tenantDbUser = creds.dbUser;
        tenantDbPassword = creds.dbPassword;
        this.logger.log(`Tenant DB user ${tenantDbUser} created for ${dbName}`);
      }

      // Step 6: Update tenant status to ACTIVE and store DB credentials
      await this.prisma.tenants.update({
        where: { id: tenantId },
        data: {
          status: tenants_status.active,
          provisioned_at: new Date(),
          ...(tenantDbUser && { db_user: tenantDbUser }),
          ...(tenantDbPassword && { db_password: tenantDbPassword }),
        },
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
   * Create a dedicated MySQL user for the tenant database (for external access with these credentials).
   * Requires MYSQL_ROOT_URL. Returns credentials or null if root not available / creation fails.
   */
  private async createTenantDbUser(dbName: string): Promise<{ dbUser: string; dbPassword: string } | null> {
    const rootUrl = this.configService.get<string>('MYSQL_ROOT_URL', '');
    if (!rootUrl) {
      this.logger.warn('MYSQL_ROOT_URL not set; skipping tenant DB user creation');
      return null;
    }

    const sanitizedDbName = this.sanitizeDatabaseName(dbName);
    // MySQL user max 32 chars; use cms_t_ + suffix from db name (strip cms_tenant_)
    const suffix = dbName.replace(/^cms_tenant_/i, '').replace(/[^a-z0-9_]/gi, '_').slice(0, 26);
    const dbUser = `cms_t_${suffix}`.slice(0, 32);
    const dbPassword = this.generateSecurePassword(24);

    const dbHost = this.getDbHostFromUrl(rootUrl);

    let rootPrisma: any = null;
    try {
      const { PrismaClient } = require('@prisma/client');
      rootPrisma = new PrismaClient({ datasources: { db: { url: rootUrl } } });
      await rootPrisma.$connect();
    } catch (error: any) {
      this.logger.warn(`Failed to connect as root for tenant user creation: ${error.message}`);
      return null;
    }

    const sanitizedUser = dbUser.replace(/[^a-z0-9_]/gi, '');
    const sanitizedHost = dbHost.replace(/[^a-z0-9_.%-]/gi, '');
    const escapedPassword = dbPassword.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    try {
      await rootPrisma.$executeRawUnsafe(
        `CREATE USER IF NOT EXISTS '${sanitizedUser}'@'${sanitizedHost}' IDENTIFIED BY '${escapedPassword}'`,
      );
      await rootPrisma.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON \`${sanitizedDbName}\`.* TO '${sanitizedUser}'@'${sanitizedHost}'`,
      );
      await rootPrisma.$executeRawUnsafe('FLUSH PRIVILEGES');
      return { dbUser: sanitizedUser, dbPassword };
    } catch (error: any) {
      this.logger.error(`Failed to create tenant DB user: ${error.message}`);
      return null;
    } finally {
      if (rootPrisma) await rootPrisma.$disconnect();
    }
  }

  private getDbHostFromUrl(url: string): string {
    const match = url.match(/@([^:]+):/);
    return match ? match[1] : 'localhost';
  }

  private generateSecurePassword(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    const randomBytes = require('crypto').randomBytes(length);
    for (let i = 0; i < length; i++) result += chars[randomBytes[i] % chars.length];
    return result;
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
   * Run tenant database migrations.
   * Does not use USE (triggers MySQL 1295 in prepared statement protocol); table names are qualified with DB name.
   */
  private async runTenantMigrations(dbName: string): Promise<void> {
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);
    try {
      await this.createTenantSchema(sanitizedDbName);
    } catch (error) {
      this.logger.error(`Failed to run migrations for ${dbName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create basic tenant database schema.
   * Prefers Composable Content Graph v2 schema (tenant-db-init-v2.sql); falls back to tenant-db.sql.
   */
  private async createTenantSchema(dbName: string): Promise<void> {
    this.logger.log(`Creating schema for ${dbName}`);
    const fs = require('fs');
    const path = require('path');

    const v2InitPaths = [
      path.join(process.cwd(), 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
      path.join(process.cwd(), '..', 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
      path.join(__dirname, '..', '..', '..', '..', 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
    ];
    const legacyPaths = [
      path.join(process.cwd(), '..', 'docs', 'tenant-db.sql'),
      path.join(process.cwd(), 'docs', 'tenant-db.sql'),
      path.join(process.cwd(), 'docs', 'core', 'tenant-db.sql'),
      path.join(__dirname, '..', '..', '..', '..', 'docs', 'tenant-db.sql'),
    ];
    let schemaPath: string | null = null;
    for (const p of v2InitPaths) {
      if (fs.existsSync(p)) {
        schemaPath = p;
        this.logger.log(`Using v2 tenant schema: ${p}`);
        break;
      }
    }
    if (!schemaPath) {
      for (const p of legacyPaths) {
        if (fs.existsSync(p)) {
          schemaPath = p;
          this.logger.log(`Using legacy tenant schema: ${p}`);
          break;
        }
      }
    }
    if (!schemaPath) {
      throw new Error(`Schema file not found. Tried v2: ${v2InitPaths.join(', ')}; legacy: ${legacyPaths.join(', ')}`);
    }
    
    try {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const sanitizedDbName = this.sanitizeDatabaseName(dbName);

      // Qualify table names with database so we don't need USE (USE triggers MySQL 1295 in prepared statements).
      const qualifyStatement = (stmt: string): string => {
        const db = sanitizedDbName;
        let out = stmt.replace(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/gi, `CREATE TABLE IF NOT EXISTS \`${db}\`.$1`);
        out = out.replace(/\bREFERENCES\s+`?(\w+)`?\s*\(/gi, `REFERENCES \`${db}\`.$1 (`);
        return out;
      };

      const statements = sql
        .split(/;\s*\n/)
        .map((stmt: string) => stmt.trim())
        .filter((stmt: string) => {
          const cleaned = stmt.replace(/--.*$/gm, '').trim();
          return cleaned.length > 0 && !cleaned.startsWith('--');
        });

      let successCount = 0;
      let errorCount = 0;

      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            const qualified = qualifyStatement(statement);
            await this.prisma.$executeRawUnsafe(qualified);
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
    const q = (table: string) => `\`${sanitizedDbName}\`.\`${table}\``;

    try {
      // Don't use USE (MySQL 1295); qualify table names.
      const existingProjects = (await this.prisma.$queryRawUnsafe(
        `SELECT id FROM ${q('projects')} LIMIT 1`
      )) as Array<{ id: string }>;

      if (existingProjects.length === 0) {
        const defaultProjectId = uuidv4();
        try {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO ${q('projects')} (id, name, description, created_at, updated_at)
             VALUES (?, ?, NULL, NOW(), NOW())`,
            defaultProjectId,
            'Default Project'
          );
          this.logger.log(`Default project created for tenant ${tenantId}`);
        } catch (insertError: any) {
          if (insertError.message?.includes('Unknown column')) {
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO ${q('projects')} (id, name, slug, config, feature_flags, created_at, updated_at)
               VALUES (?, ?, 'default', '{}', '{}', NOW(), NOW())`,
              defaultProjectId,
              'Default Project'
            );
            this.logger.log(`Default project created for tenant ${tenantId} (legacy schema)`);
          } else {
            throw insertError;
          }
        }
      }

      // Ensure "Tenant Admin" role exists (for self-signup and tenant admins)
      const existingRole = (await this.prisma.$queryRawUnsafe(
        `SELECT id FROM ${q('roles')} WHERE id = ? LIMIT 1`,
        TENANT_ADMIN_ROLE_ID
      )) as Array<{ id: string }>;
      if (existingRole.length === 0) {
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO ${q('roles')} (id, project_id, name, description, created_at, updated_at)
           VALUES (?, NULL, ?, ?, NOW(), NOW())`,
          TENANT_ADMIN_ROLE_ID,
          'Tenant Admin',
          'Default admin role for the tenant'
        );
        this.logger.log(`Tenant Admin role created for tenant ${tenantId}`);
      }
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
   * Reset tenant database to Composable Content Graph v2 structure.
   * Drops all v2 tables then runs tenant-db-init-v2.sql. All tenant data is lost.
   */
  async resetTenantDbToV2(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenants.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, db_name: true },
    });
    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }
    const dbName = tenant.db_name;
    if (!dbName) {
      throw new BadRequestException('Tenant has no database name; cannot reset.');
    }
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);
    if (!DatabaseValidator.isValidCmsDatabase(sanitizedDbName)) {
      throw new BadRequestException(`Invalid tenant database name: ${dbName}`);
    }

    const fs = require('fs');
    const path = require('path');

    const resetPaths = [
      path.join(process.cwd(), 'docs', 'sql-scripts', 'tenant-db-reset-v2.sql'),
      path.join(process.cwd(), '..', 'docs', 'sql-scripts', 'tenant-db-reset-v2.sql'),
      path.join(__dirname, '..', '..', '..', '..', 'docs', 'sql-scripts', 'tenant-db-reset-v2.sql'),
    ];
    const initPaths = [
      path.join(process.cwd(), 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
      path.join(process.cwd(), '..', 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
      path.join(__dirname, '..', '..', '..', '..', 'docs', 'sql-scripts', 'tenant-db-init-v2.sql'),
    ];
    let resetPath: string | null = null;
    let initPath: string | null = null;
    for (const p of resetPaths) {
      if (fs.existsSync(p)) {
        resetPath = p;
        break;
      }
    }
    for (const p of initPaths) {
      if (fs.existsSync(p)) {
        initPath = p;
        break;
      }
    }
    if (!resetPath || !initPath) {
      throw new InternalServerErrorException(
        'Tenant DB v2 schema files not found (tenant-db-reset-v2.sql and tenant-db-init-v2.sql in docs/sql-scripts/).',
      );
    }

    // Qualify table names with database so we don't need USE (USE triggers MySQL 1295 in prepared statements).
    const qualifyStatement = (stmt: string): string => {
      const db = sanitizedDbName;
      // DROP TABLE IF EXISTS table_name -> DROP TABLE IF EXISTS `db`.table_name
      let out = stmt.replace(/DROP TABLE IF EXISTS\s+`?(\w+)`?/gi, `DROP TABLE IF EXISTS \`${db}\`.$1`);
      // CREATE TABLE IF NOT EXISTS table_name -> CREATE TABLE IF NOT EXISTS `db`.table_name
      out = out.replace(/CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?/gi, `CREATE TABLE IF NOT EXISTS \`${db}\`.$1`);
      // REFERENCES table_name( -> REFERENCES `db`.table_name( so FKs point to tenant DB
      out = out.replace(/\bREFERENCES\s+`?(\w+)`?\s*\(/gi, `REFERENCES \`${db}\`.$1 (`);
      return out;
    };

    const runSqlFile = async (filePath: string, label: string) => {
      const sql = fs.readFileSync(filePath, 'utf8');
      const statements = sql
        .split(/;\s*\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => {
          const cleaned = s.replace(/--.*$/gm, '').trim();
          return cleaned.length > 0 && !cleaned.startsWith('--');
        });
      for (const statement of statements) {
        if (statement.length > 0) {
          const qualified = qualifyStatement(statement);
          await this.prisma.$executeRawUnsafe(qualified);
        }
      }
      this.logger.log(`Tenant ${tenantId} (${dbName}): ${label} completed`);
    };

    try {
      await runSqlFile(resetPath, 'reset (drop tables)');
      await runSqlFile(initPath, 'init (create tables)');
      this.logger.log(`Tenant database reset to v2 structure: ${dbName}`);
    } catch (error: any) {
      this.logger.error(`Failed to reset tenant DB ${dbName}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to reset tenant database: ${error.message}`);
    }
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
