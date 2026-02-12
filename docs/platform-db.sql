-- =============================================================================
-- PART 1: PLATFORM DATABASE
-- =============================================================================
-- Database: cms_platform

-- -----------------------------------------------------------------------------
-- 1.1 Tenants (Multi-Tenancy Core)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    parent_id       CHAR(36)     NULL,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    db_name         VARCHAR(100) NOT NULL UNIQUE,
    db_host         VARCHAR(255) NULL,
    db_connection   VARCHAR(500) NULL COMMENT 'Encrypted connection string',
    status          ENUM('provisioning', 'active', 'suspended', 'deleted') NOT NULL DEFAULT 'provisioning',
    config          JSON         NULL,
    feature_flags   JSON         NULL,
    usage_limits    JSON         NULL COMMENT 'Storage, API calls, users limits',
    
    -- Enhanced resource tracking
    storage_used    BIGINT       NULL DEFAULT 0 COMMENT 'Bytes used',
    storage_limit   BIGINT       NULL COMMENT 'Bytes allowed',
    api_calls_today INT          NULL DEFAULT 0,
    api_calls_limit INT          NULL COMMENT 'Requests per day',
    users_count     INT          NULL DEFAULT 0,
    users_limit     INT          NULL,
    last_activity_at TIMESTAMP   NULL,
    
    provisioned_at  TIMESTAMP    NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenants_status (status),
    INDEX idx_tenants_parent (parent_id),
    INDEX idx_tenants_activity (last_activity_at),
    CONSTRAINT fk_tenants_parent FOREIGN KEY (parent_id) 
        REFERENCES tenants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.2 Users (Super Admin Only)
