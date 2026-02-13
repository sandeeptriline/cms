# Form Elements - Seed Data

This document provides seed data for the 15 default form elements based on the Directus field type system.

**Important**: 
- **✅ System Elements**: These are **default form elements** available to ALL projects
- **project_id**: Use `NULL` for system elements (not a specific project ID)
- **Column Count**: Each INSERT has **21 columns** and **21 values**
- **Column Order**: The last 6 columns are: `supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order`
- **Value Order**: The last 6 values match the column order above

## Design Decision

**System vs Custom Elements**:
- **System Elements** (`project_id = NULL`): Default 15 field types available to ALL projects in the tenant
- **Custom Elements** (`project_id = specific UUID`): Custom field types specific to a particular project

**For seeding default elements**: Use `NULL` for `project_id` - these will be available to all projects.

**Verification**:
- ✅ 21 columns listed in INSERT
- ✅ 21 values provided in VALUES
- ✅ Column order matches value order

---

## Table Structure Reference

The `form_elements` table has the following key columns:
- `id`, `project_id`, `name`, `key`, `type`, `category`, `icon`, `icon_color`, `description`
- `interface` (JSON) - Complete interface configuration for form rendering
- `variants` (JSON) - Available variants for fields that support them
- `default_variant` - Default variant key
- `validation_rules` (JSON) - Default validation rules
- `default_settings` (JSON) - Default settings
- `available_settings` (JSON) - Available settings for this field type
- `supports_conditions`, `supports_translations`, `supports_relations`
- `is_system`, `is_active`, `sort_order`, `usage_count`, `created_by`

---

## 1. Text Field

```sql
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
    1, 1, 0,
    1, 1, 1
);
```

---

## 2. Boolean Field

```sql
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
    1, 0, 0,
    1, 1, 9
);
```

---

## 3. Rich Text (Blocks)

```sql
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
    'FileText',
    '#3B82F6',
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
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1, 1, 0,
    1, 1, 2
);
```

---

## 4. Number Field

```sql
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
    '123',
    '#EF4444',
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
        JSON_OBJECT('key', 'integer', 'name', 'Integer', 'description', 'Whole numbers'),
        JSON_OBJECT('key', 'float', 'name', 'Float', 'description', 'Decimal numbers'),
        JSON_OBJECT('key', 'decimal', 'name', 'Decimal', 'description', 'Precise decimal numbers')
    ),
    'integer',
    JSON_OBJECT('min', NULL, 'max', NULL, 'step', 1),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private', 'min', 'max', 'step'),
    1, 0, 0,
    1, 1, 3
);
```

---

## 5. Date Field

```sql
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
    'Calendar',
    '#F97316',
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
        JSON_OBJECT('key', 'datetime', 'name', 'Date & Time', 'description', 'Date and time picker'),
        JSON_OBJECT('key', 'date', 'name', 'Date Only', 'description', 'Date picker only'),
        JSON_OBJECT('key', 'time', 'name', 'Time Only', 'description', 'Time picker only')
    ),
    'datetime',
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1, 0, 0,
    1, 1, 4
);
```

---

## 6. Media Field

```sql
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
    'Image',
    '#9333EA',
    'Files like images, videos, etc',
    JSON_OBJECT(
        'component', 'file-upload',
        'type', 'file',
        'label', 'Media',
        'helperText', 'Files like images, videos, etc',
        'width', 'full',
        'layout', 'vertical',
        'multiple', false,
        'accept', 'image/*,video/*',
        'defaultValue', NULL,
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    JSON_ARRAY(
        JSON_OBJECT('key', 'single', 'name', 'Single File', 'description', 'Upload one file'),
        JSON_OBJECT('key', 'multiple', 'name', 'Multiple Files', 'description', 'Upload multiple files')
    ),
    'single',
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    0, 0, 1,
    1, 1, 5
);
```

---

## 7. Relation Field

```sql
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Relation',
    'relation',
    'm2o',
    'relation',
    'Link',
    '#2563EB',
    'Refers to a Collection Type',
    JSON_OBJECT(
        'component', 'relation-select',
        'type', 'm2o',
        'label', 'Relation',
        'helperText', 'Refers to a Collection Type',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    0, 0, 1,
    1, 1, 6
);
```

---

## 8. Rich Text (Markdown)

```sql
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Rich text (Markdown)',
    'rich_text_markdown',
    'text',
    'advanced',
    'FileText',
    '#1E40AF',
    'The classic rich text editor',
    JSON_OBJECT(
        'component', 'markdown-editor',
        'type', 'text',
        'label', 'Rich Text (Markdown)',
        'placeholder', 'Start typing...',
        'helperText', 'The classic rich text editor',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT('required', false, 'private', false),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1, 0, 0,
    1, 1, 7
);
```

---

## 9. Component Field

