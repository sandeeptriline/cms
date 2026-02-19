-- =============================================================================
-- Create MySQL User for CMS Platform
-- =============================================================================
-- Run this SQL in phpMyAdmin or MySQL command line
-- 
-- Note: MySQL doesn't support wildcards (*) in GRANT statements for database names
-- Tenant database privileges will be granted when databases are created dynamically

-- Step 1: Create the user
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'Triline@123!';

-- Step 2: Grant privileges to platform database
GRANT ALL PRIVILEGES ON cms_platform.* TO 'cms_user'@'localhost';

-- Step 3: Apply changes
FLUSH PRIVILEGES;

-- Step 4: Verify user was created
SELECT user, host, plugin FROM mysql.user WHERE user='cms_user';

-- Step 5: Verify privileges
SHOW GRANTS FOR 'cms_user'@'localhost';

-- =============================================================================
-- Notes:
-- =============================================================================
-- 1. Tenant databases (cms_tenant_*) will be created programmatically
-- 2. When creating a tenant database, grant privileges like this:
--    GRANT ALL PRIVILEGES ON cms_tenant_<tenant_id>.* TO 'cms_user'@'localhost';
-- 3. This will be handled in the tenant provisioning code (Phase 1)
-- =============================================================================
