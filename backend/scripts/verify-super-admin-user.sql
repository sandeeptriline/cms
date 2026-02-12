-- Verify Super Admin User
-- Run: sudo mysql cms_platform < verify-super-admin-user.sql

-- Check if user exists
SELECT '=== USER EXISTS CHECK ===' as '';
SELECT id, email, name, status, created_at 
FROM users 
WHERE email = 'admin@platform.com';

-- Check user roles
SELECT '=== USER ROLES CHECK ===' as '';
SELECT u.email, u.status as user_status, r.name as role_name, r.id as role_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@platform.com';

-- Check if Super Admin role exists
SELECT '=== SUPER ADMIN ROLE EXISTS ===' as '';
SELECT id, name, description, is_system 
FROM roles 
WHERE name = 'Super Admin';

-- Check user status (should be 1 for active)
SELECT '=== USER STATUS CHECK ===' as '';
SELECT email, status, 
       CASE 
         WHEN status = 1 THEN '✅ Active'
         WHEN status = 0 THEN '❌ Inactive'
         ELSE '⚠️ Unknown'
       END as status_text
FROM users 
WHERE email = 'admin@platform.com';
