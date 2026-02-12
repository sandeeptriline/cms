-- =============================================================================
-- Verify Super Admin User
-- =============================================================================
-- This script verifies if the Super Admin user exists and is configured correctly
-- Run: sudo mysql cms_platform < scripts/verify-super-admin.sql
-- =============================================================================

USE cms_platform;

-- Check if Super Admin user exists
SELECT 
    'User Check' as check_type,
    u.id,
    u.email,
    u.name,
    u.status,
    CASE 
        WHEN u.status = 1 THEN 'Active ✓'
        ELSE 'Inactive ✗'
    END as status_check,
    CASE 
        WHEN u.password_hash IS NOT NULL AND LENGTH(u.password_hash) > 0 THEN 'Has Password ✓'
        ELSE 'No Password ✗'
    END as password_check,
    u.created_at,
    u.last_login_at
FROM users u
WHERE u.email = 'admin@example.com';

-- Check if user has Super Admin role
SELECT 
    'Role Check' as check_type,
    u.id as user_id,
    u.email,
    r.id as role_id,
    r.name as role_name,
    r.description,
    ur.created_at as role_assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@example.com'
AND r.name = 'Super Admin';

-- Summary
SELECT 
    'Summary' as check_type,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT CASE WHEN u.status = 1 THEN u.id END) as active_users,
    COUNT(DISTINCT ur.id) as role_assignments,
    COUNT(DISTINCT CASE WHEN r.name = 'Super Admin' THEN ur.id END) as super_admin_assignments
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@example.com';
