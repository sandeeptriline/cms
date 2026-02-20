# Composable Content Graph CMS
## Tenant-Isolated, Domain-Bound Headless Architecture

---

# 1. Architecture Overview

This CMS is a **fully decoupled, composable, tenant-isolated, domain-bound headless content platform**.

Core Principles:

- Each tenant has its own database
- No `tenant_id` anywhere
- `project_id` is internal logical boundary only
- APIs are domain-based (no projectId exposed publicly)
- Metadata-driven schema registry
- JSON-based content node store
- Dynamic zones implemented as graph composition
- RBAC fully decoupled from content engine
- No table-per-content-type

---

# 2. Tenant Isolation Model

Each tenant:

- Has a completely separate MySQL database
- Can scale independently
- Can be backed up/restored independently
- Has zero cross-tenant coupling

Inside a tenant database:

- Projects are logical workspaces
- Datasets organize collections
- Collections define schema
- Content nodes store data
- RBAC controls access
- Domains map projects to public APIs

---

# 3. Project Layer (Logical Boundary)

```sql
CREATE TABLE projects (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

Projects are internal containers. They are NOT exposed via API URLs.

---

# 4. Dataset Layer

```sql
CREATE TABLE datasets (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_datasets_project (project_id)
) ENGINE=InnoDB;
```

---

# 5. Schema Registry (Metadata)

## collections

```sql
CREATE TABLE collections (
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
) ENGINE=InnoDB;
```

## fields

```sql
CREATE TABLE fields (
    id CHAR(36) PRIMARY KEY,
    collection_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    INDEX idx_fields_collection (collection_id)
) ENGINE=InnoDB;
```

---

# 6. Component System (Dynamic Block Engine)

```sql
CREATE TABLE components (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_component_slug (project_id, slug),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

```sql
CREATE TABLE component_fields (
    id CHAR(36) PRIMARY KEY,
    component_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

# 7. Content Engine (Unified Node Store)

```sql
CREATE TABLE content_nodes (
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
) ENGINE=InnoDB;
```

All content stored in JSON. No schema migration required for new fields.

---

# 8. Dynamic Zones (Graph Composition)

```sql
CREATE TABLE content_compositions (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    parent_node_id CHAR(36) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    child_node_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (child_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_zone_position (parent_node_id, zone_name, position)
) ENGINE=InnoDB;
```

---

# 9. Relations

```sql
CREATE TABLE content_relations (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    source_node_id CHAR(36) NOT NULL,
    target_node_id CHAR(36) NOT NULL,
    relation_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

# 10. Versioning

```sql
CREATE TABLE node_versions (
    id CHAR(36) PRIMARY KEY,
    node_id CHAR(36) NOT NULL,
    version_number INT NOT NULL,
    snapshot JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES content_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

---

# 11. Media Layer

```sql
CREATE TABLE media_assets (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    mime_type VARCHAR(150),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

# 12. RBAC

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

```sql
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

```sql
CREATE TABLE user_roles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL
) ENGINE=InnoDB;
```

```sql
CREATE TABLE permissions (
    id CHAR(36) PRIMARY KEY,
    role_id CHAR(36) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    conditions JSON
) ENGINE=InnoDB;
```

---

# 13. Domain Binding (Core of Public API)

Each project binds to its own domain.

Example:

Frontend:
```
https://abc.com
```

API:
```
https://api.abc.com
```

Domain Mapping Table:

```sql
CREATE TABLE project_domains (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    primary_domain VARCHAR(255) NOT NULL,
    api_domain VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_primary_domain (primary_domain),
    UNIQUE KEY uniq_api_domain (api_domain)
) ENGINE=InnoDB;
```

---

# 14. Headless Public API Model (Domain-Based)

Public API is NOT:

```
/{projectId}/content
```

Instead it is:

```
GET https://api.abc.com/content/blog
```

Project resolution flow:

1. Read Host header (api.abc.com)
2. Lookup project_domains
3. Resolve project_id
4. Connect to tenant DB
5. Execute content query

No internal IDs exposed publicly.

---

# 15. Auto-Generated Content Endpoints

For each collection slug:

```
GET    /content/{collectionSlug}
GET    /content/{collectionSlug}/{entryId}
```

Supports:

- Filtering
- Pagination
- Sorting
- Field selection
- Relation population
- Dynamic zone resolution

Example:

```
GET https://api.abc.com/content/blog?filters[slug]=hello-world
```

---

# 16. Dynamic Zone API Response

```json
{
  "id": "uuid",
  "title": "Home Page",
  "zones": {
    "main": [
      {
        "type": "hero",
        "data": {
          "title": "Welcome"
        }
      }
    ]
  }
}
```

---

# 17. Infrastructure Flow

```
Internet
   ↓
Load Balancer
   ↓
API Gateway
   ↓
Domain Resolver Middleware
   ↓
Project Context
   ↓
Tenant DB
   ↓
Content Engine
```

---

# 18. Final Architecture Summary

This system provides:

- Per-tenant isolated databases
- Internal project-based organization
- Domain-bound public APIs
- Strapi-style dynamic components
- Graph-based dynamic zones
- Auto-generated REST endpoints
- Optional GraphQL layer
- RBAC enforcement
- Enterprise-ready scalability

This is a production-grade, SaaS-ready, domain-driven headless CMS architecture.

