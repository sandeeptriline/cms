-- =============================================================================
-- Form Elements - Complete SQL Script
-- =============================================================================
-- Purpose: Complete setup for form elements system
-- Includes: Table creation and all form element seed data
-- Location: Tenant database (each tenant has their own form elements library)
-- Reference: FORM_ELEMENTS_LIBRARY_PLAN.md
--
-- Usage:
--   1. Run this script in your tenant database
--   2. All system form elements will be created automatically
--   3. System elements (project_id = NULL) are available to ALL projects
--
-- =============================================================================

-- =============================================================================
-- PART 1: TABLE CREATION
-- =============================================================================

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
    icon                VARCHAR(50)  NULL COMMENT 'Icon name from icon library (lucide-react, react-icons, etc.)',
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

-- =============================================================================
-- PART 2: FORM ELEMENTS SEED DATA
-- =============================================================================
-- All form elements below are SYSTEM elements (project_id = NULL)
-- They will be available to ALL projects in the tenant
-- Icon names use icon library naming (e.g., lucide-react: 'Type', 'Blocks', etc.)

-- =============================================================================
-- 1. Text Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Text',
    'text',
    'string',
    'basic',
    'Type',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#4CAF50',  -- Green color
    'Small or long text like title or description',
    JSON_OBJECT(
        'component', 'input',
        'type', 'text',
        'variant', 'short',
        'label', 'Name',
        'placeholder', 'Enter text...',
        'helperText', 'No space is allowed for the name of the attribute',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'regexPattern', '',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false,
            'minLength', NULL,
            'maxLength', 255
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY()
        ),
        'conditions', JSON_ARRAY()
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'short',
            'name', 'Short text',
            'description', 'Best for titles, names, links (URL). It also enables exact search on the field.',
            'component', 'input'
        ),
        JSON_OBJECT(
            'key', 'long',
            'name', 'Long text',
            'description', 'Best for descriptions, biography. Exact search is disabled.',
            'component', 'textarea'
        )
    ),
    'short',
    JSON_OBJECT('minLength', 0, 'maxLength', 255),
    JSON_OBJECT('required', false, 'unique', false, 'private', false, 'minLength', NULL, 'maxLength', NULL),
    JSON_ARRAY('required', 'unique', 'private', 'minLength', 'maxLength'),
    1,  -- supports_conditions
    1,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    1   -- sort_order
);

-- =============================================================================
-- 2. Boolean Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Boolean',
    'boolean',
    'boolean',
    'basic',
    'ToggleLeft',  -- Icon name (can be from any icon library)
    '#10B981',  -- Green color
    'Yes or no, 1 or 0, true or false',
    JSON_OBJECT(
        'component', 'toggle',
        'type', 'boolean',
        'label', 'Published',
        'defaultValue', false,
        'width', 'full',
        'layout', 'vertical',
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for boolean
    NULL,  -- No default variant
    JSON_OBJECT(),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    9   -- sort_order
);

-- =============================================================================
-- 3. Rich text (Blocks) Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Rich text (Blocks)',
    'rich_text_blocks',
    'blocks',
    'advanced',
    'Blocks',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#3B82F6',  -- Light blue color
    'The new JSON-based rich text editor',
    JSON_OBJECT(
        'component', 'blocks-editor',
        'type', 'blocks',
        'label', 'Rich Text (Blocks)',
        'placeholder', 'Start typing...',
        'helperText', 'The new JSON-based rich text editor',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT('required', false, 'private', false),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for blocks
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1,  -- supports_conditions
    1,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    2   -- sort_order
);

-- =============================================================================
-- 4. Number Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Number',
    'number',
    'integer',
    'basic',
    'Hash',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#F44336',  -- Red color
    'Numbers (integer, float, decimal)',
    JSON_OBJECT(
        'component', 'number-input',
        'type', 'number',
        'variant', 'integer',
        'label', 'Number',
        'placeholder', '0',
        'helperText', 'Numbers (integer, float, decimal)',
        'width', 'full',
        'layout', 'vertical',
        'min', NULL,
        'max', NULL,
        'step', 1,
        'defaultValue', 0,
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'integer',
            'name', 'Integer',
            'description', 'Whole numbers'
        ),
        JSON_OBJECT(
            'key', 'float',
            'name', 'Float',
            'description', 'Decimal numbers'
        ),
        JSON_OBJECT(
            'key', 'decimal',
            'name', 'Decimal',
            'description', 'Precise decimal numbers'
        )
    ),
    'integer',  -- Default variant
    JSON_OBJECT('min', NULL, 'max', NULL, 'step', 1),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private', 'min', 'max', 'step'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    3   -- sort_order
);

