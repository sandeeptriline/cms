-- Add missing columns to tenants table to match Prisma schema
-- Usage: mysql -u your_user -p cms_platform < add-tenants-missing-columns.sql
-- (Ignore "Duplicate column" errors for columns that already exist.)

ALTER TABLE `tenants` ADD COLUMN `config` json DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `feature_flags` json DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `usage_limits` json DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `storage_used` bigint DEFAULT 0;
ALTER TABLE `tenants` ADD COLUMN `storage_limit` bigint DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `api_calls_today` int DEFAULT 0;
ALTER TABLE `tenants` ADD COLUMN `api_calls_limit` int DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `users_count` int DEFAULT 0;
ALTER TABLE `tenants` ADD COLUMN `users_limit` int DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `last_activity_at` timestamp NULL DEFAULT NULL;
ALTER TABLE `tenants` ADD COLUMN `provisioned_at` timestamp NULL DEFAULT NULL;
CREATE INDEX idx_tenants_activity ON `tenants` (`last_activity_at`);
