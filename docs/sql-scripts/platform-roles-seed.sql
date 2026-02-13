-- Platform Roles Seed Script
-- This script creates additional platform roles with appropriate permissions
-- Run this after the permissions table has been populated

-- Note: Super Admin role already exists and should have ALL permissions
-- This script creates additional roles for granular access control

-- ============================================
-- ROLE 1: Platform Admin
-- ============================================
-- Can manage tenants and platform users, but not system-level configuration
-- Use case: Senior platform administrators who manage tenants and users

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) 
SELECT UUID(), 'Platform Admin', 'Manage tenants and platform users. Full access to tenant and user management, but limited system configuration access.', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Platform Admin');

-- Assign permissions to Platform Admin role
-- Tenant Management (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'tenant_management';

-- User Management (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'user_management'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1)
    AND rp.permission_id = permissions.id
  );

-- Theme Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'theme_management' AND action = 'read';

-- Schema Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'schema_management' AND action = 'read';

-- Library Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'library_management' AND action = 'read';

-- Platform Config (view analytics only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Platform Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE name = 'platform:view_analytics';

-- ============================================
-- ROLE 2: Support Admin
-- ============================================
-- Can view and manage users/tenants for support purposes, but cannot delete
-- Use case: Support team members who need to help users but shouldn't delete data

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) 
SELECT UUID(), 'Support Admin', 'Support team role. Can view and update tenants and users, but cannot delete or create new tenants.', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Support Admin');

-- Assign permissions to Support Admin role
-- Tenant Management (read, update, activate, suspend, view_usage - NO create/delete/provision)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'tenant_management' 
  AND action IN ('read', 'update', 'activate', 'suspend', 'view_usage');

-- User Management (read, update, impersonate - NO create/delete)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'user_management' 
  AND action IN ('read', 'update', 'impersonate');

-- Theme Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'theme_management' AND action = 'read';

-- Schema Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'schema_management' AND action = 'read';

-- Library Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'library_management' AND action = 'read';

-- Platform Config (view analytics only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Support Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE name = 'platform:view_analytics';

-- ============================================
-- ROLE 3: Content Manager
-- ============================================
-- Can manage themes, schemas, and library items
-- Use case: Content team members who manage platform-level content resources

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) 
SELECT UUID(), 'Content Manager', 'Manage platform-level content resources: themes, schema templates, and library items. Read-only access to tenants and users.', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Content Manager');

-- Assign permissions to Content Manager role
-- Tenant Management (read, view_usage only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'tenant_management' 
  AND action IN ('read', 'view_usage');

-- User Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'user_management' AND action = 'read';

-- Theme Management (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'theme_management';

-- Schema Management (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'schema_management';

-- Library Management (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'library_management';

-- Platform Config (view analytics only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Content Manager' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE name = 'platform:view_analytics';

-- ============================================
-- ROLE 4: System Admin
-- ============================================
-- Can manage system-level configuration and view system health
-- Use case: DevOps/Infrastructure team members

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) 
SELECT UUID(), 'System Admin', 'Manage system-level configuration, backups, logs, and health monitoring. Read-only access to tenants and users.', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'System Admin');

-- Assign permissions to System Admin role
-- Tenant Management (read, view_usage only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'tenant_management' 
  AND action IN ('read', 'view_usage');

-- User Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'user_management' AND action = 'read';

-- Theme Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'theme_management' AND action = 'read';

-- Schema Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'schema_management' AND action = 'read';

-- Library Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'library_management' AND action = 'read';

-- Platform Config (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'platform_config';

-- System Admin (all)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'System Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'system_admin';

-- ============================================
-- ROLE 5: Viewer (Read-Only)
-- ============================================
-- Can only view tenants, users, and analytics - no modifications
-- Use case: Executives, auditors, or read-only access for reporting

INSERT INTO `roles` (`id`, `name`, `description`, `permissions`, `is_system`, `created_at`, `updated_at`) 
SELECT UUID(), 'Viewer', 'Read-only access to view tenants, users, analytics, and content resources. No modification permissions.', NULL, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Viewer');

-- Assign permissions to Viewer role
-- Tenant Management (read, view_usage only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'tenant_management' 
  AND action IN ('read', 'view_usage');

-- User Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'user_management' AND action = 'read';

-- Theme Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'theme_management' AND action = 'read';

-- Schema Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'schema_management' AND action = 'read';

-- Library Management (read only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE category = 'library_management' AND action = 'read';

-- Platform Config (view analytics only)
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `created_at`)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Viewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM permissions
WHERE name = 'platform:view_analytics';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all roles and their permission counts
-- SELECT 
--     r.name as role_name,
--     r.description,
--     COUNT(rp.permission_id) as permission_count
-- FROM roles r
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id
-- GROUP BY r.id, r.name, r.description
-- ORDER BY permission_count DESC;

-- View permissions for a specific role (replace 'Platform Admin' with role name)
-- SELECT 
--     p.name as permission_name,
--     p.resource,
--     p.action,
--     p.category,
--     p.description
-- FROM role_permissions rp
-- JOIN permissions p ON rp.permission_id = p.id
-- JOIN roles r ON rp.role_id = r.id
-- WHERE r.name = 'Platform Admin'
-- ORDER BY p.category, p.resource, p.action;
