-- =============================================================================
-- Tenant DB initialization – Composable Content Graph CMS (v2)
-- =============================================================================
-- Source: docs/core/composable_content_graph_cms_schema_v2.md
-- Use: When creating a new tenant (run after CREATE DATABASE and USE db).
-- For existing tenants with wrong/missing structure: run tenant-db-reset-v2.sql
-- first (drops all tables), then run this file.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Projects (logical boundary)
-- slug: for tenant portal routing; config/feature_flags: optional JSON.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL DEFAULT 'default',
    description TEXT,
    created_by CHAR(36),
    cloned_from_platform_theme_id CHAR(36) NULL,
    config JSON,
    feature_flags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_projects_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Datasets
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datasets (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_datasets_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Collections (schema registry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    dataset_id CHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_project_slug (project_id, slug),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE SET NULL,
    INDEX idx_collections_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Fields
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fields (
    id CHAR(36) PRIMARY KEY,
    collection_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    config JSON,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    INDEX idx_fields_collection (collection_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- For existing DBs created before sort_order was added, run:
-- ALTER TABLE fields ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER config;

-- -----------------------------------------------------------------------------
-- 5. Components
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS components (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_component_slug (project_id, slug),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_components_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Component fields
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS component_fields (
    id CHAR(36) PRIMARY KEY,
    component_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSON,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    INDEX idx_component_fields_component (component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Content nodes (unified node store)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_nodes (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    dataset_id CHAR(36) NULL,
    node_type VARCHAR(50) NOT NULL,
    schema_ref_id CHAR(36) NOT NULL,
    data JSON NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_nodes_project (project_id, node_type),
    INDEX idx_nodes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Dynamic zones (graph composition)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_compositions (
    id CHAR(36) PRIMARY KEY,
    parent_node_id CHAR(36) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    child_node_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (child_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_zone_position (parent_node_id, zone_name, position),
    INDEX idx_composition_parent (parent_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Relations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS content_relations (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    source_node_id CHAR(36) NOT NULL,
    target_node_id CHAR(36) NOT NULL,
    relation_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    INDEX idx_relation_source (source_node_id),
    INDEX idx_relation_target (target_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Versioning
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS node_versions (
    id CHAR(36) PRIMARY KEY,
    node_id CHAR(36) NOT NULL,
    version_number INT NOT NULL,
    snapshot JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_node_version (node_id, version_number),
    INDEX idx_versions_node (node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Media
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(150),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_media_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. Users (RBAC)
-- Compatible with TenantUsersService and Auth: name, avatar, last_login_at,
-- updated_at; status as TINYINT (1 = active, 0 = inactive, -1 = deleted).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    name VARCHAR(255) NULL,
    avatar VARCHAR(500) NULL,
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1 = active, 0 = inactive, -1 = deleted',
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_email (email),
    INDEX idx_users_email (email),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Roles (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_roles_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. User roles (M2M)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_role (user_id, role_id),
    INDEX idx_user_roles_user (user_id),
    INDEX idx_user_roles_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Permissions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
    id CHAR(36) PRIMARY KEY,
    role_id CHAR(36) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    INDEX idx_permissions_role (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. Project domains (domain-bound API)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_domains (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    primary_domain VARCHAR(255) NOT NULL,
    api_domain VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_primary_domain (primary_domain),
    UNIQUE KEY uniq_api_domain (api_domain),
    INDEX idx_project_domains_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