-- =============================================================================
-- 5. JSON Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'JSON',
    'json',
    'json',
    'advanced',
    'Braces',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#3B82F6',  -- Light blue color
    'Data in JSON format',
    JSON_OBJECT(
        'component', 'json-editor',
        'type', 'json',
        'label', 'JSON',
        'helperText', 'Data in JSON format',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT('required', false, 'private', false),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for JSON
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    10  -- sort_order
);

-- =============================================================================
-- 6. Email Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Email',
    'email',
    'string',
    'basic',
    'Mail',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#F44336',  -- Red color
    'Email field with validations format',
    JSON_OBJECT(
        'component', 'input',
        'type', 'email',
        'label', 'Email',
        'placeholder', 'email@example.com',
        'helperText', 'Email field with validations format',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY(
                JSON_OBJECT('type', 'email', 'value', true, 'message', 'Please enter a valid email address')
            )
        ),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for email
    NULL,  -- No default variant
    JSON_OBJECT('required', false, 'pattern', '^[^@]+@[^@]+\\.[^@]+$'),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    11  -- sort_order
);

-- =============================================================================
-- 7. Date Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Date',
    'date',
    'datetime',
    'basic',
    'Calendar',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#F97316',  -- Orange color
    'A date picker with hours, minutes and seconds',
    JSON_OBJECT(
        'component', 'datepicker',
        'type', 'datetime',
        'label', 'Published Date',
        'helperText', 'A date picker with hours, minutes and seconds',
        'width', 'full',
        'layout', 'vertical',
        'includeTime', true,
        'includeSeconds', true,
        'defaultValue', NULL,
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'datetime',
            'name', 'Date & Time',
            'description', 'Date and time picker'
        ),
        JSON_OBJECT(
            'key', 'date',
            'name', 'Date Only',
            'description', 'Date picker only'
        ),
        JSON_OBJECT(
            'key', 'time',
            'name', 'Time Only',
            'description', 'Time picker only'
        )
    ),
    'datetime',  -- Default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    4   -- sort_order
);

