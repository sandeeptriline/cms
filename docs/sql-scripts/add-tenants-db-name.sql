-- Add db_name to tenants table (required by Prisma schema)
-- Run if you get: The column `cms_platform.tenants.db_name` does not exist
-- Usage: mysql -u your_user -p cms_platform < add-tenants-db-name.sql

-- 1. Add column as nullable
ALTER TABLE `tenants`
  ADD COLUMN `db_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `slug`;

-- 2. Backfill from slug (e.g. cms_tenant_myorg)
UPDATE `tenants` SET `db_name` = CONCAT('cms_tenant_', `slug`) WHERE `db_name` IS NULL;

-- 3. Make NOT NULL and add unique key
ALTER TABLE `tenants`
  MODIFY COLUMN `db_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  ADD UNIQUE KEY `uk_tenants_db_name` (`db_name`);
