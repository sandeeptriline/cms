-- =============================================================================
-- Tenant Roles Seed Script
-- =============================================================================
-- This script seeds default roles into a tenant's roles table
-- Run this script for each tenant database after tenant creation
--
-- Usage:
--   mysql -u root -p cms_tenant_<tenant_slug> < tenant-roles-seed.sql
-- =============================================================================

-- Insert default tenant roles
-- Note: Replace <TENANT_DB_NAME> with actual tenant database name when running

INSERT INTO roles (id, name, description, is_system, created_at, updated_at) VALUES
  (UUID(), 'Admin', 'Tenant-level administration. Full access to manage schemas, users, roles, and settings within the tenant.', 1, NOW(), NOW()),
  (UUID(), 'Editor', 'Content creation and editing. Can create, edit, and publish content; manage media.', 1, NOW(), NOW()),
  (UUID(), 'Reviewer', 'Content review and approval. Can review, approve, and reject content; cannot create content.', 1, NOW(), NOW()),
  (UUID(), 'Author', 'Content creation only. Can create drafts; cannot publish or approve.', 1, NOW(), NOW()),
  (UUID(), 'API Consumer', 'Read-only API access. Can access delivery APIs; no admin panel access.', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  updated_at = NOW();

-- Verify roles were created
SELECT id, name, description, is_system, created_at FROM roles ORDER BY name;
