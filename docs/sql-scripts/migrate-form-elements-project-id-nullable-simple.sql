-- =============================================================================
-- Migration: Make project_id nullable in form_elements table (SIMPLE VERSION)
-- =============================================================================
-- Purpose: Allow form elements to be system-wide (project_id = NULL) 
--          instead of requiring a specific project
-- 
-- Design Decision:
--   - NULL project_id = System/default elements available to ALL projects
--   - Non-NULL project_id = Custom elements specific to that project
--
-- Usage: Run this script in your tenant database
-- =============================================================================

-- Step 1: Drop the foreign key constraint
-- (Replace 'fk_form_elements_project' with actual constraint name if different)
ALTER TABLE form_elements 
    DROP FOREIGN KEY fk_form_elements_project;

-- Step 2: Make project_id nullable
ALTER TABLE form_elements 
    MODIFY COLUMN project_id CHAR(36) NULL 
    COMMENT 'Tenant project ID (NULL = system/default elements available to all projects)';

-- Step 3: Re-add the foreign key constraint
-- Note: Foreign key constraints in MySQL allow NULL values
--       The constraint only validates when project_id is NOT NULL
ALTER TABLE form_elements 
    ADD CONSTRAINT fk_form_elements_project 
    FOREIGN KEY (project_id) 
    REFERENCES projects(id) ON DELETE CASCADE;

-- Step 4: (Optional) Update existing system elements to have NULL project_id
-- Uncomment the line below if you have existing data that should be system-wide:
-- UPDATE form_elements SET project_id = NULL WHERE is_system = 1;

-- Verification queries:
-- DESCRIBE form_elements;
-- SELECT project_id, COUNT(*) FROM form_elements GROUP BY project_id;
