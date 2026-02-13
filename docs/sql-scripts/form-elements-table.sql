-- =============================================================================
-- Form Elements Table - Tenant Database
-- =============================================================================
-- Purpose: Store predefined and custom form field types with their configurations
-- Location: Tenant database (each tenant has their own form elements library)
-- Reference: FORM_ELEMENTS_LIBRARY_PLAN.md

-- -----------------------------------------------------------------------------
-- Form Elements Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS form_elements (
    id                  CHAR(36)     NOT NULL PRIMARY KEY,
    project_id          CHAR(36)     NULL COMMENT 'Tenant project ID (NULL = system/default elements available to all projects)',
    
    -- Basic Information
    name                VARCHAR(100) NOT NULL COMMENT 'Display name: "Text", "Number", "Date", etc.',
    `key`               VARCHAR(64)  NOT NULL COMMENT 'Unique key: "text", "number", "date", etc.',
    type                VARCHAR(64)  NOT NULL COMMENT 'Base type: string, integer, float, boolean, json, datetime, date, time, timestamp, file, files, m2o, o2m, m2m, m2a, translations, blocks, markdown, component, dynamiczone, enumeration, email, password, uid',
    category            VARCHAR(50)  NULL COMMENT 'Grouping: basic, advanced, media, relation, etc.',
    icon                VARCHAR(50)  NULL COMMENT 'Icon name: "Aa", "123", "calendar", etc.',
    icon_color          VARCHAR(20)  NULL COMMENT 'Icon color: "#4CAF50", "#F44336", etc.',
    description         TEXT        NULL COMMENT 'User-friendly description',
    
    -- Interface Configuration (JSON)
    -- This is the KEY field for rendering forms
    -- Contains complete interface configuration: component, type, variant, placeholder, label, helperText, width, layout, defaultValue, regexPattern, settings, validation, conditions
    interface           JSON         NOT NULL COMMENT 'Complete interface configuration for form rendering',
    
    -- Field Variants/Options
    variants            JSON         NULL COMMENT 'Available variants: [{"key": "short", "name": "Short text", "description": "..."}, ...]',
    default_variant     VARCHAR(50)  NULL COMMENT 'Default variant key',
    
    -- Validation & Constraints
    validation_rules    JSON         NULL COMMENT 'Default validation rules: {"required": false, "minLength": 0, "maxLength": 255, ...}',
    
    -- Settings & Configuration
    default_settings    JSON         NULL COMMENT 'Default settings: {"required": false, "unique": false, "private": false, ...}',
    available_settings  JSON         NULL COMMENT 'Available settings for this field type: ["required", "unique", "private", "minLength", "maxLength", ...]',
    
    -- Advanced Features
    supports_conditions TINYINT(1)  NOT NULL DEFAULT 0 COMMENT 'Can this field be used in conditional logic?',
    supports_translations TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Can this field be translated?',
    supports_relations  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Can this field create relations?',
    
    -- System vs Custom
    is_system           TINYINT(1)  NOT NULL DEFAULT 1 COMMENT '1 = system (cannot delete), 0 = custom (can delete)',
    is_active           TINYINT(1)  NOT NULL DEFAULT 1 COMMENT 'Is this field type available for use?',
    
    -- Metadata
    sort_order          INT          NOT NULL DEFAULT 0 COMMENT 'Display order in field type selector',
    usage_count         INT          NOT NULL DEFAULT 0 COMMENT 'How many times this field type is used',
    
    created_by          CHAR(36)     NULL COMMENT 'User who created (for custom fields)',
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_form_elements_project_key (project_id, `key`),
    INDEX idx_form_elements_project (project_id),
    INDEX idx_form_elements_type (type),
    INDEX idx_form_elements_category (category),
    INDEX idx_form_elements_is_system (is_system),
    INDEX idx_form_elements_is_active (is_active),
    INDEX idx_form_elements_sort (sort_order),
    CONSTRAINT fk_form_elements_project FOREIGN KEY (project_id) 
        REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: project_id can be NULL for system/default form elements
-- NULL = Available to all projects in the tenant
-- Non-NULL = Custom form element specific to that project

-- -----------------------------------------------------------------------------
-- Notes:
-- -----------------------------------------------------------------------------
-- 1. The `interface` JSON column is critical - it stores the complete configuration
--    needed to render the form field when creating/editing content.
--
-- 2. Interface JSON Structure:
--    {
--      "component": "input|textarea|select|datepicker|file|toggle|etc",
--      "type": "text|number|email|password|date|datetime|file|etc",
--      "variant": "short|long",
--      "placeholder": "Enter text...",
--      "label": "Field Label",
--      "helperText": "Helper text for editors",
--      "width": "full|half|third|quarter",
--      "layout": "vertical|horizontal",
--      "defaultValue": "",
--      "regexPattern": "",
--      "settings": {
--        "required": false,
--        "unique": false,
--        "private": false,
--        "minLength": null,
--        "maxLength": null
--      },
--      "validation": {
--        "rules": [...]
--      },
--      "conditions": [...]
--    }
--
-- 3. The `variants` JSON stores available variants for fields that support them
--    (e.g., Text field has "short" and "long" variants)
--
-- 4. System elements (is_system = 1) cannot be deleted and represent the 15
--    default field types from the form elements library.
--
-- 5. Custom elements (is_system = 0) can be created, updated, and deleted by
--    tenant admins.
