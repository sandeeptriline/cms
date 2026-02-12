-- =============================================================================
-- Seed Platform Permissions
-- =============================================================================
-- This script seeds all platform-level permissions into the permissions table
-- Run this after creating the permissions table

-- -----------------------------------------------------------------------------
-- Tenant Management Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'tenant:create', 'tenant', 'create', 'Create new tenant', 'tenant_management', 1),
(UUID(), 'tenant:read', 'tenant', 'read', 'View tenant list and details', 'tenant_management', 1),
(UUID(), 'tenant:update', 'tenant', 'update', 'Update tenant information', 'tenant_management', 1),
(UUID(), 'tenant:delete', 'tenant', 'delete', 'Delete tenant', 'tenant_management', 1),
(UUID(), 'tenant:activate', 'tenant', 'activate', 'Activate suspended tenant', 'tenant_management', 1),
(UUID(), 'tenant:suspend', 'tenant', 'suspend', 'Suspend active tenant', 'tenant_management', 1),
(UUID(), 'tenant:provision', 'tenant', 'provision', 'Trigger tenant provisioning', 'tenant_management', 1),
(UUID(), 'tenant:view_usage', 'tenant', 'view_usage', 'View tenant usage metrics', 'tenant_management', 1);

-- -----------------------------------------------------------------------------
-- User Management Permissions (Cross-Tenant)
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'user:create', 'user', 'create', 'Create user in any tenant', 'user_management', 1),
(UUID(), 'user:read', 'user', 'read', 'View user in any tenant', 'user_management', 1),
(UUID(), 'user:update', 'user', 'update', 'Update user in any tenant', 'user_management', 1),
(UUID(), 'user:delete', 'user', 'delete', 'Delete user in any tenant', 'user_management', 1),
(UUID(), 'user:impersonate', 'user', 'impersonate', 'Impersonate user (for support)', 'user_management', 1);

-- -----------------------------------------------------------------------------
-- Theme Management Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'theme:create', 'theme', 'create', 'Create new theme', 'theme_management', 1),
(UUID(), 'theme:read', 'theme', 'read', 'View themes', 'theme_management', 1),
(UUID(), 'theme:update', 'theme', 'update', 'Update theme', 'theme_management', 1),
(UUID(), 'theme:delete', 'theme', 'delete', 'Delete theme', 'theme_management', 1),
(UUID(), 'theme:publish', 'theme', 'publish', 'Publish theme to library', 'theme_management', 1);

-- -----------------------------------------------------------------------------
-- Schema Template Management Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'schema_template:create', 'schema_template', 'create', 'Create schema template', 'schema_management', 1),
(UUID(), 'schema_template:read', 'schema_template', 'read', 'View schema templates', 'schema_management', 1),
(UUID(), 'schema_template:update', 'schema_template', 'update', 'Update schema template', 'schema_management', 1),
(UUID(), 'schema_template:delete', 'schema_template', 'delete', 'Delete schema template', 'schema_management', 1);

-- -----------------------------------------------------------------------------
-- Library Item Management Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'library_item:create', 'library_item', 'create', 'Create library item', 'library_management', 1),
(UUID(), 'library_item:read', 'library_item', 'read', 'View library items', 'library_management', 1),
(UUID(), 'library_item:update', 'library_item', 'update', 'Update library item', 'library_management', 1),
(UUID(), 'library_item:delete', 'library_item', 'delete', 'Delete library item', 'library_management', 1);

-- -----------------------------------------------------------------------------
-- Platform Configuration Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'platform:configure', 'platform', 'configure', 'Configure platform settings', 'platform_config', 1),
(UUID(), 'platform:view_analytics', 'platform', 'view_analytics', 'View platform analytics', 'platform_config', 1),
(UUID(), 'platform:manage_extensions', 'platform', 'manage_extensions', 'Manage extensions', 'platform_config', 1),
(UUID(), 'platform:manage_translations', 'platform', 'manage_translations', 'Manage translations', 'platform_config', 1);

-- -----------------------------------------------------------------------------
-- System Administration Permissions
-- -----------------------------------------------------------------------------
INSERT INTO permissions (id, name, resource, action, description, category, is_system) VALUES
(UUID(), 'system:view_logs', 'system', 'view_logs', 'View system logs', 'system_admin', 1),
(UUID(), 'system:manage_backups', 'system', 'manage_backups', 'Manage backups', 'system_admin', 1),
(UUID(), 'system:view_health', 'system', 'view_health', 'View system health', 'system_admin', 1);

-- =============================================================================
-- Assign All Permissions to Super Admin Role
-- =============================================================================
-- This assigns all permissions to the "Super Admin" role
-- Run this after seeding permissions and creating the Super Admin role

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1) as role_id,
    id as permission_id
FROM permissions
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1)
    AND rp.permission_id = permissions.id
);
