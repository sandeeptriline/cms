-- Add missing columns to platform `users` table so it matches Prisma schema.
-- Current table has: id, email, password_hash, provider, mfa_enabled, status, created_at, updated_at
-- Usage: mysql -u your_user -p cms_platform < add-users-columns-to-platform.sql

ALTER TABLE `users`
  ADD COLUMN `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `password_hash`,
  ADD COLUMN `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `name`,
  ADD COLUMN `email_verified_at` timestamp NULL DEFAULT NULL AFTER `status`,
  ADD COLUMN `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `email_verified_at`,
  ADD COLUMN `external_identifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `provider`,
  ADD COLUMN `mfa_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `mfa_enabled`,
  ADD COLUMN `preferences` json DEFAULT NULL AFTER `mfa_secret`,
  ADD COLUMN `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en' AFTER `preferences`,
  ADD COLUMN `theme` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'auto' AFTER `language`,
  ADD COLUMN `last_login_at` timestamp NULL DEFAULT NULL AFTER `theme`;