-- =============================================================================
-- 8. Password Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Password',
    'password',
    'string',
    'basic',
    'Key',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#FF9800',  -- Orange color
    'Password field with encryption',
    JSON_OBJECT(
        'component', 'input',
        'type', 'password',
        'label', 'Password',
        'placeholder', 'Enter password...',
        'helperText', 'Password field with encryption',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'settings', JSON_OBJECT(
            'required', false,
            'private', true
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY(
                JSON_OBJECT('type', 'minLength', 'value', 8, 'message', 'Password must be at least 8 characters')
            )
        ),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for password
    NULL,  -- No default variant
    JSON_OBJECT('required', false, 'minLength', 8),
    JSON_OBJECT('required', false, 'private', true),
    JSON_ARRAY('required', 'private', 'minLength', 'maxLength'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    12  -- sort_order
);

-- =============================================================================
-- 9. Media Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Media',
    'media',
    'file',
    'media',
    'Image',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#9333EA',  -- Purple color
    'Files like images, videos, etc',
    JSON_OBJECT(
        'component', 'file-upload',
        'type', 'file',
        'variant', 'single',
        'label', 'Media',
        'helperText', 'Files like images, videos, etc',
        'width', 'full',
        'layout', 'vertical',
        'multiple', false,
        'accept', 'image/*,video/*,audio/*,application/*',
        'allowedTypes', JSON_ARRAY('images', 'videos', 'audios', 'files'),
        'allowedTypesOptions', JSON_ARRAY(
            JSON_OBJECT('key', 'images', 'label', 'Images (JPEG, PNG, GIF, SVG, TIFF, ICO, DVU)', 'extensions', JSON_ARRAY('jpeg', 'jpg', 'png', 'gif', 'svg', 'tiff', 'ico', 'dvu')),
            JSON_OBJECT('key', 'videos', 'label', 'Videos (MPEG, MP4, Quicktime, WMV, AVI, FLV)', 'extensions', JSON_ARRAY('mpeg', 'mp4', 'mov', 'wmv', 'avi', 'flv')),
            JSON_OBJECT('key', 'audios', 'label', 'Audios (MP3, WAV, OGG)', 'extensions', JSON_ARRAY('mp3', 'wav', 'ogg')),
            JSON_OBJECT('key', 'files', 'label', 'Files (CSV, ZIP, PDF, Excel, JSON, ...)', 'extensions', JSON_ARRAY('csv', 'zip', 'pdf', 'xlsx', 'xls', 'json', 'doc', 'docx', 'txt'))
        ),
        'defaultValue', NULL,
        'settings', JSON_OBJECT(
            'required', false,
            'private', false,
            'allowedTypes', JSON_ARRAY('images', 'videos', 'audios', 'files')
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    JSON_ARRAY(
        JSON_OBJECT(
            'key', 'single',
            'name', 'Single media',
            'description', 'Best for avatar, profile picture or cover'
        ),
        JSON_OBJECT(
            'key', 'multiple',
            'name', 'Multiple media',
            'description', 'Best for sliders, carousels or multiple files download'
        )
    ),
    'single',  -- Default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false, 'allowedTypes', JSON_ARRAY('images', 'videos', 'audios', 'files')),
    JSON_ARRAY('required', 'private', 'allowedTypes'),
    0,  -- supports_conditions
    0,  -- supports_translations
    1,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    5   -- sort_order
);

-- =============================================================================
-- 10. Enumeration Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Enumeration',
    'enumeration',
    'enumeration',
    'basic',
    'List',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#9333EA',  -- Purple color
    'List of values, then pick one',
    JSON_OBJECT(
        'component', 'select',
        'type', 'enumeration',
        'label', 'Status',
        'helperText', 'List of values, then pick one',
        'width', 'full',
        'layout', 'vertical',
        'values', '',  -- Textarea for values (one line per value)
        'valuesPlaceholder', 'Ex:\nmorning\nnoon\nevening',
        'options', JSON_ARRAY(
            JSON_OBJECT('value', 'morning', 'label', 'Morning'),
            JSON_OBJECT('value', 'noon', 'label', 'Noon'),
            JSON_OBJECT('value', 'evening', 'label', 'Evening')
        ),
        'defaultValue', NULL,  -- Will be selected from values dropdown
        'graphqlName', NULL,  -- Name override for GraphQL
        'graphqlNameHelperText', 'Allows you to override the default generated name for GraphQL',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for enumeration
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private', 'defaultValue', 'graphqlName'),
    1,  -- supports_conditions
    1,  -- supports_translations (localization is enabled in the image)
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    13  -- sort_order
);

-- =============================================================================
-- 11. Relation Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Relation',
    'relation',
    'm2o',  -- Many-to-one base type (can be configured to other relation types)
    'relation',
    'Link2',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#3B82F6',  -- Blue color
    'Refers to a Collection Type',
    JSON_OBJECT(
        'component', 'relation',
        'type', 'relation',
        'label', 'Relation',
        'helperText', 'Refers to a Collection Type',
        'width', 'full',
        'layout', 'vertical',
        'relationType', 'oneWay',  -- Default: oneWay (has one)
        'relationTypes', JSON_ARRAY(
            JSON_OBJECT('key', 'oneWay', 'label', 'has one', 'description', 'Article has one Article', 'icon', 'ArrowRight'),
            JSON_OBJECT('key', 'oneToOne', 'label', 'has and belongs to one', 'description', 'Article has and belongs to one Article', 'icon', 'ArrowLeftRight'),
            JSON_OBJECT('key', 'oneToMany', 'label', 'belongs to many', 'description', 'Article belongs to many Articles', 'icon', 'ArrowRightToLine'),
            JSON_OBJECT('key', 'manyToOne', 'label', 'has many', 'description', 'Article has many Articles', 'icon', 'ArrowLeftToLine'),
            JSON_OBJECT('key', 'manyToMany', 'label', 'has and belongs to many', 'description', 'Article has and belongs to many Articles', 'icon', 'ArrowLeftRight'),
            JSON_OBJECT('key', 'manyWay', 'label', 'has many', 'description', 'Article has many Articles (reverse)', 'icon', 'ArrowRight')
        ),
        'sourceCollection', NULL,  -- Current collection type (set dynamically)
        'targetCollection', NULL,  -- Target collection type (selectable)
        'sourceFieldName', NULL,  -- Field name on source side
        'targetFieldName', NULL,  -- Field name on target side
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for relation
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private', 'relationType', 'targetCollection', 'sourceFieldName', 'targetFieldName'),
    1,  -- supports_conditions (has Condition section)
    0,  -- supports_translations (relations typically don't support localization)
    1,  -- supports_relations (this IS a relation field)
    1,  -- is_system
    1,  -- is_active
    6   -- sort_order
);

-- =============================================================================
-- 12. UID Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'UID',
    'uid',
    'uid',
    'basic',
    'KeyRound',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#9333EA',  -- Purple color
    'Unique identifier',
    JSON_OBJECT(
        'component', 'input',
        'type', 'text',
        'label', 'UID',
        'helperText', 'Unique identifier',
        'placeholder', 'e.g. slug, seoUrl, canonicalUrl',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'attachedField', NULL,  -- Field to attach UID to (e.g., title, name)
        'regexPattern', '',  -- Regular expression pattern for validation
        'settings', JSON_OBJECT(
            'required', false,
            'unique', true,  -- UID is always unique
            'private', false,
            'minLength', NULL,
            'maxLength', NULL
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY(),
            'regexPattern', ''
        ),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for UID
    NULL,  -- No default variant
    JSON_OBJECT('required', false, 'unique', true),
    JSON_OBJECT('required', false, 'unique', true, 'private', false, 'minLength', NULL, 'maxLength', NULL),
    JSON_ARRAY('required', 'unique', 'private', 'minLength', 'maxLength', 'regexPattern', 'attachedField', 'defaultValue'),
    1,  -- supports_conditions (has Condition section)
    0,  -- supports_translations (UIDs typically don't support localization)
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    14  -- sort_order
);

-- =============================================================================
-- 13. Rich Text (Markdown) Field
-- =============================================================================
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Rich text (Markdown)',
    'markdown',
    'markdown',
    'basic',
    'FileText',  -- Icon name (can be from any icon library: lucide-react, react-icons, heroicons, etc.)
    '#3B82F6',  -- Blue color
    'The classic rich text editor',
    JSON_OBJECT(
        'component', 'markdown-editor',
        'type', 'markdown',
        'label', 'Rich text (Markdown)',
        'helperText', 'The classic rich text editor',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false,
            'minLength', NULL,
            'maxLength', NULL
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY(),
            'minLength', NULL,
            'maxLength', NULL
        ),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants for markdown
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'unique', false, 'private', false, 'minLength', NULL, 'maxLength', NULL),
    JSON_ARRAY('required', 'unique', 'private', 'minLength', 'maxLength', 'defaultValue'),
    1,  -- supports_conditions (has Condition section)
    1,  -- supports_translations (localization is enabled in the image)
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    7   -- sort_order
);

-- =============================================================================
-- NOTES
-- =============================================================================
-- 
-- Icon Field:
--   The 'icon' field stores the icon name/identifier that will be mapped
--   to the actual icon component in the frontend. The frontend can use any icon
--   library (lucide-react, react-icons, heroicons, etc.) as long as the icon
--   name matches the library's naming convention.
--
-- System Elements:
--   - project_id = NULL means the element is available to ALL projects
--   - is_system = 1 means the element cannot be deleted
--   - These are the default 15 field types from the form elements library
--
-- Custom Elements:
--   - project_id = specific UUID means the element is specific to that project
--   - is_system = 0 means the element can be deleted
--   - Created by tenant admins for project-specific needs
--
-- Adding More Form Elements:
--   To add more form elements, follow the same pattern above:
--   1. Use UUID() for id
--   2. Use NULL for project_id (system elements) or specific UUID (custom)
--   3. Fill in all 21 columns
--   4. Ensure icon name matches your icon library
--   5. Set appropriate sort_order for display sequence
--
-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