```sql
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Component',
    'component',
    'component',
    'advanced',
    'Puzzle',
    '#6B7280',
    'Group of fields that you can repeat or reuse',
    JSON_OBJECT(
        'component', 'component-selector',
        'type', 'component',
        'label', 'Component',
        'helperText', 'Group of fields that you can repeat or reuse',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT('required', false, 'private', false),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    0, 0, 1,
    1, 1, 8
);
```

---

## 10. JSON Field

```sql
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
    '{}',
    '#3B82F6',
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
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    1, 0, 0,
    1, 1, 10
);
```

---

## 11. Email Field

```sql
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
    '@',
    '#EF4444',
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
    NULL,
    NULL,
    JSON_OBJECT('required', false, 'pattern', '^[^@]+@[^@]+\\.[^@]+$'),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private'),
    1, 0, 0,
    1, 1, 11
);
```

---

## 12. Password Field

```sql
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
    'Lock',
    '#F97316',
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
    NULL,
    NULL,
    JSON_OBJECT('required', false, 'minLength', 8),
    JSON_OBJECT('required', false, 'private', true),
    JSON_ARRAY('required', 'private'),
    1, 0, 0,
    1, 1, 12
);
```

---

## 13. Enumeration Field

```sql
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
    'List',
    '#9333EA',
    'List of values, then pick one',
    JSON_OBJECT(
        'component', 'select',
        'type', 'enumeration',
        'label', 'Status',
        'helperText', 'List of values, then pick one',
        'width', 'full',
        'layout', 'vertical',
        'options', JSON_ARRAY(
            JSON_OBJECT('value', 'draft', 'label', 'Draft'),
            JSON_OBJECT('value', 'published', 'label', 'Published'),
            JSON_OBJECT('value', 'archived', 'label', 'Archived')
        ),
        'defaultValue', 'draft',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'unique', false, 'private', false),
    JSON_ARRAY('required', 'unique', 'private'),
    1, 1, 0,
    1, 1, 13
);
```

---

## 14. UID Field

```sql
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'UID',
    'uid',
    'string',
    'basic',
    'Key',
    '#2563EB',
    'Unique identifier',
    JSON_OBJECT(
        'component', 'input',
        'type', 'text',
        'label', 'UID',
        'placeholder', 'Enter unique identifier...',
        'helperText', 'Unique identifier',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', '',
        'settings', JSON_OBJECT(
            'required', false,
            'unique', true,
            'private', false
        ),
        'validation', JSON_OBJECT(
            'rules', JSON_ARRAY(
                JSON_OBJECT('type', 'pattern', 'value', '^[a-z0-9-_]+$', 'message', 'Only lowercase letters, numbers, hyphens, and underscores allowed')
            )
        ),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false, 'unique', true, 'pattern', '^[a-z0-9-_]+$'),
    JSON_OBJECT('required', false, 'unique', true, 'private', false),
    JSON_ARRAY('required', 'unique', 'private'),
    1, 0, 0,
    1, 1, 14
);
```

---

## 15. Dynamic Zone Field

```sql
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations, is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element: available to all projects
    'Dynamic zone',
    'dynamic_zone',
    'dynamiczone',
    'advanced',
    'Infinity',
    '#6B7280',
    'Dynamically pick component when editing content',
    JSON_OBJECT(
        'component', 'dynamic-zone',
        'type', 'dynamiczone',
        'label', 'Dynamic Zone',
        'helperText', 'Dynamically pick component when editing content',
        'width', 'full',
        'layout', 'vertical',
        'defaultValue', NULL,
        'settings', JSON_OBJECT('required', false, 'private', false),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,
    NULL,
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private'),
    0, 0, 1,
    1, 1, 15
);
```

---

## Complete Seed Script

**Note**: Before running, replace `'PROJECT_ID_HERE'` with the actual project ID from your tenant database.

All 15 field types are included above. You can run them individually or combine them into a single script.

---

## Column Mapping Reference

| Old Column Name | New Column Name | Notes |
|----------------|-----------------|-------|
| `type_options` | `validation_rules` | Moved to validation_rules |
| `ui_config` | Removed | No longer needed - interface JSON handles this |
| N/A | `key` | New - unique identifier for field type |
| N/A | `project_id` | New - required for tenant isolation |
| N/A | `variants` | New - for fields with variants (Text, Number, Date, Media) |
| N/A | `default_variant` | New - default variant key |
| N/A | `default_settings` | New - default settings object |
| N/A | `available_settings` | New - list of available settings |
| N/A | `supports_conditions` | New - boolean flag |
| N/A | `supports_translations` | New - boolean flag |
| N/A | `supports_relations` | New - boolean flag |
| N/A | `created_by` | New - user who created (for custom fields) |

---

**Last Updated**: 2026-02-13  
**Status**: Updated to match new table structure
