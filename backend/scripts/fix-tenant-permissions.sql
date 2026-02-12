-- SQL script to fix MySQL permissions for a tenant database
-- Run this as MySQL root user: mysql -u root -p < fix-tenant-permissions.sql
-- Or run specific commands below

-- Replace 'cms_tenant_a111e427_2a5a_4119_a235_6e988eaf412b' with your actual tenant database name
-- You can find the database name by running:
-- SELECT id, name, db_name FROM tenants WHERE id = 'a111e427-2a5a-4119-a235-6e988eaf412b';

-- Grant privileges to specific tenant database
GRANT ALL PRIVILEGES ON `cms_tenant_a111e427_2a5a_4119_a235_6e988eaf412b`.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify privileges
SHOW GRANTS FOR 'cms_user'@'localhost';

-- Or grant privileges to all tenant databases at once:
-- Note: This uses a pattern that works in MySQL 8.0+
-- GRANT ALL PRIVILEGES ON `cms_tenant_%`.* TO 'cms_user'@'localhost';
-- FLUSH PRIVILEGES;
