-- =============================================================================
-- Tenant Role-Based Permissions Tables
-- =============================================================================
-- This script creates permissions and role_permissions tables for tenant databases
-- These are separate from the content-level permissions table (2.11)
-- 
-- Usage:
--   mysql -u root -p cms_tenant_<tenant_slug> < tenant-role-permissions-tables.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tenant-Level Permissions Table
-- -----------------------------------------------------------------------------
-- This table stores tenant-level permissions (resource:action pattern)
-- Separate from content-level permissions (2.11 permissions table)
--
-- is_system field:
--   - 1 = System permission (cannot be deleted, core to application functionality)
--   - 0 = Custom permission (can be created/deleted by tenant admins)
-- System permissions are seeded during tenant setup and should not be removed
-- as they are required for core features to work properly.
CREATE TABLE IF NOT EXISTS user_role_permissions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., "content_type:create", "user:read"',
    resource        VARCHAR(50)  NOT NULL COMMENT 'e.g., "content_type", "user", "role", "media"',
    action          VARCHAR(20)  NOT NULL COMMENT 'e.g., "create", "read", "update", "delete"',
    description     VARCHAR(255) NULL,
    category        VARCHAR(50)  NULL COMMENT 'e.g., "content_management", "user_management"',
    is_system       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = system (cannot delete), 0 = custom (can delete)',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_role_permissions_name (name),
    INDEX idx_user_role_permissions_resource (resource),
    INDEX idx_user_role_permissions_action (action),
    INDEX idx_user_role_permissions_category (category),
    INDEX idx_user_role_permissions_is_system (is_system)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Role Permissions Table (M2M)
-- -----------------------------------------------------------------------------
-- Links tenant roles to tenant permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    role_id       CHAR(36)  NOT NULL,
    permission_id CHAR(36)  NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by    CHAR(36)  NULL COMMENT 'User ID (Super Admin or tenant user) who last updated this permission assignment',
    
    UNIQUE KEY uk_role_permissions (role_id, permission_id),
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id),
    INDEX idx_role_permissions_updated_by (updated_by),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES user_role_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SELECT 'user_role_permissions table created' AS status;
SELECT 'role_permissions table created' AS status;
