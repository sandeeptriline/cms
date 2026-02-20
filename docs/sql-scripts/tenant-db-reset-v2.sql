-- =============================================================================
-- Tenant DB reset – Composable Content Graph CMS (v2)
-- =============================================================================
-- Drops all v2 tables in reverse dependency order. Run this before
-- tenant-db-init-v2.sql to reset an existing tenant DB to the v2 structure.
-- WARNING: All data in these tables will be permanently lost.
-- Note: SET FOREIGN_KEY_CHECKS is omitted (not supported via Prisma prepared
-- statements). Drop order is correct so FK checks are not required.
-- =============================================================================

DROP TABLE IF EXISTS project_domains;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS media_assets;
DROP TABLE IF EXISTS node_versions;
DROP TABLE IF EXISTS content_relations;
DROP TABLE IF EXISTS content_compositions;
DROP TABLE IF EXISTS content_nodes;
DROP TABLE IF EXISTS component_fields;
DROP TABLE IF EXISTS components;
DROP TABLE IF EXISTS fields;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS datasets;
DROP TABLE IF EXISTS projects;
