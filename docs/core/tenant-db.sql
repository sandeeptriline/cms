-- =============================================================================
-- PART 2: TENANT DATABASE (One per tenant)
-- =============================================================================
-- Database: cms_tenant_<tenant_id>

-- -----------------------------------------------------------------------------
-- 2.1 Projects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id                            CHAR(36)     NOT NULL PRIMARY KEY,
    name                          VARCHAR(255) NOT NULL,
    slug                          VARCHAR(100) NOT NULL,
    cloned_from_platform_theme_id CHAR(36)     NULL COMMENT 'Platform theme used for cloning',
    config                        JSON         NULL,
    feature_flags                 JSON         NULL,
    created_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_projects_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.2 Users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                   CHAR(36)     NOT NULL PRIMARY KEY,
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    name                 VARCHAR(255) NULL,
    avatar               VARCHAR(500) NULL,
    status               TINYINT      NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, -1 = deleted',
    
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

-- -----------------------------------------------------------------------------
-- 2.3 Roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    name         VARCHAR(50)  NOT NULL,
    description  VARCHAR(255) NULL,
    permissions  JSON         NULL COMMENT 'Legacy - migrate to permissions table',
    is_system    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.4 User Roles (M2M)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    id         CHAR(36)  NOT NULL PRIMARY KEY,
    user_id    CHAR(36)  NOT NULL,
    role_id    CHAR(36)  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_user_roles (user_id, role_id),
    INDEX idx_user_roles_role (role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.5 Project Members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_members (
    id         CHAR(36)  NOT NULL PRIMARY KEY,
    project_id CHAR(36)  NOT NULL,
    user_id    CHAR(36)  NOT NULL,
    role_id    CHAR(36)  NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_project_members (project_id, user_id),
    INDEX idx_project_members_user (user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.6 Security Tables
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    user_id         CHAR(36)     NOT NULL,
    token           VARCHAR(255) NOT NULL UNIQUE,
    expires_at      TIMESTAMP    NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_reset_tokens_user (user_id),
    INDEX idx_reset_tokens_expires (expires_at),
    CONSTRAINT fk_reset_tokens_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL,
    ip              VARCHAR(50)  NULL,
    success         TINYINT(1)   NOT NULL DEFAULT 0,
    user_agent      VARCHAR(255) NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_login_attempts_email (email),
    INDEX idx_login_attempts_ip (ip),
    INDEX idx_login_attempts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
    token           VARCHAR(64)  NOT NULL PRIMARY KEY,
    user_id         CHAR(36)     NULL,
    expires         TIMESTAMP    NOT NULL,
    ip              VARCHAR(50)  NULL,
    user_agent      VARCHAR(255) NULL,
    share_id        CHAR(36)     NULL,
    origin          VARCHAR(255) NULL COMMENT 'web, mobile, api',
    data            JSON         NULL COMMENT 'Session data',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expires (expires),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.7 API Keys
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL,
    name            VARCHAR(100) NOT NULL,
    key_hash        VARCHAR(255) NOT NULL,
    scope           ENUM('draft', 'published') NOT NULL,
    environment     VARCHAR(20)  NOT NULL DEFAULT 'prod',
    permissions     JSON         NULL COMMENT 'Scoped permissions for this key',
    rate_limit      INT          NULL COMMENT 'Requests per hour',
    expires_at      TIMESTAMP    NULL,
    last_used_at    TIMESTAMP    NULL,
    last_used_ip    VARCHAR(50)  NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_api_keys_project (project_id),
    INDEX idx_api_keys_last_used (last_used_at),
    CONSTRAINT fk_api_keys_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.8 Content Types
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_types (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    project_id        CHAR(36)     NOT NULL,
    name              VARCHAR(100) NOT NULL,
    collection        VARCHAR(100) NOT NULL,
    icon              VARCHAR(50)  NULL,
    `schema`          JSON         NOT NULL COMMENT 'Legacy - migrate to fields table',
    is_system         TINYINT(1)   NOT NULL DEFAULT 0,
    display_template  VARCHAR(255) NULL COMMENT 'Directus: template for list display',
    singleton         TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Single item per collection',
    archive_field     VARCHAR(64)  NULL COMMENT 'Field name for soft-delete/archive',
    sort_field        VARCHAR(64)  NULL COMMENT 'Default sort field',
    note              TEXT         NULL COMMENT 'Collection description',
    hidden            TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Hide from explore/sidebar',
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_content_types_project_collection (project_id, collection),
    INDEX idx_content_types_project (project_id),
    CONSTRAINT fk_content_types_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.9 Fields (NEW - Critical Improvement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fields (
    id                   CHAR(36)     NOT NULL PRIMARY KEY,
    content_type_id      CHAR(36)     NOT NULL,
    field                VARCHAR(64)  NOT NULL COMMENT 'Field name/key',
    type                 VARCHAR(64)  NOT NULL COMMENT 'string, text, integer, float, boolean, json, uuid, datetime, date, time, timestamp, file, files, m2o, o2m, m2m, m2a, translations',
    interface            VARCHAR(64)  NULL COMMENT 'UI widget: input, textarea, wysiwyg, select-dropdown, datetime, file, etc.',
    special              JSON         NULL COMMENT 'Special behaviors: ["cast-boolean", "uuid", "date-created", "user-created"]',
    options              JSON         NULL COMMENT 'Field-specific configuration',
    display              VARCHAR(64)  NULL COMMENT 'Display template: formatted-value, datetime, file, user, etc.',
    display_options      JSON         NULL,
    readonly             TINYINT(1)   NOT NULL DEFAULT 0,
    hidden               TINYINT(1)   NOT NULL DEFAULT 0,
    sort                 INT          NULL,
    width                VARCHAR(30)  NULL COMMENT 'half, full, fill',
    `group`              CHAR(36)     NULL COMMENT 'Field group/accordion ID',
    translation          JSON         NULL COMMENT 'Field labels per locale: {"en": "Title", "es": "Título"}',
    note                 TEXT         NULL COMMENT 'Helper text for editors',
    validation           JSON         NULL COMMENT 'Validation rules',
    validation_message   VARCHAR(255) NULL,
    required             TINYINT(1)   NOT NULL DEFAULT 0,
    conditions           JSON         NULL COMMENT 'Conditional visibility rules',
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_fields_collection_field (content_type_id, field),
    INDEX idx_fields_type (type),
    INDEX idx_fields_interface (interface),
    INDEX idx_fields_group (`group`),
    CONSTRAINT fk_fields_content_type FOREIGN KEY (content_type_id) 
        REFERENCES content_types(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.10 Relations (NEW - Critical Improvement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relations (
    id                          CHAR(36)     NOT NULL PRIMARY KEY,
    project_id                  CHAR(36)     NOT NULL COMMENT 'Relations are project-scoped',
    many_collection             VARCHAR(64)  NOT NULL COMMENT 'The "many" side collection',
    many_field                  VARCHAR(64)  NOT NULL COMMENT 'Foreign key field on many side',
    one_collection              VARCHAR(64)  NULL COMMENT 'The "one" side collection',
    one_field                   VARCHAR(64)  NULL COMMENT 'Optional reverse field (for O2M)',
    one_collection_field        VARCHAR(64)  NULL COMMENT 'For polymorphic (M2A): field storing collection name',
    one_allowed_collections     JSON         NULL COMMENT 'For polymorphic: allowed collections array',
    one_deselect_action         VARCHAR(64)  NOT NULL DEFAULT 'nullify' COMMENT 'nullify, delete',
    sort_field                  VARCHAR(64)  NULL COMMENT 'Field name for ordering related items',
    junction_field              VARCHAR(64)  NULL COMMENT 'For M2M: field in junction pointing back to origin',
    
    INDEX idx_relations_project (project_id),
    INDEX idx_relations_many (many_collection, many_field),
    INDEX idx_relations_one (one_collection, one_field),
    CONSTRAINT fk_relations_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.11 Permissions (NEW - Critical Improvement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL COMMENT 'Permissions scoped to project collections',
    role_id         CHAR(36)     NULL COMMENT 'Null = public access',
    collection      VARCHAR(64)  NOT NULL,
    action          VARCHAR(10)  NOT NULL COMMENT 'create, read, update, delete, share',
    permissions     JSON         NULL COMMENT 'Filter rules: {"status": {"_eq": "published"}}',
    validation      JSON         NULL COMMENT 'Validation rules on write operations',
    presets         JSON         NULL COMMENT 'Default values on create',
    fields          JSON         NULL COMMENT 'Allowed fields: null=all, []=none, ["*"]=all, ["field1","field2"]=specific',
    
    INDEX idx_permissions_project (project_id),
    INDEX idx_permissions_role (role_id),
    INDEX idx_permissions_collection (collection),
    INDEX idx_permissions_action (action),
    CONSTRAINT fk_permissions_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_permissions_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.12 Content Entries (Enhanced)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_entries (
    id                      CHAR(36)     NOT NULL PRIMARY KEY,
    content_type_id         CHAR(36)     NOT NULL,
    status                  ENUM('draft', 'review', 'approved', 'published') NOT NULL DEFAULT 'draft',
    published_version_id    CHAR(36)     NULL,
    published_at            TIMESTAMP    NULL,
    scheduled_publish_at    TIMESTAMP    NULL,
    scheduled_unpublish_at  TIMESTAMP    NULL,
    
    -- Enhanced columns for better performance
    title                   VARCHAR(255) NULL COMMENT 'Extracted for search/display',
    slug                    VARCHAR(255) NULL COMMENT 'URL-friendly identifier',
    search_index            TEXT         NULL COMMENT 'Full-text searchable content',
    
    created_by              CHAR(36)     NULL,
    updated_by              CHAR(36)     NULL,
    created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_content_entries_type (content_type_id),
    INDEX idx_content_entries_status (status),
    INDEX idx_content_entries_published (published_at),
    INDEX idx_content_slug (slug),
    INDEX idx_content_status_type_published (status, content_type_id, published_at),
    INDEX idx_content_scheduled_publish (scheduled_publish_at),
    INDEX idx_content_scheduled_unpublish (scheduled_unpublish_at),
    FULLTEXT INDEX ft_content_search (search_index),
    
    CONSTRAINT fk_content_entries_type FOREIGN KEY (content_type_id) 
        REFERENCES content_types(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_entries_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_content_entries_updated_by FOREIGN KEY (updated_by) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.13 Content Versions (Enhanced)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_versions (
    id             CHAR(36)     NOT NULL PRIMARY KEY,
    entry_id       CHAR(36)     NOT NULL,
    version_number INT          NOT NULL,
    data           JSON         NOT NULL,
    status         VARCHAR(20)  NULL,
    
    -- Enhanced versioning
    name           VARCHAR(255) NULL COMMENT 'Named snapshot/version',
    hash           VARCHAR(64)  NULL COMMENT 'Content hash for deduplication',
    delta          JSON         NULL COMMENT 'Changes from previous version',
    collection     VARCHAR(64)  NULL,
    item           VARCHAR(255) NULL,
    
    created_by     CHAR(36)     NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_content_versions_entry (entry_id),
    INDEX idx_versions_hash (hash),
    CONSTRAINT fk_content_versions_entry FOREIGN KEY (entry_id) 
        REFERENCES content_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_content_versions_created_by FOREIGN KEY (created_by) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Circular FK for published version
-- Note: This constraint may already exist if migration was run partially
-- The migration script should handle this error gracefully
-- For manual execution, drop the constraint first if it exists:
-- ALTER TABLE content_entries DROP FOREIGN KEY fk_content_entries_published_version;
ALTER TABLE content_entries
    ADD CONSTRAINT fk_content_entries_published_version
    FOREIGN KEY (published_version_id) REFERENCES content_versions(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2.14 Content Localization
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_entries_localized (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    entry_id   CHAR(36)     NOT NULL,
    locale     VARCHAR(10)  NOT NULL,
    data       JSON         NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_content_entries_localized (entry_id, locale),
    INDEX idx_content_entries_localized_locale (locale),
    CONSTRAINT fk_content_entries_localized_entry FOREIGN KEY (entry_id) 
        REFERENCES content_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.15 Activity (NEW - Replaces audit_logs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NULL COMMENT 'Project scope for faster filtering',
    action          VARCHAR(45)  NOT NULL COMMENT 'create, update, delete, login, comment, authenticate, run, etc.',
    user_id         CHAR(36)     NULL,
    timestamp       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip              VARCHAR(50)  NULL,
    user_agent      VARCHAR(255) NULL,
    collection      VARCHAR(64)  NOT NULL,
    item            VARCHAR(255) NOT NULL COMMENT 'Item ID',
    comment         TEXT         NULL COMMENT 'User comment on action',
    origin          VARCHAR(255) NULL COMMENT 'web, api, app, webhook, flow, etc.',
    
    INDEX idx_activity_project (project_id),
    INDEX idx_activity_user (user_id),
    INDEX idx_activity_collection (collection, item),
    INDEX idx_activity_timestamp (timestamp),
    INDEX idx_activity_action (action)
    -- Note: Foreign keys removed because MySQL doesn't support FKs on partitioned tables
    -- Foreign key constraints will be enforced at the application level
    -- Note: Partitioning removed - YEAR() function is timezone-dependent and not allowed
    -- For large activity tables, consider manual partitioning or archiving old data
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.16 Revisions (NEW - Complete change history)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisions (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NULL COMMENT 'Project scope for faster filtering',
    activity_id     CHAR(36)     NOT NULL,
    collection      VARCHAR(64)  NOT NULL,
    item            VARCHAR(255) NOT NULL,
    data            JSON         NULL COMMENT 'Complete snapshot of item at this revision',
    delta           JSON         NULL COMMENT 'Only changed fields (for efficiency)',
    parent_id       CHAR(36)     NULL COMMENT 'Previous revision in chain',
    version         INT          NULL COMMENT 'Optional sequential version number',
    
    INDEX idx_revisions_project (project_id),
    INDEX idx_revisions_activity (activity_id),
    INDEX idx_revisions_collection (collection, item),
    INDEX idx_revisions_parent (parent_id),
    CONSTRAINT fk_revisions_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_revisions_activity FOREIGN KEY (activity_id) 
        REFERENCES activity(id) ON DELETE CASCADE,
    CONSTRAINT fk_revisions_parent FOREIGN KEY (parent_id) 
        REFERENCES revisions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.17 Workflows
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    project_id        CHAR(36)     NOT NULL,
    content_type_id   CHAR(36)     NULL,
    name              VARCHAR(100) NOT NULL,
    steps             JSON         NULL,
    is_default        TINYINT(1)   NOT NULL DEFAULT 0,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflows_project (project_id),
    CONSTRAINT fk_workflows_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflows_content_type FOREIGN KEY (content_type_id) 
        REFERENCES content_types(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workflow_instances (
    id           CHAR(36)     NOT NULL PRIMARY KEY,
    workflow_id  CHAR(36)     NOT NULL,
    entry_id     CHAR(36)     NOT NULL,
    current_step VARCHAR(100) NULL,
    status       ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    assigned_to  CHAR(36)     NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_instances_workflow (workflow_id),
    INDEX idx_workflow_instances_entry (entry_id),
    CONSTRAINT fk_workflow_instances_workflow FOREIGN KEY (workflow_id) 
        REFERENCES workflows(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_instances_entry FOREIGN KEY (entry_id) 
        REFERENCES content_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_instances_assigned FOREIGN KEY (assigned_to) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.17b Workflow Comments (comments and rejection reasons on workflow instances)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_comments (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    instance_id CHAR(36)     NOT NULL,
    user_id     CHAR(36)     NOT NULL,
    comment     TEXT         NULL,
    type        ENUM('comment', 'rejection_reason') NOT NULL DEFAULT 'comment',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workflow_comments_instance (instance_id),
    CONSTRAINT fk_workflow_comments_instance FOREIGN KEY (instance_id)
        REFERENCES workflow_instances(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_comments_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.18 Webhooks (NEW)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhooks (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL,
    name            VARCHAR(255) NOT NULL,
    method          VARCHAR(10)  NOT NULL DEFAULT 'POST',
    url             VARCHAR(500) NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT 'active, inactive',
    data            TINYINT(1)   NOT NULL DEFAULT 1 COMMENT 'Include item data in payload',
    actions         JSON         NOT NULL COMMENT '["create", "update", "delete"]',
    collections     JSON         NOT NULL COMMENT '["posts", "pages", "users"]',
    headers         JSON         NULL COMMENT 'Custom HTTP headers',
    was_active_before_deprecation TINYINT(1) NULL,
    migrated_flow   CHAR(36)     NULL COMMENT 'ID of flow this webhook was migrated to',
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_webhooks_project (project_id),
    INDEX idx_webhooks_status (status),
    CONSTRAINT fk_webhooks_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.19 Flows (NEW - Automation Engine)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flows (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL,
    name            VARCHAR(255) NOT NULL,
    icon            VARCHAR(64)  NULL,
    color           VARCHAR(255) NULL,
    description     TEXT         NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'active',
    `trigger`       VARCHAR(64)  NULL COMMENT 'manual, webhook, event, schedule, operation',
    accountability  VARCHAR(16)  NULL COMMENT 'all, activity, $trigger, $full, $accountability',
    options         JSON         NULL COMMENT 'Trigger-specific configuration',
    operation       CHAR(36)     NULL COMMENT 'Root operation node ID',
    date_created    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_created    CHAR(36)     NULL,
    
    INDEX idx_flows_project (project_id),
    INDEX idx_flows_status (status),
    INDEX idx_flows_trigger (`trigger`),
    CONSTRAINT fk_flows_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_flows_user_created FOREIGN KEY (user_created) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operations (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    name            VARCHAR(255) NULL,
    `key`           VARCHAR(255) NOT NULL COMMENT 'Unique key within flow',
    type            VARCHAR(64)  NOT NULL COMMENT 'log, mail, notification, webhook, request, transform, condition, etc.',
    position_x      INT          NOT NULL,
    position_y      INT          NOT NULL,
    options         JSON         NULL COMMENT 'Operation-specific configuration',
    resolve         CHAR(36)     NULL COMMENT 'Next operation on success/true',
    reject          CHAR(36)     NULL COMMENT 'Next operation on failure/false',
    flow_id         CHAR(36)     NOT NULL,
    date_created    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_created    CHAR(36)     NULL,
    
    INDEX idx_operations_flow (flow_id),
    INDEX idx_operations_type (type),
    CONSTRAINT fk_operations_flow FOREIGN KEY (flow_id) 
        REFERENCES flows(id) ON DELETE CASCADE,
    CONSTRAINT fk_operations_user_created FOREIGN KEY (user_created) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.20 Comments (NEW - General purpose)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NULL COMMENT 'Project scope for faster filtering',
    collection      VARCHAR(64)  NOT NULL,
    item            VARCHAR(255) NOT NULL,
    comment         TEXT         NOT NULL,
    user_created    CHAR(36)     NULL,
    date_created    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_updated    CHAR(36)     NULL,
    date_updated    TIMESTAMP    NULL,
    
    INDEX idx_comments_project (project_id),
    INDEX idx_comments_collection (collection, item),
    INDEX idx_comments_user_created (user_created),
    CONSTRAINT fk_comments_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_user_created FOREIGN KEY (user_created) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_comments_user_updated FOREIGN KEY (user_updated) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.21 Presets (NEW - Saved views, filters, layouts)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS presets (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NULL COMMENT 'Per-project saved views',
    bookmark        VARCHAR(255) NULL COMMENT 'Bookmark name if saved',
    user_id         CHAR(36)     NULL COMMENT 'User-specific preset, null = role/global',
    role_id         CHAR(36)     NULL COMMENT 'Role-specific preset',
    collection      VARCHAR(64)  NULL,
    search          VARCHAR(100) NULL,
    layout          VARCHAR(100) NULL DEFAULT 'tabular' COMMENT 'tabular, cards, calendar, map, etc.',
    layout_query    JSON         NULL COMMENT 'Saved query params: limit, sort, page, etc.',
    layout_options  JSON         NULL COMMENT 'Layout-specific options',
    refresh_interval INT         NULL COMMENT 'Auto-refresh interval in seconds',
    filter          JSON         NULL COMMENT 'Saved filter conditions',
    icon            VARCHAR(64)  NULL,
    color           VARCHAR(255) NULL,
    
    INDEX idx_presets_project (project_id),
    INDEX idx_presets_user (user_id),
    INDEX idx_presets_role (role_id),
    INDEX idx_presets_collection (collection),
    CONSTRAINT fk_presets_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_presets_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_presets_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.22 Settings (NEW - Project configuration)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id                          CHAR(36)     NOT NULL PRIMARY KEY,
    project_id                  CHAR(36)     NULL,
    project_name                VARCHAR(100) NULL,
    project_descriptor          VARCHAR(255) NULL COMMENT 'Tagline',
    project_url                 VARCHAR(500) NULL,
    project_color               VARCHAR(255) NULL,
    project_logo                CHAR(36)     NULL,
    public_foreground           CHAR(36)     NULL,
    public_background           CHAR(36)     NULL,
    public_note                 TEXT         NULL,
    auth_login_attempts         INT          NULL DEFAULT 25,
    auth_password_policy        VARCHAR(100) NULL COMMENT 'Regex pattern',
    storage_asset_transform     VARCHAR(64)  NULL DEFAULT 'all',
    storage_asset_presets       JSON         NULL COMMENT 'Predefined image transformations',
    custom_css                  TEXT         NULL,
    storage_default_folder      CHAR(36)     NULL,
    basemaps                    JSON         NULL COMMENT 'Map configurations',
    mapbox_key                  VARCHAR(255) NULL,
    module_bar                  JSON         NULL COMMENT 'Module bar configuration',
    project_favicon             CHAR(36)     NULL,
    default_language            VARCHAR(10)  NULL DEFAULT 'en-US',
    custom_aspect_ratios        JSON         NULL,
    
    UNIQUE KEY uk_settings_project (project_id),
    CONSTRAINT fk_settings_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.23 Notifications (NEW)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    timestamp       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(16)  NULL DEFAULT 'inbox' COMMENT 'inbox, archived',
    recipient       CHAR(36)     NOT NULL,
    sender          CHAR(36)     NULL,
    subject         VARCHAR(255) NOT NULL,
    message         TEXT         NULL,
    collection      VARCHAR(64)  NULL,
    item            VARCHAR(255) NULL,
    
    INDEX idx_notifications_recipient (recipient),
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_timestamp (timestamp),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_sender FOREIGN KEY (sender) 
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.24 Shares (NEW - Temporary public access)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shares (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL,
    name            VARCHAR(255) NULL,
    collection      VARCHAR(64)  NOT NULL,
    item            VARCHAR(255) NOT NULL,
    role_id         CHAR(36)     NULL COMMENT 'Role permissions to apply',
    password        VARCHAR(255) NULL COMMENT 'Hashed password for protection',
    user_created    CHAR(36)     NULL,
    date_created    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_start      TIMESTAMP    NULL,
    date_end        TIMESTAMP    NULL,
    times_used      INT          NULL DEFAULT 0,
    max_uses        INT          NULL,
    
    INDEX idx_shares_project (project_id),
    INDEX idx_shares_collection (collection, item),
    INDEX idx_shares_user_created (user_created),
    INDEX idx_shares_date_end (date_end),
    CONSTRAINT fk_shares_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_shares_role FOREIGN KEY (role_id) 
        REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_shares_user_created FOREIGN KEY (user_created) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update sessions FK
ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_share FOREIGN KEY (share_id) 
    REFERENCES shares(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 2.25 Media Library
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_folders (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    project_id CHAR(36)     NOT NULL,
    parent_id  CHAR(36)     NULL,
    name       VARCHAR(255) NOT NULL,
    path       VARCHAR(500) NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_media_folders_project (project_id),
    INDEX idx_media_folders_parent (parent_id),
    CONSTRAINT fk_media_folders_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_folders_parent FOREIGN KEY (parent_id) 
        REFERENCES media_folders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
    id             CHAR(36)     NOT NULL PRIMARY KEY,
    project_id     CHAR(36)     NOT NULL,
    folder_id      CHAR(36)     NULL,
    filename       VARCHAR(255) NOT NULL,
    type           VARCHAR(20)  NOT NULL COMMENT 'image, video, document',
    mime_type      VARCHAR(100) NOT NULL,
    size           BIGINT       NOT NULL DEFAULT 0,
    width          INT          NULL,
    height         INT          NULL,
    metadata       JSON         NULL COMMENT 'alt, tags, etc',
    storage_driver VARCHAR(50)  NULL,
    storage_path   VARCHAR(500) NOT NULL,
    
    -- Enhanced metadata
    title          VARCHAR(255) NULL,
    description    TEXT         NULL,
    tags           JSON         NULL,
    focal_point_x  INT          NULL COMMENT 'Focal point percentage X',
    focal_point_y  INT          NULL COMMENT 'Focal point percentage Y',
    uploaded_by    CHAR(36)     NULL,
    uploaded_on    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by    CHAR(36)     NULL,
    modified_on    TIMESTAMP    NULL,
    charset        VARCHAR(50)  NULL,
    embed          VARCHAR(200) NULL COMMENT 'External embed ID',
    
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_media_assets_project (project_id),
    INDEX idx_media_assets_folder (folder_id),
    INDEX idx_media_type_mime (type, mime_type),
    INDEX idx_media_uploaded_on (uploaded_on),
    CONSTRAINT fk_media_assets_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_media_assets_folder FOREIGN KEY (folder_id) 
        REFERENCES media_folders(id) ON DELETE SET NULL,
    CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_media_modified_by FOREIGN KEY (modified_by) 
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_versions (
    id             CHAR(36)     NOT NULL PRIMARY KEY,
    asset_id       CHAR(36)     NOT NULL,
    transformation VARCHAR(100) NULL COMMENT 'resize, crop, format',
    storage_path   VARCHAR(500) NOT NULL,
    config         JSON         NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_media_versions_asset (asset_id),
    CONSTRAINT fk_media_versions_asset FOREIGN KEY (asset_id) 
        REFERENCES media_assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.26 Themes (Tenant copy/overrides)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS themes (
    id                 CHAR(36)     NOT NULL PRIMARY KEY,
    project_id         CHAR(36)     NOT NULL,
    parent_id          CHAR(36)     NULL,
    name               VARCHAR(100) NOT NULL,
    slug               VARCHAR(100) NOT NULL,
    version            VARCHAR(20)  NULL,
    design_tokens      JSON         NULL,
    component_variants JSON         NULL,
    presets            JSON         NULL,
    is_default         TINYINT(1)   NOT NULL DEFAULT 0,
    
    -- Enhanced theme management
    platform_theme_id  CHAR(36)     NULL COMMENT 'Reference to platform theme if cloned',
    customizations     JSON         NULL COMMENT 'Custom overrides to platform theme',
    
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_themes_project (project_id),
    INDEX idx_themes_parent (parent_id),
    INDEX idx_themes_platform (platform_theme_id),
    CONSTRAINT fk_themes_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_themes_parent FOREIGN KEY (parent_id) 
        REFERENCES themes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS theme_assignments (
    id         CHAR(36)     NOT NULL PRIMARY KEY,
    project_id CHAR(36)     NOT NULL,
    theme_id   CHAR(36)     NOT NULL,
    entry_id   CHAR(36)     NULL COMMENT 'Nullable for site-wide',
    scope      ENUM('site', 'page') NOT NULL DEFAULT 'site',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_theme_assignments_project (project_id),
    INDEX idx_theme_assignments_entry (entry_id),
    CONSTRAINT fk_theme_assignments_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_theme_assignments_theme FOREIGN KEY (theme_id) 
        REFERENCES themes(id) ON DELETE CASCADE,
    CONSTRAINT fk_theme_assignments_entry FOREIGN KEY (entry_id) 
        REFERENCES content_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.27 Localization
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS locales (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    project_id        CHAR(36)     NOT NULL,
    code              VARCHAR(10)  NOT NULL,
    name              VARCHAR(100) NOT NULL,
    is_default        TINYINT(1)   NOT NULL DEFAULT 0,
    fallback_locale   VARCHAR(10)  NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_locales_project_code (project_id, code),
    CONSTRAINT fk_locales_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seo_metadata (
    id                CHAR(36)     NOT NULL PRIMARY KEY,
    entry_id          CHAR(36)     NOT NULL,
    locale            VARCHAR(10)  NOT NULL,
    meta_title        VARCHAR(255) NULL,
    meta_description  TEXT         NULL,
    open_graph        JSON         NULL,
    canonical_url     VARCHAR(500) NULL,
    structured_data   JSON         NULL,
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_seo_metadata_entry_locale (entry_id, locale),
    CONSTRAINT fk_seo_metadata_entry FOREIGN KEY (entry_id) 
        REFERENCES content_entries(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2.28 Schema Cache (REST/OpenAPI — no GraphQL)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rest_schema_cache (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    project_id      CHAR(36)     NOT NULL,
    `schema`        LONGTEXT     NOT NULL COMMENT 'REST/OpenAPI schema snapshot for this project',
    checksum        VARCHAR(64)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_rest_schema_cache_project (project_id),
    INDEX idx_rest_schema_checksum (checksum),
    CONSTRAINT fk_rest_schema_cache_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_rate_limits (
    id              CHAR(36)     NOT NULL PRIMARY KEY,
    identifier      VARCHAR(255) NOT NULL COMMENT 'API key hash, IP address, or user ID',
    identifier_type VARCHAR(20)  NOT NULL COMMENT 'api_key, ip, user',
    endpoint        VARCHAR(255) NULL COMMENT 'Specific endpoint path',
    hits            INT          NOT NULL DEFAULT 0,
    window_start    TIMESTAMP    NOT NULL,
    window_end      TIMESTAMP    NOT NULL,
    
    UNIQUE KEY uk_rate_limit_window (identifier, identifier_type, endpoint, window_start),
    INDEX idx_rate_limits_identifier (identifier),
    INDEX idx_rate_limits_window (window_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;