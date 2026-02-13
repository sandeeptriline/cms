-- =============================================================================
-- Add Form Element Permissions to Existing Tenant Database
-- =============================================================================
-- This script adds form_element permissions to an existing tenant database
-- Run this script for each tenant database that needs form element permissions
--
-- Usage:
--   mysql -u root -p cms_tenant_<tenant_slug> < add-form-element-permissions.sql
-- =============================================================================

-- Add form element permissions if they don't exist
INSERT INTO user_role_permissions (id, name, resource, action, description, category, is_system, created_at, updated_at)
SELECT 
  UUID(), 'form_element:create', 'form_element', 'create', 'Create new form elements', 'content_management', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_permissions WHERE name = 'form_element:create');

INSERT INTO user_role_permissions (id, name, resource, action, description, category, is_system, created_at, updated_at)
SELECT 
  UUID(), 'form_element:read', 'form_element', 'read', 'View form elements', 'content_management', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_permissions WHERE name = 'form_element:read');

INSERT INTO user_role_permissions (id, name, resource, action, description, category, is_system, created_at, updated_at)
SELECT 
  UUID(), 'form_element:update', 'form_element', 'update', 'Update form elements', 'content_management', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_permissions WHERE name = 'form_element:update');

INSERT INTO user_role_permissions (id, name, resource, action, description, category, is_system, created_at, updated_at)
SELECT 
  UUID(), 'form_element:delete', 'form_element', 'delete', 'Delete form elements', 'content_management', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM user_role_permissions WHERE name = 'form_element:delete');

-- Assign form_element permissions to Admin role (Admin gets all permissions)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE name IN ('form_element:create', 'form_element:read', 'form_element:update', 'form_element:delete')
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Assign form_element:read to Editor role (read-only access)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Editor' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE name = 'form_element:read'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Editor' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Verify permissions were added
SELECT name, resource, action, description FROM user_role_permissions WHERE name LIKE 'form_element:%' ORDER BY name;

-- Verify permissions were assigned to roles
SELECT r.name as role_name, p.name as permission_name
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN user_role_permissions p ON rp.permission_id = p.id
WHERE p.name LIKE 'form_element:%'
ORDER BY r.name, p.name;
