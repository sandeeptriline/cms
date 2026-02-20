-- =============================================================================
-- Enterprise Headless CMS – Core Control Plane Database Seed Data
-- =============================================================================
-- Source: docs/core/enterprise_headless_cms_core_db_architecture.md
-- Run this AFTER enterprise-core-db-setup.sql
-- Uses fixed UUIDs so role-permission and user-role links work correctly.
-- =============================================================================

-- =============================================================================
-- 1. SHARD (required for tenants)
-- =============================================================================
INSERT INTO shards (id, name, db_host, db_cluster, status, tenant_count)
VALUES (
  'a0000001-0001-0001-0001-000000000001',
  'shard_01',
  'localhost',
  'default',
  'active',
  0
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- 2. PLATFORM ROLES
-- =============================================================================
-- Use 'Super Admin' so backend and frontend (isSuperAdmin) work without code changes
INSERT INTO platform_roles (id, name, description, is_system)
VALUES
  ('b0000001-0001-0001-0001-000000000001', 'Super Admin', 'Full system access', 1),
  ('b0000001-0001-0001-0001-000000000002', 'finance_admin', 'Billing and invoice access', 1),
  ('b0000001-0001-0001-0001-000000000003', 'support_agent', 'Tenant support access', 1)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- =============================================================================
-- 3. PLATFORM PERMISSIONS
-- =============================================================================
INSERT INTO platform_permissions (id, resource, action, category, is_system)
VALUES
  ('c0000001-0001-0001-0001-000000000001', 'tenant', 'suspend', 'tenant_management', 1),
  ('c0000001-0001-0001-0001-000000000002', 'tenant', 'delete', 'tenant_management', 1),
  ('c0000001-0001-0001-0001-000000000003', 'tenant', 'create', 'tenant_management', 1),
  ('c0000001-0001-0001-0001-000000000004', 'tenant', 'read', 'tenant_management', 1),
  ('c0000001-0001-0001-0001-000000000005', 'tenant', 'update', 'tenant_management', 1),
  ('c0000001-0001-0001-0001-000000000006', 'billing', 'refund', 'billing', 1),
  ('c0000001-0001-0001-0001-000000000007', 'billing', 'read', 'billing', 1),
  ('c0000001-0001-0001-0001-000000000008', 'theme', 'approve', 'marketplace', 1),
  ('c0000001-0001-0001-0001-000000000009', 'theme', 'read', 'marketplace', 1),
  ('c0000001-0001-0001-0001-00000000000a', 'user', 'read', 'user_management', 1),
  ('c0000001-0001-0001-0001-00000000000b', 'user', 'create', 'user_management', 1),
  ('c0000001-0001-0001-0001-00000000000c', 'user', 'update', 'user_management', 1),
  ('c0000001-0001-0001-0001-00000000000d', 'user', 'delete', 'user_management', 1)
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- =============================================================================
-- 4. PLATFORM ROLE-PERMISSION ASSIGNMENTS
-- =============================================================================
-- Super Admin: all platform permissions
INSERT IGNORE INTO platform_role_permissions (role_id, permission_id)
SELECT 'b0000001-0001-0001-0001-000000000001', id FROM platform_permissions;

-- Finance Admin: billing (read, refund) + tenant read
INSERT IGNORE INTO platform_role_permissions (role_id, permission_id)
SELECT 'b0000001-0001-0001-0001-000000000002', id FROM platform_permissions
WHERE (resource = 'billing' AND action IN ('read','refund')) OR (resource = 'tenant' AND action = 'read');

-- Support Agent: tenant read, user read
INSERT IGNORE INTO platform_role_permissions (role_id, permission_id)
SELECT 'b0000001-0001-0001-0001-000000000003', id FROM platform_permissions
WHERE (resource = 'tenant' AND action = 'read') OR (resource = 'user' AND action = 'read');

-- =============================================================================
-- 5. PLANS (BILLING)
-- =============================================================================
-- Free: default for self-signup (SaaS). Paid plans for upgrades.
INSERT INTO plans (id, name, price, api_limit, storage_limit, user_limit)
VALUES
  ('d0000000-0001-0001-0001-000000000000', 'Free', 0.00, 10000, 1073741824, 3),
  ('d0000001-0001-0001-0001-000000000001', 'Starter', 29.00, 100000, 10737418240, 5),
  ('d0000001-0001-0001-0001-000000000002', 'Growth', 99.00, 500000, 53687091200, 25),
  ('d0000001-0001-0001-0001-000000000003', 'Enterprise', 499.00, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE price = VALUES(price), api_limit = VALUES(api_limit), storage_limit = VALUES(storage_limit), user_limit = VALUES(user_limit);

-- =============================================================================
-- 6. DEFAULT SUPER ADMIN USER (OPTIONAL)
-- =============================================================================
-- Password: 'password' (bcrypt hash below). CHANGE IN PRODUCTION.
-- Generate new hash: e.g. Node: require('bcrypt').hashSync('YourPassword', 10)
INSERT INTO users (id, email, password_hash, name, provider, mfa_enabled, status)
VALUES (
  'e0000001-0001-0001-0001-000000000001',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Platform Admin',
  'local',
  0,
  1
)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Assign super_admin role to default admin user
INSERT IGNORE INTO platform_user_roles (user_id, role_id)
VALUES ('e0000001-0001-0001-0001-000000000001', 'b0000001-0001-0001-0001-000000000001');

-- =============================================================================
-- 7. TENANT_USERS (OPTIONAL)
-- =============================================================================
-- tenant_users is populated when creating tenants via POST /api/tenants with
-- body.adminUserId (platform user ID). To link the default super admin to an
-- existing tenant, insert manually, e.g.:
--   INSERT INTO tenant_users (id, tenant_id, user_id, status)
--   VALUES (UUID(), '<tenant_id>', 'e0000001-0001-0001-0001-000000000001', 'active');
-- (Run after the tenant exists.)

-- =============================================================================
-- END OF SEED
-- =============================================================================
-- SaaS: Any user can self-register as a tenant via POST /api/auth/register-tenant.
-- New tenants get the Free plan by default (id above). Ensure this Free plan row
-- exists for self-signup to work.
-- Platform admin (if seed user inserted): admin@example.com / password
-- Change the password immediately in production.
-- =============================================================================
