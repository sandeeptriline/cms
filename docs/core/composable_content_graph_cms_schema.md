# Composable Content Graph CMS

## Tenant-Isolated Production Schema (Refactored)

---

# 1. Architecture Overview

This CMS is designed as a **fully decoupled, composable, tenant-isolated headless content platform**.

Core Principles:

- Each tenant has its own database
- No `tenant_id` anywhere
- `project_id` is the highest logical boundary
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

- Projects are the top container
- Datasets organize collections
- Collections define schema
- Content nodes store data
- RBAC controls access

---

# 3. Project Layer (Top Boundary)

## projects

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

Projects act as logical workspaces.

---

# 4. Dataset Layer

## datasets

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

Datasets logically group collections and content.

---

# 5. Schema Registry (Metadata Layer)

Defines structure only. No actual content stored here.

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

# 6. Component System (Strapi-Style, Storage-Independent)

## components

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
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_components_project (project_id)
) ENGINE=InnoDB;
```

## component\_fields

```sql
CREATE TABLE component_fields (
    id CHAR(36) PRIMARY KEY,
    component_id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (component_id) REFERENCES components(id) ON DELETE CASCADE,
    INDEX idx_component_fields_component (component_id)
) ENGINE=InnoDB;
```

---

# 7. Content Engine (Node Store)

All entries, components, and future extensible entities live here.

## content\_nodes

```sql
CREATE TABLE content_nodes (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    dataset_id CHAR(36) NULL,
    node_type VARCHAR(50) NOT NULL,  -- entry | component | media
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

JSON stores flexible structured content. No schema migration needed when fields change.

---

# 8. Dynamic Zones (Graph Composition Layer)

Implements ordered block composition.

```sql
CREATE TABLE content_compositions (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    parent_node_id CHAR(36) NOT NULL,
    zone_name VARCHAR(255) NOT NULL,
    child_node_id CHAR(36) NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (child_node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_zone_position (parent_node_id, zone_name, position),
    INDEX idx_composition_parent (parent_node_id)
) ENGINE=InnoDB;
```

This enables unlimited flexible block-based pages.

---

# 9. Relations Layer

```sql
CREATE TABLE content_relations (
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
    FOREIGN KEY (node_id) REFERENCES content_nodes(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_node_version (node_id, version_number),
    INDEX idx_versions_node (node_id)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_media_project (project_id)
) ENGINE=InnoDB;
```

---

# 12. RBAC (Project-Scoped Access Control)

## users

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_email (email)
) ENGINE=InnoDB;
```

## roles

```sql
CREATE TABLE roles (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

## user\_roles

```sql
CREATE TABLE user_roles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role_id CHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_role (user_id, role_id)
) ENGINE=InnoDB;
```

## permissions

```sql
CREATE TABLE permissions (
    id CHAR(36) PRIMARY KEY,
    role_id CHAR(36) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id CHAR(36) NULL,
    action VARCHAR(100) NOT NULL,
    conditions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    INDEX idx_permissions_role (role_id)
) ENGINE=InnoDB;
```

---

# 13. Performance Recommendations

- Use UUID v7 for better index locality
- Prefer BINARY(16) for UUID at scale
- Add generated columns for frequently queried JSON fields
- Use read replicas for API-heavy workloads
- Separate object storage for media

---

# 14. Final Tenant Database Characteristics

Each tenant database contains:

- Projects
- Datasets
- Collections
- Fields
- Components
- Component Fields
- Content Nodes
- Dynamic Zone Composition
- Relations
- Versioning
- Media Assets
- Users
- Roles
- Permissions

This is a fully isolated, enterprise-ready, composable headless CMS database for a single tenant.

---

# 15. Headless Content Delivery APIs (Frontend-Facing)

This section defines how your CMS exposes APIs to frontend applications — similar to how Strapi or Directus expose content APIs.

Since each tenant has its own DB, these APIs are generated dynamically per project based on:

- Collections metadata
- Fields metadata
- Component definitions
- Dynamic zone compositions

These are **content delivery APIs**, not admin APIs.

---

# 15.1 Public Content API Structure

Base URL (example):

```
https://api.yourcms.com/v1/{projectId}
```

All APIs are automatically generated from metadata.

---

# 15.2 Collection-Based Endpoints (Auto Generated)

For each collection slug (e.g. blog, pages, products), generate:

### List Content

```
GET /v1/{projectId}/content/{collectionSlug}
```

Query Parameters:

- ?status=published
- ?limit=10
- ?offset=0
- ?sort=created\_at\:desc
- ?filters[field]=value
- ?fields=title,slug
- ?populate=\*

Example:

```
GET /v1/p1/content/blog?status=published&limit=10
```

---

### Get Single Entry

```
GET /v1/{projectId}/content/{collectionSlug}/{entryId}
```

OR slug-based:

```
GET /v1/{projectId}/content/{collectionSlug}?filters[slug]=hello-world
```

---

# 15.3 Dynamic Zone Resolution

When frontend requests:

```
GET /v1/{projectId}/content/pages/{id}?populate=zones
```

Backend automatically:

1. Fetches parent content\_node
2. Loads content\_compositions for that node
3. Loads child component nodes
4. Returns fully structured JSON

Example Response:

```json
{
  "id": "uuid",
  "title": "Home Page",
  "zones": {
    "main": [
      {
        "type": "hero",
        "data": {
          "title": "Welcome",
          "subtitle": "We scale"
        }
      },
      {
        "type": "cta",
        "data": {
          "text": "Get Started"
        }
      }
    ]
  }
}
```

Frontend never sees internal graph structure.

---

# 15.4 Relation Population

Support Strapi-style populate parameter:

```
?populate=author
?populate=author,category
?populate=*
```

Internally:

- Reads content\_relations
- Fetches related nodes
- Embeds them in response

---

# 15.5 Filtering & Query Engine

Support advanced filtering:

```
?filters[title][$contains]=cms
?filters[price][$gt]=100
?filters[status][$eq]=published
```

Operators:

- \$eq
- \$ne
- \$gt
- \$gte
- \$lt
- \$lte
- \$contains
- \$in

Filtering is translated into:

- JSON\_EXTRACT queries
- Indexed generated columns (for performance)

---

# 15.6 Pagination Format

Standard response:

```json
{
  "data": [...],
  "meta": {
    "total": 120,
    "limit": 10,
    "offset": 0
  }
}
```

---

# 15.7 Draft & Publish Behavior

Public APIs automatically:

- Return only status = "published"
- Hide draft entries

Admin APIs (authenticated) can:

- View drafts
- Update
- Publish

---

# 15.8 Media Delivery

Media returned as:

```json
{
  "id": "uuid",
  "url": "https://cdn.yourcms.com/project1/image.jpg",
  "metadata": {
    "width": 800,
    "height": 600
  }
}
```

Media is served via CDN, not via DB.

---

# 15.9 GraphQL (Optional Headless Layer)

Expose:

```
POST /v1/{projectId}/graphql
```

GraphQL schema is auto-generated from:

- collections
- fields
- components

Resolvers:

- Query collection
- Query single entry
- Populate relations
- Resolve dynamic zones

---

# 15.10 Admin APIs vs Public APIs

Separate API namespaces:

Admin APIs:

```
/v1/admin/projects
/v1/admin/collections
/v1/admin/content
```

Public APIs:

```
/v1/{projectId}/content/{collectionSlug}
```

Admin APIs require authentication. Public APIs can use API keys or be public.

---

# 15.11 API Security Model

Public content APIs:

- API key scoped to project
- Rate limiting per project
- Optional signed URLs

Admin APIs:

- JWT authentication
- RBAC validation

---

# 15.12 Final Headless API Characteristics

Your CMS now provides:

- Auto-generated REST endpoints per collection
- Dynamic zone resolution
- Relation population
- Advanced filtering
- Pagination & sorting
- Draft/publish workflow separation
- Media CDN integration
- Optional GraphQL layer

This is equivalent to how modern headless CMS platforms expose frontend-ready APIs, while remaining fully decoupled and tenant-isolated.

---

# 16. Project ↔ Domain Binding Architecture

Each project can be bound to a custom domain.

Example:

Frontend:

```
https://abc.com
```

API:

```
https://api.abc.com
```

When a project is created:

- User enters primary domain (abc.com)
- System automatically provisions api subdomain (api.abc.com)
- api.abc.com is permanently mapped to that specific project

This ensures:

- API isolation per project
- Clean frontend-backend separation
- No projectId exposed publicly

---

# 16.1 Required Database Addition

Add domain mapping table inside tenant DB.

```sql
CREATE TABLE project_domains (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    primary_domain VARCHAR(255) NOT NULL,
    api_domain VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_primary_domain (primary_domain),
    UNIQUE KEY uniq_api_domain (api_domain)
) ENGINE=InnoDB;
```

---

# 16.2 DNS & Infrastructure Flow

When project is created:

1. User adds domain: abc.com
2. System instructs user to point DNS:
   - abc.com → frontend hosting
   - api.abc.com → API load balancer
3. API gateway handles api.\* subdomains

Infrastructure Layer:

```
                Internet
                    |
            Load Balancer
                    |
              API Gateway
                    |
         Domain Resolver Middleware
                    |
           Resolve project_id
                    |
          Connect to Tenant DB
                    |
            Execute Content API
```

---

# 16.3 Domain-Based Project Resolution

Instead of:

```
/v1/{projectId}/content/blog
```

We use host-based resolution:

Request:

```
GET https://api.abc.com/content/blog
```

Backend flow:

1. Read Host header → api.abc.com
2. Lookup in project\_domains table
3. Resolve project\_id
4. Attach project context
5. Execute content query

No projectId needed in URL.

---

# 16.4 Automatic Subdomain Provisioning

At project creation:

- Validate primary domain uniqueness
- Generate api subdomain automatically
- Insert into project\_domains

Example logic:

primary\_domain = abc.com api\_domain = api.abc.com

Future optional features:

- Custom API subdomain
- Multiple domains per project
- Staging domains (staging.api.abc.com)

---

# 16.5 SSL Management

API Gateway handles SSL using:

- Wildcard certificate (\*.yourplatform.com) OR
- Automated Let's Encrypt per custom domain

Recommended approach:

- Use automatic certificate provisioning
- Store certificate metadata in infrastructure layer
- Not inside tenant DB

---

# 16.6 API Routing Strategy

Public content endpoint becomes:

```
GET https://api.abc.com/content/{collectionSlug}
```

Admin endpoint:

```
POST https://api.abc.com/admin/content
```

Optional internal routing still uses project\_id after resolution.

---

# 16.7 Security Considerations

- Validate Host header strictly
- Reject unknown domains
- Enforce HTTPS
- Apply rate limiting per project
- API keys scoped to project

---

# 16.8 Multi-Environment Extension (Optional)

Future-ready design:

- api.abc.com → production
- staging.api.abc.com → staging
- dev.api.abc.com → development

Add environment column to project\_domains if needed.

---

# 16.9 Final Domain-Bound API Model

For each project:

Frontend:

```
https://abc.com
```

Backend:

```
https://api.abc.com
```

Resolution logic:

Domain → project\_id → tenant DB → content engine → JSON response

This provides:

- Clean SaaS architecture
- True project isolation
- Professional domain-based API routing
- No exposed internal IDs
- Enterprise-ready multi-project support

Your headless CMS now supports domain-bound APIs similar to enterprise SaaS platforms while remaining fully tenant-isolated and composable.

