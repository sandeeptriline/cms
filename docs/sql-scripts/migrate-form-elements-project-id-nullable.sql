-- =============================================================================
-- Migration: Make project_id nullable in form_elements table
-- =============================================================================
-- Purpose: Allow form elements to be system-wide (project_id = NULL) 
--          instead of requiring a specific project
-- 
-- Design Decision:
--   - NULL project_id = System/default elements available to ALL projects
--   - Non-NULL project_id = Custom elements specific to that project
--
-- =============================================================================

-- Step 1: Drop the foreign key constraint
-- Note: MySQL doesn't support "IF EXISTS" for foreign keys, so we need to check first
-- If the constraint doesn't exist, this will error - that's okay, just continue
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'form_elements' 
    AND CONSTRAINT_NAME = 'fk_form_elements_project'
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL,
    CONCAT('ALTER TABLE form_elements DROP FOREIGN KEY ', @constraint_name),
    'SELECT "Foreign key does not exist, skipping drop" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

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

-- Step 4: Update existing system elements to have NULL project_id
-- (If you have any existing data, you may want to update them)
-- UPDATE form_elements SET project_id = NULL WHERE is_system = 1;

-- Verification: Check the table structure
-- DESCRIBE form_elements;
-- SELECT project_id, COUNT(*) FROM form_elements GROUP BY project_id;
