-- =============================================================================
-- Assign Permissions to Tenant Roles
-- =============================================================================
-- This script assigns permissions to default tenant roles
-- Run this AFTER seeding both roles and permissions
--
-- Usage:
--   mysql -u root -p cms_tenant_<tenant_slug> < tenant-role-permissions-assign.sql
-- =============================================================================

-- Admin Role: All permissions
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Editor Role: Content management, media, navigation (no user/role management, no settings)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Editor' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE (category IN ('content_management', 'media_management')
   OR name IN ('navigation:create', 'navigation:read', 'navigation:update', 'navigation:delete')
   OR name IN ('workflow:read', 'workflow:approve', 'workflow:reject'))
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Editor' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Reviewer Role: Read content, approve/reject workflows (no create/update/delete)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Reviewer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE ((action = 'read' AND resource IN ('content_type', 'content_entry', 'page', 'block', 'media', 'navigation'))
   OR name IN ('workflow:read', 'workflow:approve', 'workflow:reject'))
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Reviewer' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Author Role: Create and update own content (no publish, no delete, no media management)
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'Author' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE ((action IN ('create', 'read', 'update') AND resource IN ('content_entry', 'page', 'block'))
   OR name IN ('content_type:read', 'workflow:read'))
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'Author' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- API Consumer Role: Read-only API access
INSERT INTO role_permissions (id, role_id, permission_id, created_at)
SELECT 
    UUID() as id,
    (SELECT id FROM roles WHERE name = 'API Consumer' LIMIT 1) as role_id,
    id as permission_id,
    NOW() as created_at
FROM user_role_permissions
WHERE name = 'api:read'
AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'API Consumer' LIMIT 1)
    AND rp.permission_id = user_role_permissions.id
);

-- Verify role permissions assignments
SELECT 
    r.name AS role_name,
    COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name IN ('Admin', 'Editor', 'Reviewer', 'Author', 'API Consumer')
GROUP BY r.id, r.name
ORDER BY r.name;
