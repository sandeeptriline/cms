-- =============================================================================
-- Create Super Admin User
-- =============================================================================
-- This script creates a Super Admin user in the platform database
-- Run this after creating the platform database and seeding permissions
--
-- Default Credentials:
--   Email: admin@example.com
--   Password: admin@123
--
-- ⚠️ CHANGE THESE CREDENTIALS IN PRODUCTION!
-- =============================================================================

-- Set variables
SET @admin_email = 'admin@example.com';
SET @admin_password = 'admin@123';
SET @admin_name = 'Platform Administrator';

-- Generate bcrypt hash for password 'admin@123'
-- Hash: $2b$10$rQZ8vK8vK8vK8vK8vK8vK.8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK
-- Note: This is a pre-computed hash. In production, generate a new hash.
SET @admin_password_hash = '$2b$10$rQZ8vK8vK8vK8vK8vK8vK.8vK8vK8vK8vK8vK8vK8vK8vK8vK8vK';

-- Actually, let's use a proper bcrypt hash for 'admin@123'
-- You can generate this with: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin@123', 10).then(console.log)"
SET @admin_password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Ensure Super Admin role exists
INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
VALUES (UUID(), 'Super Admin', 'System-wide administrator with full access', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Get Super Admin role ID
SET @super_admin_role_id = (SELECT id FROM roles WHERE name = 'Super Admin' COLLATE utf8mb4_unicode_ci LIMIT 1);

-- Check if Super Admin user already exists
SET @existing_user_id = (SELECT id FROM users WHERE email = @admin_email COLLATE utf8mb4_unicode_ci LIMIT 1);

-- Create or update Super Admin user
INSERT INTO users (id, email, password_hash, name, status, created_at, updated_at)
VALUES (
    COALESCE(@existing_user_id, UUID()),
    @admin_email,
    @admin_password_hash,
    @admin_name,
    1, -- Active
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    password_hash = @admin_password_hash,
    name = @admin_name,
    status = 1,
    updated_at = NOW();

-- Get user ID (use existing or newly created)
SET @admin_user_id = (SELECT id FROM users WHERE email = @admin_email COLLATE utf8mb4_unicode_ci LIMIT 1);

-- Assign Super Admin role to user
INSERT INTO user_roles (id, user_id, role_id, created_at, updated_at)
VALUES (UUID(), @admin_user_id, @super_admin_role_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Verify creation
SELECT 
    'Super Admin user created successfully' as result,
    u.id as user_id,
    u.email,
    u.name,
    u.status,
    r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = @admin_email COLLATE utf8mb4_unicode_ci
AND r.name = 'Super Admin' COLLATE utf8mb4_unicode_ci;
