# Enterprise Headless CMS – Core Control Plane Database

## Overview
This document defines the full Control Plane database architecture for:
- Enterprise Headless CMS
- Theme Marketplace
- Extension Marketplace
- Platform (Company Portal) RBAC
- Tenant RBAC
- Billing & Usage
- Shard Routing

---

# 1. ARCHITECTURE PRINCIPLES

## Separation of Concerns

Control Plane DB contains ONLY:
- Tenant metadata
- Shard routing
- Global identity
- Platform RBAC
- Tenant RBAC
- Marketplace catalog
- Billing
- Usage aggregation

Content (pages, posts, media metadata, etc.) lives in Shard Databases.

---

# 2. TABLE CREATION SQL

## 2.1 SHARDS

```sql
CREATE TABLE shards (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  db_host VARCHAR(255) NOT NULL,
  db_cluster VARCHAR(100) DEFAULT NULL,
  status ENUM('active','maintenance','offline') DEFAULT 'active',
  tenant_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_shards_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 2.2 TENANTS

```sql
CREATE TABLE tenants (
  id CHAR(36) NOT NULL,
  parent_id CHAR(36) DEFAULT NULL,
  shard_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  status ENUM('provisioning','active','suspended','deleted') DEFAULT 'provisioning',
  plan_id CHAR(36) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tenants_slug (slug),
  KEY idx_tenants_shard (shard_id),
  CONSTRAINT fk_tenants_shard FOREIGN KEY (shard_id) REFERENCES shards(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 2.3 TENANT DOMAINS

```sql
CREATE TABLE tenant_domains (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  ssl_status ENUM('pending','issued','failed') DEFAULT 'pending',
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_domain (domain),
  CONSTRAINT fk_domains_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 2.4 USERS (GLOBAL IDENTITY)

```sql
CREATE TABLE users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  provider VARCHAR(50) DEFAULT 'local',
  mfa_enabled TINYINT(1) DEFAULT 0,
  status TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

# PLATFORM RBAC

```sql
CREATE TABLE platform_roles (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_platform_role_name (name)
);

CREATE TABLE platform_permissions (
  id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  is_system TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_platform_permission (resource, action)
);

CREATE TABLE platform_role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE platform_user_roles (
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);
```

---

# TENANT RBAC

```sql
CREATE TABLE tenant_users (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status ENUM('invited','active','removed') DEFAULT 'invited',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tenant_user (tenant_id, user_id)
);

CREATE TABLE roles (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  is_system TINYINT(1) DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_name (tenant_id, name)
);

CREATE TABLE permissions (
  id CHAR(36) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permission (resource, action)
);

CREATE TABLE role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  tenant_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role_id CHAR(36) NOT NULL,
  PRIMARY KEY (tenant_id, user_id, role_id)
);
```

---

# MARKETPLACE (THEMES)

```sql
CREATE TABLE themes (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  author_id CHAR(36) NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  status ENUM('draft','published','deprecated') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_theme_slug (slug)
);

CREATE TABLE theme_versions (
  id CHAR(36) NOT NULL,
  theme_id CHAR(36) NOT NULL,
  version VARCHAR(20) NOT NULL,
  package_url VARCHAR(500) NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_theme_version (theme_id, version)
);

CREATE TABLE tenant_themes (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  theme_id CHAR(36) NOT NULL,
  theme_version_id CHAR(36) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'inactive',
  installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
```

---

# BILLING

```sql
CREATE TABLE plans (
  id CHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  api_limit INT DEFAULT NULL,
  storage_limit BIGINT DEFAULT NULL,
  user_limit INT DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE subscriptions (
  id CHAR(36) NOT NULL,
  tenant_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active','canceled','past_due') DEFAULT 'active',
  billing_cycle ENUM('monthly','yearly') DEFAULT 'monthly',
  PRIMARY KEY (id)
);

CREATE TABLE tenant_usage_daily (
  tenant_id CHAR(36) NOT NULL,
  usage_date DATE NOT NULL,
  api_calls BIGINT DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  bandwidth_used BIGINT DEFAULT 0,
  PRIMARY KEY (tenant_id, usage_date)
);
```

---

# 3. SEED DATA SQL

## Platform Roles

```sql
INSERT INTO platform_roles (id, name, description) VALUES
(UUID(), 'super_admin', 'Full system access'),
(UUID(), 'finance_admin', 'Billing and invoice access'),
(UUID(), 'support_agent', 'Tenant support access');
```

## Platform Permissions

```sql
INSERT INTO platform_permissions (id, resource, action) VALUES
(UUID(), 'tenant', 'suspend'),
(UUID(), 'tenant', 'delete'),
(UUID(), 'billing', 'refund'),
(UUID(), 'theme', 'approve');
```

## Plans

```sql
INSERT INTO plans (id, name, price, api_limit, storage_limit, user_limit) VALUES
(UUID(), 'Starter', 29.00, 100000, 10737418240, 5),
(UUID(), 'Growth', 99.00, 500000, 53687091200, 25),
(UUID(), 'Enterprise', 499.00, NULL, NULL, NULL);
```

## Sample Shard

```sql
INSERT INTO shards (id, name, db_host, db_cluster)
VALUES (UUID(), 'shard_01', '10.0.1.10', 'cluster_a');
```

---

# 4. SCALABILITY NOTES

- Each shard holds 500–2000 tenants
- All shard DB tables must include tenant_id (indexed)
- Search must be external (OpenSearch)
- Media must be object storage
- All access must be tenant-scoped

---

# 5. SECURITY MODEL

- Platform RBAC separated from Tenant RBAC
- No cross-tenant joins
- No tenant DB credentials stored per tenant
- Strict foreign keys where applicable
- UUID primary keys for horizontal scaling

---

# END OF DOCUMENT

