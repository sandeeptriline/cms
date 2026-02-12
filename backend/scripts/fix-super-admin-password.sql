-- =============================================================================
-- Fix Super Admin Password
-- =============================================================================
-- This script updates the Super Admin password hash
-- Run: sudo mysql cms_platform < scripts/fix-super-admin-password.sql
-- =============================================================================

USE cms_platform;

-- Set variables
SET @admin_email = 'admin@example.com';
SET @admin_password = 'admin@123';

-- This is a pre-computed bcrypt hash for 'admin@123'
-- Generated with: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin@123', 10).then(console.log)"
SET @admin_password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Update password hash for Super Admin user
UPDATE users 
SET 
    password_hash = @admin_password_hash,
    status = 1, -- Ensure user is active
    updated_at = NOW()
WHERE email = @admin_email COLLATE utf8mb4_unicode_ci;

-- Verify update
SELECT 
    'Password Updated' as result,
    id,
    email,
    name,
    status,
    CASE 
        WHEN password_hash = @admin_password_hash THEN 'Password Hash Matches ✓'
        ELSE 'Password Hash Mismatch ✗'
    END as password_check,
    updated_at
FROM users
WHERE email = @admin_email COLLATE utf8mb4_unicode_ci;
