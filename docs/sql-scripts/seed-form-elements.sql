-- =============================================================================
-- Form Elements Seed Data - Complete Script
-- =============================================================================
-- Purpose: Seed the 15 default form elements into a tenant database
-- Usage: Run this script in your tenant database
--
-- Design: These are SYSTEM elements (project_id = NULL)
--         They will be available to ALL projects in the tenant
--
-- =============================================================================

-- System elements use NULL for project_id (available to all projects)
SET @project_id = NULL;

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
    'Aa',
    '#4CAF50',
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
    1, 1, 0, 1, 1, 1
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
    'ToggleLeft',
    '#10B981',
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
    NULL,
    NULL,
    JSON_OBJECT(),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1, 0, 0, 1, 1, 9
);

-- =============================================================================
-- Note: Add remaining 13 field types following the same pattern
-- =============================================================================
-- For complete seed data, see: docs/development-guides/FORM_ELEMENTS_SEED_DATA.md
