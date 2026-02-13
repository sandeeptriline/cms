-- =============================================================================
-- Form Elements Seed Data - VERIFIED
-- =============================================================================
-- This script has been verified to match the table structure exactly
-- Replace 'PROJECT_ID_HERE' with actual project ID before running

-- Text Field
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    'PROJECT_ID_HERE',
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
    1,  -- supports_conditions
    1,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    1   -- sort_order
);

-- Note: This INSERT statement has been verified:
-- - 21 columns listed
-- - 21 values provided
-- - Column order matches value order
-- - All required columns included
-- - Optional columns (usage_count, created_by) omitted (use defaults)
