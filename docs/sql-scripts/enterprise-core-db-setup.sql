-- =============================================================================
-- Enterprise Headless CMS – Core Control Plane Database Setup
-- =============================================================================
-- Source: docs/core/enterprise_headless_cms_core_db_architecture.md
-- Run this script to create the Control Plane schema (tables only).
-- Run enterprise-core-db-seed.sql after this to insert required seed data.
-- =============================================================================

-- Optional: create database and select it (comment out if DB already exists)
-- CREATE DATABASE IF NOT EXISTS cms_control_plane CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE cms_control_plane;

-- =============================================================================
-- 1. SHARDS
-- =============================================================================
CREATE TABLE IF NOT EXISTS shards (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  db_host VARCHAR(255) NOT NULL,
  db_cluster VARCHAR(100) DEFAULT NULL,
  status ENUM('active','maintenance','offline') DEFAULT 'active',
  tenant_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_shards_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. TENANTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id CHAR(36) NOT NULL,
  parent_id CHAR(36) DEFAULT NULL,
  shard_id CHAR(36) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  db_name VARCHAR(100) NOT NULL COMMENT 'Tenant DB name for routing (e.g. cms_tenant_slug)',
  db_user VARCHAR(64) DEFAULT NULL,
  db_password VARCHAR(255) DEFAULT NULL,
  db_host VARCHAR(255) DEFAULT NULL,
  db_connection VARCHAR(500) DEFAULT NULL,
  status ENUM('provisioning','active','suspended','deleted') DEFAULT 'provisioning',
  plan_id CHAR(36) DEFAULT NULL,
  config JSON DEFAULT NULL,
  feature_flags JSON DEFAULT NULL,
  usage_limits JSON DEFAULT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT NULL,
  api_calls_today INT DEFAULT 0,
  api_calls_limit INT DEFAULT NULL,
  users_count INT DEFAULT 0,
  users_limit INT DEFAULT NULL,
  last_activity_at TIMESTAMP NULL,
  provisioned_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tenants_slug (slug),
  UNIQUE KEY uk_tenants_db_name (db_name),
  KEY idx_tenants_shard (shard_id),
  KEY idx_tenants_parent (parent_id),
  KEY idx_tenants_status (status),
  KEY idx_tenants_activity (last_activity_at),
  CONSTRAINT fk_tenants_shard FOREIGN KEY (shard_id) REFERENCES shards(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. TENANT DOMAINS
-- =============================================================================
CREATE TABLE IF NOT EXISTS tenant_domains (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  ssl_status ENUM('pending','issued','failed') DEFAULT 'pending',
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_domain (domain),
  KEY idx_tenant_domains_tenant (tenant_id),
  CONSTRAINT fk_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. USERS (GLOBAL IDENTITY)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  provider VARCHAR(50) DEFAULT 'local',
  mfa_enabled TINYINT(1) DEFAULT 0,
  mfa_secret VARCHAR(255) DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  email_verified_at TIMESTAMP NULL,
  verification_token VARCHAR(255) DEFAULT NULL,
  external_identifier VARCHAR(255) DEFAULT NULL,
  preferences JSON DEFAULT NULL,
  language VARCHAR(10) DEFAULT 'en',
  theme VARCHAR(20) DEFAULT 'auto',
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. PLATFORM RBAC
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_roles (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_platform_role_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_permissions (
  id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_platform_permission (resource, action),
  KEY idx_platform_permissions_resource (resource)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_platform_role_perm_role FOREIGN KEY (role_id) REFERENCES platform_roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_platform_role_perm_perm FOREIGN KEY (permission_id) REFERENCES platform_permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_platform_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_platform_user_roles_role FOREIGN KEY (role_id) REFERENCES platform_roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. TENANT RBAC
-- =============================================================================
-- tenant_users: links platform users (users.id) to tenants. Used for tenant
-- membership / tenant admin. When a tenant is created via API with adminUserId,
-- a row is inserted here with status 'active'. Enables "which platform users can
-- access which tenant" in the control plane.
CREATE TABLE IF NOT EXISTS tenant_users (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status ENUM('invited','active','removed') DEFAULT 'invited',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tenant_user (tenant_id, user_id),
  KEY idx_tenant_users_user (user_id),
  CONSTRAINT fk_tenant_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  is_system TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_name (tenant_id, name),
  KEY idx_roles_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permission (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_perm FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  tenant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, user_id, role_id),
  KEY idx_user_roles_user (user_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. MARKETPLACE (THEMES)
-- =============================================================================
CREATE TABLE IF NOT EXISTS themes (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  author_id CHAR(36) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  status ENUM('draft','published','deprecated') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_theme_slug (slug),
  KEY idx_themes_author (author_id),
  KEY idx_themes_status (status),
  CONSTRAINT fk_themes_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS theme_versions (
  id CHAR(36) NOT NULL,
  theme_id CHAR(36) NOT NULL,
  version VARCHAR(20) NOT NULL,
  package_url VARCHAR(500) NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_theme_version (theme_id, version),
  CONSTRAINT fk_theme_versions_theme FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_themes (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  theme_id CHAR(36) NOT NULL,
  theme_version_id CHAR(36) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'inactive',
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tenant_themes_tenant (tenant_id),
  CONSTRAINT fk_tenant_themes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_themes_theme FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_themes_version FOREIGN KEY (theme_version_id) REFERENCES theme_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. BILLING
-- =============================================================================
CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  api_limit INT DEFAULT NULL,
  storage_limit BIGINT DEFAULT NULL,
  user_limit INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active','canceled','past_due') DEFAULT 'active',
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subscriptions_tenant (tenant_id),
  KEY idx_subscriptions_plan (plan_id),
  CONSTRAINT fk_subscriptions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenant_usage_daily (
  tenant_id CHAR(36) NOT NULL,
  usage_date DATE NOT NULL,
  api_calls BIGINT DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  bandwidth_used BIGINT DEFAULT 0,
  PRIMARY KEY (tenant_id, usage_date),
  KEY idx_tenant_usage_date (usage_date),
  CONSTRAINT fk_tenant_usage_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- END OF SETUP
-- =============================================================================
-- Next: run enterprise-core-db-seed.sql to insert platform roles, permissions,
-- plans, default shard, and optional super_admin user.
-- =============================================================================
