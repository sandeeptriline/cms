-- =============================================================================
-- Tenant Permissions Seed Script
-- =============================================================================
-- This script seeds tenant-level permissions into user_role_permissions table
-- Run this script for each tenant database after creating user_role_permissions table
--
-- Usage:
--   mysql -u root -p cms_tenant_<tenant_slug> < tenant-permissions-seed.sql
-- =============================================================================

-- Insert tenant-level permissions
-- Permission naming: resource:action

-- Content Management Permissions
INSERT INTO user_role_permissions (id, name, resource, action, description, category, is_system, created_at, updated_at) VALUES
  (UUID(), 'content_type:create', 'content_type', 'create', 'Create new content types', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_type:read', 'content_type', 'read', 'View content types', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_type:update', 'content_type', 'update', 'Update content types', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_type:delete', 'content_type', 'delete', 'Delete content types', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'form_element:create', 'form_element', 'create', 'Create new form elements', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'form_element:read', 'form_element', 'read', 'View form elements', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'form_element:update', 'form_element', 'update', 'Update form elements', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'form_element:delete', 'form_element', 'delete', 'Delete form elements', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:create', 'content_entry', 'create', 'Create content entries', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:read', 'content_entry', 'read', 'View content entries', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:update', 'content_entry', 'update', 'Update content entries', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:delete', 'content_entry', 'delete', 'Delete content entries', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:publish', 'content_entry', 'publish', 'Publish content entries', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'content_entry:unpublish', 'content_entry', 'unpublish', 'Unpublish content entries', 'content_management', 1, NOW(), NOW()),

-- Page Management Permissions
  (UUID(), 'page:create', 'page', 'create', 'Create new pages', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'page:read', 'page', 'read', 'View pages', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'page:update', 'page', 'update', 'Update pages', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'page:delete', 'page', 'delete', 'Delete pages', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'page:publish', 'page', 'publish', 'Publish pages', 'content_management', 1, NOW(), NOW()),

-- Block Management Permissions
  (UUID(), 'block:create', 'block', 'create', 'Create new blocks', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'block:read', 'block', 'read', 'View blocks', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'block:update', 'block', 'update', 'Update blocks', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'block:delete', 'block', 'delete', 'Delete blocks', 'content_management', 1, NOW(), NOW()),

-- Media Management Permissions
  (UUID(), 'media:create', 'media', 'create', 'Upload media files', 'media_management', 1, NOW(), NOW()),
  (UUID(), 'media:read', 'media', 'read', 'View media files', 'media_management', 1, NOW(), NOW()),
  (UUID(), 'media:update', 'media', 'update', 'Update media files', 'media_management', 1, NOW(), NOW()),
  (UUID(), 'media:delete', 'media', 'delete', 'Delete media files', 'media_management', 1, NOW(), NOW()),

-- User Management Permissions (within tenant)
  (UUID(), 'user:create', 'user', 'create', 'Create new users', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'user:read', 'user', 'read', 'View users', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'user:update', 'user', 'update', 'Update users', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'user:delete', 'user', 'delete', 'Delete users', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'user:reset_password', 'user', 'reset_password', 'Reset user passwords', 'user_management', 1, NOW(), NOW()),

-- Role Management Permissions
  (UUID(), 'role:create', 'role', 'create', 'Create new roles', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'role:read', 'role', 'read', 'View roles', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'role:update', 'role', 'update', 'Update roles', 'user_management', 1, NOW(), NOW()),
  (UUID(), 'role:delete', 'role', 'delete', 'Delete roles', 'user_management', 1, NOW(), NOW()),

-- Workflow Management Permissions
  (UUID(), 'workflow:create', 'workflow', 'create', 'Create workflows', 'workflow_management', 1, NOW(), NOW()),
  (UUID(), 'workflow:read', 'workflow', 'read', 'View workflows', 'workflow_management', 1, NOW(), NOW()),
  (UUID(), 'workflow:update', 'workflow', 'update', 'Update workflows', 'workflow_management', 1, NOW(), NOW()),
  (UUID(), 'workflow:delete', 'workflow', 'delete', 'Delete workflows', 'workflow_management', 1, NOW(), NOW()),
  (UUID(), 'workflow:approve', 'workflow', 'approve', 'Approve workflow items', 'workflow_management', 1, NOW(), NOW()),
  (UUID(), 'workflow:reject', 'workflow', 'reject', 'Reject workflow items', 'workflow_management', 1, NOW(), NOW()),

-- Navigation Management Permissions
  (UUID(), 'navigation:create', 'navigation', 'create', 'Create navigation items', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'navigation:read', 'navigation', 'read', 'View navigation', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'navigation:update', 'navigation', 'update', 'Update navigation', 'content_management', 1, NOW(), NOW()),
  (UUID(), 'navigation:delete', 'navigation', 'delete', 'Delete navigation items', 'content_management', 1, NOW(), NOW()),

-- Settings Permissions
  (UUID(), 'settings:read', 'settings', 'read', 'View tenant settings', 'settings', 1, NOW(), NOW()),
  (UUID(), 'settings:update', 'settings', 'update', 'Update tenant settings', 'settings', 1, NOW(), NOW()),

-- API Access Permissions
  (UUID(), 'api:read', 'api', 'read', 'Access delivery API (read-only)', 'api_access', 1, NOW(), NOW()),
  (UUID(), 'api:write', 'api', 'write', 'Access delivery API (read-write)', 'api_access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  description = VALUES(description),
  updated_at = NOW();

-- Verify permissions were created
SELECT COUNT(*) AS total_permissions FROM user_role_permissions;
SELECT category, COUNT(*) AS count FROM user_role_permissions GROUP BY category ORDER BY category;
