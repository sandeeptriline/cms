/**
 * Database name validation and filtering utilities
 * 
 * This ensures the CMS only works with its own databases:
 * - cms_platform (platform database)
 * - cms_tenant_* (tenant databases)
 * 
 * Excludes MySQL system databases
 */

export class DatabaseValidator {
  /**
   * Valid CMS database name patterns
   */
  private static readonly CMS_DATABASE_PATTERNS = {
    PLATFORM: /^cms_platform$/i,
    TENANT: /^cms_tenant_.+$/i,
  };

  /**
   * MySQL system databases to exclude
   */
  private static readonly EXCLUDED_DATABASES = [
    'information_schema',
    'mysql',
    'performance_schema',
    'sys',
  ];

  /**
   * Check if a database name is valid for CMS operations
   */
  static isValidCmsDatabase(dbName: string): boolean {
    if (!dbName || typeof dbName !== 'string') {
      return false;
    }

    // Check if it's in the excluded list
    if (this.EXCLUDED_DATABASES.includes(dbName.toLowerCase())) {
      return false;
    }

    // Check if it matches CMS patterns
    return (
      this.CMS_DATABASE_PATTERNS.PLATFORM.test(dbName) ||
      this.CMS_DATABASE_PATTERNS.TENANT.test(dbName)
    );
  }

  /**
   * Check if a database name is a tenant database
   */
  static isTenantDatabase(dbName: string): boolean {
    if (!dbName || typeof dbName !== 'string') {
      return false;
    }
    return this.CMS_DATABASE_PATTERNS.TENANT.test(dbName);
  }

  /**
   * Check if a database name is the platform database
   */
  static isPlatformDatabase(dbName: string): boolean {
    if (!dbName || typeof dbName !== 'string') {
      return false;
    }
    return this.CMS_DATABASE_PATTERNS.PLATFORM.test(dbName);
  }

  /**
   * Validate and sanitize a tenant database name
   * Throws error if invalid
   */
  static validateTenantDatabaseName(dbName: string): string {
    if (!dbName || typeof dbName !== 'string') {
      throw new Error('Database name must be a non-empty string');
    }

    // Check if it's excluded
    if (this.EXCLUDED_DATABASES.includes(dbName.toLowerCase())) {
      throw new Error(
        `Database "${dbName}" is excluded. CMS only works with cms_platform and cms_tenant_* databases.`,
      );
    }

    // Check if it matches tenant pattern
    if (!this.isTenantDatabase(dbName)) {
      throw new Error(
        `Invalid tenant database name: "${dbName}". Must match pattern: cms_tenant_<tenant_id>`,
      );
    }

    return dbName;
  }

  /**
   * Filter database list to only include CMS databases
   */
  static filterCmsDatabases(databaseList: string[]): string[] {
    return databaseList.filter((db) => this.isValidCmsDatabase(db));
  }

  /**
   * Generate a valid tenant database name from tenant ID
   */
  static generateTenantDatabaseName(tenantId: string): string {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('Tenant ID must be a non-empty string');
    }

    // Sanitize tenant ID (remove special characters, keep alphanumeric and hyphens)
    const sanitized = tenantId.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

    return `cms_tenant_${sanitized}`;
  }
}
