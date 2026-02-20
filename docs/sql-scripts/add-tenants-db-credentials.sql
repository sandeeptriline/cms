-- Add tenant DB user/password columns (for dedicated DB credentials per tenant)
-- Usage: mysql -u your_user -p cms_platform < add-tenants-db-credentials.sql

ALTER TABLE `tenants` ADD COLUMN `db_user` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_name`;
ALTER TABLE `tenants` ADD COLUMN `db_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `db_user`;