-- -----------------------------------------------------------------------------
-- Only one Super Admin user is allowed in the system
-- Note: Table name is 'users' (same as tenant database) but in platform database
CREATE TABLE IF NOT EXISTS users (
    id                   CHAR(36)     NOT NULL PRIMARY KEY,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    name                 VARCHAR(255) NULL,
    avatar               VARCHAR(500) NULL,
    status               TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive',
    
    -- Enhanced authentication
    email_verified_at    TIMESTAMP    NULL,
    verification_token   VARCHAR(255) NULL,
    provider             VARCHAR(50)  NULL COMMENT 'local, google, github, azure, etc.',
    external_identifier  VARCHAR(255) NULL COMMENT 'OAuth provider user ID',
    
    -- Multi-factor authentication
    mfa_enabled          TINYINT(1)   NOT NULL DEFAULT 0,
    mfa_secret           VARCHAR(255) NULL,
    
    -- User preferences
    preferences          JSON         NULL COMMENT 'UI preferences, layout settings',
    language             VARCHAR(10)  NULL DEFAULT 'en',
    theme                VARCHAR(20)  NULL DEFAULT 'auto' COMMENT 'light, dark, auto',
    
    last_login_at        TIMESTAMP    NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_users_email (email),
    INDEX idx_users_status (status),
    INDEX idx_users_provider (provider),
    INDEX idx_users_email_verified (email_verified_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: status field values:
-- 1 = active (user can login and access the system)
-- 0 = inactive (user is disabled and cannot login)

-- Constraint: Only one active Super Admin user allowed
-- This is enforced at application level, but we add a check constraint for safety
-- Note: MySQL doesn't support CHECK constraints in older versions, so this is enforced in application code

-- -----------------------------------------------------------------------------
-- 1.3 Roles
-- -----------------------------------------------------------------------------
-- Platform-level roles (primarily for Super Admin)
-- Only "Super Admin" role should exist in this table
-- Note: Table name is 'roles' (same as tenant database) but in platform database
CREATE TABLE IF NOT EXISTS roles (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,
    description  VARCHAR(255) NULL,
    permissions  JSON         NULL COMMENT 'Legacy - migrate to permissions table',
    is_system    TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'System roles cannot be deleted',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.4 User Roles (M2M)
-- -----------------------------------------------------------------------------
-- Links users to roles
-- Super Admin user will have "Super Admin" role assigned here
-- Note: Table name is 'user_roles' (same as tenant database) but in platform database
CREATE TABLE IF NOT EXISTS user_roles (
    id         CHAR(36)  NOT NULL PRIMARY KEY,
    user_id    CHAR(36)  NOT NULL,
    role_id    CHAR(36)  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_roles (user_id, role_id),
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.5 Permissions
-- -----------------------------------------------------------------------------
-- Platform-level permissions (granular access control)
-- Permission naming: resource:action (e.g., "tenant:create", "user:delete")
CREATE TABLE IF NOT EXISTS permissions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE COMMENT 'e.g., "tenant:create"',
    resource        VARCHAR(50)  NOT NULL COMMENT 'e.g., "tenant", "user", "theme"',
    action          VARCHAR(20)  NOT NULL COMMENT 'e.g., "create", "read", "update", "delete"',
    description     VARCHAR(255) NULL,
    category        VARCHAR(50)  NULL COMMENT 'e.g., "tenant_management", "user_management"',
    is_system       TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'System permissions cannot be deleted',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_permissions_name (name),
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action),
    INDEX idx_permissions_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.6 Role Permissions (M2M)
-- -----------------------------------------------------------------------------
-- Links roles to permissions
-- Maps which permissions each role has
CREATE TABLE IF NOT EXISTS role_permissions (
    id            CHAR(36)  NOT NULL PRIMARY KEY,
    role_id       CHAR(36)  NOT NULL,
    permission_id CHAR(36)  NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_permissions (role_id, permission_id),
    INDEX idx_role_permissions_role (role_id),
    INDEX idx_role_permissions_permission (permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.7 Tenant Usage Tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_usage (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)     NOT NULL,
    metric          VARCHAR(50)  NOT NULL COMMENT 'api_calls, storage, bandwidth, users',
    value           BIGINT       NOT NULL,
    date            DATE         NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_usage (tenant_id, metric, date),
    INDEX idx_tenant_usage_tenant (tenant_id),
    INDEX idx_tenant_usage_date (date),
    CONSTRAINT fk_tenant_usage_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.8 Platform Search Index (Cross-tenant search)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_search_index (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    tenant_id       CHAR(36)     NOT NULL,
    project_id      CHAR(36)     NULL COMMENT 'Project (in tenant DB) this item belongs to; app-populated when syncing',
    collection      VARCHAR(64)  NOT NULL,
    item_id         VARCHAR(255) NOT NULL,
    title           VARCHAR(255) NULL,
    content         TEXT         NULL,
    metadata        JSON         NULL,
    indexed_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_search_tenant (tenant_id),
    INDEX idx_search_project (project_id),
    INDEX idx_search_collection (collection),
    FULLTEXT INDEX ft_search_content (title, content),
    CONSTRAINT fk_search_tenant FOREIGN KEY (tenant_id) 
        REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.9 Schema Templates (Reusable Content Type Definitions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_templates (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    collection  VARCHAR(100) NOT NULL UNIQUE,
    category    ENUM('page', 'layout', 'navigation', 'block', 'form', 'blog', 'settings', 'system') NOT NULL,
    icon        VARCHAR(50)  NULL,
    `schema`    JSON         NOT NULL COMMENT 'Field definitions (will migrate to fields table per tenant)',
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_schema_templates_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.10 Library Items (Consolidated: Pages, Components, Menus)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_items (
    id                  CHAR(36)     NOT NULL PRIMARY KEY,
    type                ENUM('page', 'component', 'menu', 'section', 'block') NOT NULL,
    schema_template_id  CHAR(36)     NOT NULL,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL,
    category            VARCHAR(50)  NULL COMMENT 'hero, footer, cta, pricing, testimonial, etc.',
    description         TEXT         NULL,
    preview_image       CHAR(36)     NULL,
    default_structure   JSON         NULL,
    tags                JSON         NULL,
    is_premium          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_library_items_type_slug (type, slug),
    INDEX idx_library_items_template (schema_template_id),
    INDEX idx_library_items_type (type),
    INDEX idx_library_items_category (category),
    CONSTRAINT fk_library_items_template FOREIGN KEY (schema_template_id) 
        REFERENCES schema_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.11 Themes (Platform Library)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS themes (
    id                 CHAR(36)     NOT NULL PRIMARY KEY,
    parent_id          CHAR(36)     NULL,
    name               VARCHAR(100) NOT NULL,
    slug               VARCHAR(100) NOT NULL UNIQUE,
    version            VARCHAR(20)  NULL,
    design_tokens      JSON         NULL COMMENT 'Colors, typography, spacing',
    component_variants JSON         NULL COMMENT 'Button styles, card layouts, etc.',
    presets            JSON         NULL COMMENT 'Page and section presets',
    is_system          TINYINT(1)   NOT NULL DEFAULT 0,
    
    -- Enhanced metadata
    template_json      JSON         NULL COMMENT 'Exportable theme configuration',
    preview_url        VARCHAR(500) NULL,
    preview_image      CHAR(36)     NULL,
    author             VARCHAR(255) NULL,
    license            VARCHAR(100) NULL DEFAULT 'MIT',
    tags               JSON         NULL,
    downloads          INT          NULL DEFAULT 0,
    rating             DECIMAL(3,2) NULL,
    
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_themes_parent (parent_id),
    CONSTRAINT fk_themes_parent FOREIGN KEY (parent_id) 
        REFERENCES themes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.12 Theme Schema Bundles (Theme → Schema Templates)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theme_schema_bundles (
    id                  CHAR(36)     NOT NULL PRIMARY KEY,
    theme_id            CHAR(36)     NOT NULL,
    schema_template_id  CHAR(36)     NOT NULL,
    sort_order          INT          NOT NULL DEFAULT 0,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tsb_theme (theme_id),
    INDEX idx_tsb_template (schema_template_id),
    CONSTRAINT fk_tsb_theme FOREIGN KEY (theme_id) 
        REFERENCES themes(id) ON DELETE CASCADE,
    CONSTRAINT fk_tsb_template FOREIGN KEY (schema_template_id) 
        REFERENCES schema_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.13 Theme Library Bundles (Theme → Library Items)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theme_library_bundles (
    id                   CHAR(36)     NOT NULL PRIMARY KEY,
    theme_id             CHAR(36)     NOT NULL,
    library_item_id      CHAR(36)     NOT NULL,
    sort_order           INT          NOT NULL DEFAULT 0,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tlb_theme (theme_id),
    INDEX idx_tlb_item (library_item_id),
    CONSTRAINT fk_tlb_theme FOREIGN KEY (theme_id) 
        REFERENCES themes(id) ON DELETE CASCADE,
    CONSTRAINT fk_tlb_item FOREIGN KEY (library_item_id) 
        REFERENCES library_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.14 Extensions (Plugin System)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS extensions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    enabled         TINYINT(1)   NOT NULL DEFAULT 1,
    bundle          VARCHAR(64)  NULL COMMENT 'app, api, hybrid',
    version         VARCHAR(20)  NULL,
    `schema`        JSON         NULL COMMENT 'Extension metadata, hooks, permissions',
    meta            JSON         NULL COMMENT 'Author, description, config',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_extensions_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.15 Translations (System UI)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS translations (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    `key`           VARCHAR(255) NOT NULL,
    language        VARCHAR(10)  NOT NULL,
    value           TEXT         NOT NULL,
    
    UNIQUE KEY uk_translations_key_lang (`key`, language),
    INDEX idx_translations_lang (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 1.16 Migrations (Database Version Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migrations (
    version         VARCHAR(255) NOT NULL PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    timestamp       TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
