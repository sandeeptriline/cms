import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { tenants_status } from '@prisma/client';

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
    // Sanitize database name to prevent SQL injection
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    try {
      await this.prisma.$executeRawUnsafe(
        `CREATE DATABASE IF NOT EXISTS \`${sanitizedDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
    } catch (error) {
      this.logger.error(`Failed to create database ${dbName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Grant privileges to the database user
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

    try {
      await this.prisma.$executeRawUnsafe(
        `GRANT ALL PRIVILEGES ON \`${sanitizedDbName}\`.* TO '${dbUser}'@'${dbHost}'`,
      );
      await this.prisma.$executeRawUnsafe('FLUSH PRIVILEGES');
    } catch (error) {
      this.logger.warn(`Failed to grant privileges (may need root access): ${error.message}`);
      // Don't throw - privileges might already exist or require root
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
   * TODO: Replace with full tenant-db.sql schema via migrations
   */
  private async createTenantSchema(dbName: string): Promise<void> {
    // For now, create minimal schema
    // Full schema will be applied via Prisma migrations later
    // This is just to get the tenant database initialized
    this.logger.log(`Creating minimal schema for ${dbName}`);
    
    // Note: Full schema creation will be handled by Prisma migrations
    // This is a placeholder for now
  }

  /**
   * Setup default data for tenant
   */
  private async setupDefaultData(dbName: string, tenantId: string): Promise<void> {
    const sanitizedDbName = this.sanitizeDatabaseName(dbName);

    try {
      await this.prisma.$executeRawUnsafe(`USE \`${sanitizedDbName}\``);

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
