-- SQL script to grant privileges to cms_user for tenant databases
-- Run this as MySQL root user: mysql -u root -p < grant-tenant-privileges.sql

-- Grant privileges to specific tenant database
-- Replace 'cms_tenant_auth_test_tenant_1' with your actual tenant database name
GRANT ALL PRIVILEGES ON `cms_tenant_auth_test_tenant_1`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Or grant privileges to all tenant databases (if MySQL version supports it)
-- Note: This may not work on all MySQL versions
-- GRANT ALL PRIVILEGES ON `cms_tenant_%`.* TO 'cms_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Verify privileges
SHOW GRANTS FOR 'cms_user'@'localhost';
