# Form Elements Library - Development Plan

**Date**: 2026-02-13  
**Status**: Planning  
**Reference**: Directus Field Type System & Strapi Component Library

---

## Overview

Create a comprehensive **Form Elements Library** that provides reusable field types for content modeling. This library will enable users to:
1. Select from predefined field types (Text, Boolean, Rich Text, Number, Date, etc.)
2. Configure field properties (name, type, validation, interface options)
3. Use these fields when creating content types
4. Render dynamic forms based on field configurations stored in JSON format

---

## 1. Field Types Analysis (From Images)

Based on the provided images, we need to support the following **15 field types**:

### Default Field Types

1. **Text**
   - **Variants**: Short text (for titles, names, links) | Long text (for descriptions, biography)
   - **Icon**: Green square with "Aa"
   - **Description**: "Small or long text like title or description"
   - **Use Cases**: Titles, names, links, descriptions, biography

2. **Rich text (Blocks)**
   - **Type**: JSON-based rich text editor
   - **Icon**: Light blue square with dotted pattern
   - **Description**: "The new JSON-based rich text editor"
   - **Use Cases**: Structured content with blocks

3. **Number**
   - **Variants**: Integer, float, decimal
   - **Icon**: Red square with "123"
   - **Description**: "Numbers (integer, float, decimal)"
   - **Use Cases**: Quantities, prices, ratings

4. **Date**
   - **Type**: Date picker with hours, minutes, seconds
   - **Icon**: Orange square with calendar
   - **Description**: "A date picker with hours, minutes and seconds"
   - **Use Cases**: Publication dates, timestamps, scheduling

5. **Media**
   - **Type**: Files like images, videos, etc.
   - **Icon**: Purple square with picture/video icon
   - **Description**: "Files like images, videos, etc"
   - **Use Cases**: Images, videos, documents, attachments

6. **Relation**
   - **Type**: Refers to a Collection Type
   - **Icon**: Blue square with chain link
   - **Description**: "Refers to a Collection Type"
   - **Use Cases**: One-to-many, many-to-many relationships

7. **Rich text (Markdown)**
   - **Type**: Classic rich text editor
   - **Icon**: Dark blue square with three lines
   - **Description**: "The classic rich text editor"
   - **Use Cases**: Markdown content, articles

8. **Component**
   - **Type**: Group of fields that can be repeated or reused
   - **Icon**: Gray square with puzzle piece
   - **Description**: "Group of fields that you can repeat or reuse"
   - **Use Cases**: Reusable field groups, nested structures

9. **Boolean**
   - **Type**: Yes or no, 1 or 0, true or false
   - **Icon**: Green square with toggle switch
   - **Description**: "Yes or no, 1 or 0, true or false"
   - **Use Cases**: Flags, toggles, checkboxes

10. **JSON**
    - **Type**: Data in JSON format
    - **Icon**: Light blue square with "{}"
    - **Description**: "Data in JSON format"
    - **Use Cases**: Flexible data structures, configurations

11. **Email**
    - **Type**: Email field with format validation
    - **Icon**: Red square with "@"
    - **Description**: "Email field with validations format"
    - **Use Cases**: User emails, contact information

12. **Password**
    - **Type**: Password field with encryption
    - **Icon**: Orange square with padlock
    - **Description**: "Password field with encryption"
    - **Use Cases**: User passwords, secure fields

13. **Enumeration**
    - **Type**: List of values, then pick one
    - **Icon**: Purple square with list icon
    - **Description**: "List of values, then pick one"
    - **Use Cases**: Dropdowns, select lists, status values

14. **UID**
    - **Type**: Unique identifier
    - **Icon**: Blue square with key
    - **Description**: "Unique identifier"
    - **Use Cases**: URL slugs, unique codes, identifiers

15. **Dynamic zone**
    - **Type**: Dynamically pick component when editing content
    - **Icon**: Gray square with infinity symbol
    - **Description**: "Dynamically pick component when editing content"
    - **Use Cases**: Flexible content structures, page builders

### Custom Field Types
- Users can create custom field types (future enhancement)
- Stored in same table with `is_system = 0`

---

## 2. Database Schema Design

### Table: `form_elements`

**Purpose**: Store predefined and custom form field types with their configurations. This table acts as a library/template for field types that can be used when creating content types.

**Location**: Tenant database (each tenant has their own form elements library)

**Design Decision**: 
- **System Elements** (`project_id = NULL`): Default 15 field types available to ALL projects in the tenant
- **Custom Elements** (`project_id = specific UUID`): Custom field types specific to a particular project

**Table Structure**:

```sql
CREATE TABLE IF NOT EXISTS form_elements (
    id                  CHAR(36)     NOT NULL PRIMARY KEY,
    project_id          CHAR(36)     NULL COMMENT 'Tenant project ID (NULL = system/default elements available to all projects)',
    
    -- Basic Information
    name                VARCHAR(100) NOT NULL COMMENT 'Display name: "Text", "Number", "Date", etc.',
    `key`               VARCHAR(64)  NOT NULL COMMENT 'Unique key: "text", "number", "date", etc.',
    type                VARCHAR(64)  NOT NULL COMMENT 'Base type: string, integer, float, boolean, json, datetime, file, etc.',
    category            VARCHAR(50)  NULL COMMENT 'Grouping: basic, advanced, media, relation, etc.',
    icon                VARCHAR(50)  NULL COMMENT 'Icon name: "Aa", "123", "calendar", etc.',
    icon_color          VARCHAR(20)  NULL COMMENT 'Icon color: "#4CAF50", "#F44336", etc.',
    description         TEXT        NULL COMMENT 'User-friendly description',
    
    -- Interface Configuration (JSON)
    -- This is the KEY field for rendering forms (see section 3)
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
```

**Important Design Notes**:
- `project_id` is **NULLABLE** - NULL means the element is a system/default element available to ALL projects
- `project_id` with a value means the element is custom and specific to that project
- The UNIQUE constraint `(project_id, key)` allows:
  - Multiple elements with same `key` as long as they have different `project_id` values
  - System elements (project_id = NULL) are unique by `key` alone

---

## 3. Interface JSON Structure

The `interface` column is **critical** - it stores the complete configuration needed to render the form field when creating/editing content. Based on the images, this JSON structure should include:

### 3.1 Basic Settings Structure

```json
{
  "component": "input|textarea|select|datepicker|file|toggle|etc",
  "type": "text|number|email|password|date|datetime|file|etc",
  "variant": "short|long",
  "placeholder": "Enter text...",
  "label": "Field Label",
  "helperText": "Helper text for editors",
  "width": "full|half|third|quarter",
  "layout": "vertical|horizontal"
}
```

### 3.2 Advanced Settings Structure

```json
{
  "defaultValue": "",
  "regexPattern": "",
  "regexDescription": "The text of the regular expression",
  "settings": {
    "required": false,
    "unique": false,
    "private": false,
    "minLength": null,
    "maxLength": null
  },
  "conditions": [
    {
      "field": "field_name",
      "operator": "equals|not_equals|contains|etc",
      "value": "expected_value",
      "action": "show|hide|enable|disable"
    }
  ],
  "validation": {
    "rules": [
      {
        "type": "required|minLength|maxLength|pattern|custom",
        "value": null,
        "message": "Validation error message"
      }
    ]
  }
}
```

### 3.3 Complete Interface Example (Text Field - Short Text)

```json
{
  "component": "input",
  "type": "text",
  "variant": "short",
  "label": "Name",
  "placeholder": "Enter name...",
  "helperText": "No space is allowed for the name of the attribute",
  "width": "full",
  "layout": "vertical",
  "defaultValue": "",
  "regexPattern": "",
  "settings": {
    "required": false,
    "unique": false,
    "private": false,
    "minLength": null,
    "maxLength": 255
  },
  "validation": {
    "rules": [
      {
        "type": "required",
        "value": true,
        "message": "This field is required"
      },
      {
        "type": "maxLength",
        "value": 255,
        "message": "Maximum length is 255 characters"
      },
      {
        "type": "pattern",
        "value": "^[a-zA-Z0-9_]+$",
        "message": "No spaces allowed"
      }
    ]
  },
  "conditions": []
}
```

### 3.4 Complete Interface Example (Text Field - Long Text)

```json
{
  "component": "textarea",
  "type": "text",
  "variant": "long",
  "label": "Description",
  "placeholder": "Enter description...",
  "helperText": "Best for descriptions, biography. Exact search is disabled.",
  "width": "full",
  "layout": "vertical",
  "rows": 5,
  "defaultValue": "",
  "settings": {
    "required": false,
    "unique": false,
    "private": false,
    "minLength": null,
    "maxLength": null
  },
  "validation": {
    "rules": [
      {
        "type": "maxLength",
        "value": 5000,
        "message": "Maximum length is 5000 characters"
      }
    ]
  },
  "conditions": []
}
```

### 3.5 Interface for Different Field Types

#### Boolean Field
```json
{
  "component": "toggle",
  "type": "boolean",
  "label": "Published",
  "defaultValue": false,
  "settings": {
    "required": false,
    "private": false
  }
}
```

#### Number Field
```json
{
  "component": "number-input",
  "type": "number",
  "variant": "integer|float|decimal",
  "label": "Price",
  "placeholder": "0.00",
  "min": 0,
  "max": 999999,
  "step": 0.01,
  "defaultValue": 0,
  "settings": {
    "required": false,
    "unique": false,
    "private": false
  }
}
```

#### Date Field
```json
{
  "component": "datepicker",
  "type": "datetime",
  "label": "Published Date",
  "includeTime": true,
  "includeSeconds": true,
  "defaultValue": null,
  "settings": {
    "required": false,
    "private": false
  }
}
```

#### Enumeration Field
```json
{
  "component": "select",
  "type": "enumeration",
  "label": "Status",
  "options": [
    {"value": "draft", "label": "Draft"},
    {"value": "published", "label": "Published"},
    {"value": "archived", "label": "Archived"}
  ],
  "defaultValue": "draft",
  "settings": {
    "required": false,
    "unique": false,
    "private": false
  }
}
```

---

## 4. Form Rendering Flow

### 4.1 When Creating Content Type

1. User clicks "Add Field" in Content Type editor
2. System shows field type selector (15 types from `form_elements` table)
3. User selects a field type (e.g., "Text")
4. System loads `interface` JSON from `form_elements` table
5. System renders form based on `interface` configuration:
   - Shows "Basic Settings" tab with name and variant selection
   - Shows "Advanced Settings" tab with validation, conditions, etc.
6. User configures the field
7. System saves field to `fields` table with:
   - `type`: Base type (e.g., "string")
   - `interface`: UI component name (e.g., "input")
   - `options`: Field-specific options (from interface JSON)
   - `validation`: Validation rules (from interface JSON)

### 4.2 When Creating/Editing Content

1. System loads content type definition from `content_types` and `fields` tables
2. For each field, system:
   - Loads base `form_elements` record (if available)
   - Merges field-specific `options` with base `interface` JSON
   - Renders form component based on merged configuration
3. User fills form
4. System validates based on `validation` rules
5. System saves content entry

---

## 5. Implementation Phases

### Phase 1: Database & Schema ✅
- [x] Create `form_elements` table schema
- [ ] Create migration script
- [ ] Seed default 15 field types

### Phase 2: Backend API
- [ ] Create `FormElementsService`
- [ ] Create `FormElementsController`
- [ ] Endpoints:
  - `GET /form-elements` - List all field types
  - `GET /form-elements/:id` - Get field type details
  - `POST /form-elements` - Create custom field type
  - `PUT /form-elements/:id` - Update field type
  - `DELETE /form-elements/:id` - Delete custom field type

### Phase 3: Frontend - Field Type Selector
- [ ] Create field type selector modal/page
- [ ] Display 15 field types in grid (2 columns)
- [ ] Show icons, names, descriptions
- [ ] Filter by category (DEFAULT/CUSTOM tabs)
- [ ] Search functionality

### Phase 4: Frontend - Field Configuration Form
- [ ] Create "Add Field" modal with tabs:
  - **Basic Settings Tab**:
    - Name input (with validation: no spaces)
    - Type selection (Short text / Long text for Text field)
    - Helper text
  - **Advanced Settings Tab**:
    - Default value input
    - RegExp pattern input
    - Settings checkboxes (Required, Unique, Private, Min/Max length)
    - Condition builder
- [ ] Form validation
- [ ] Save to `fields` table

### Phase 5: Form Rendering Engine
- [ ] Create dynamic form renderer component
- [ ] Map `interface.component` to React components:
  - `input` → `<Input />`
  - `textarea` → `<Textarea />`
  - `select` → `<Select />`
  - `datepicker` → `<DatePicker />`
  - `toggle` → `<Toggle />`
  - etc.
- [ ] Apply validation rules
- [ ] Handle conditional logic
- [ ] Support all 15 field types

### Phase 6: Integration with Content Types
- [ ] Update Content Type creation flow
- [ ] Add "Add Field" button in Content Type editor
- [ ] Show field type selector
- [ ] Configure and save fields
- [ ] Preview form based on fields

### Phase 7: Content Creation Forms
- [ ] Generate dynamic forms from content type fields
- [ ] Render forms when creating/editing content entries
- [ ] Apply validation
- [ ] Save content entries

---

## 6. Default Field Types Seed Data

### Example: Text Field Type

```sql
INSERT INTO form_elements (
    id, project_id, name, key, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, is_system,
    sort_order
) VALUES (
    UUID(),
    'project-id', -- Will be replaced with actual project ID
    'Text',
    'text',
    'string',
    'basic',
    'Aa',
    '#4CAF50',
    'Small or long text like title or description',
    '{
        "component": "input",
        "type": "text",
        "variant": "short",
        "label": "Name",
        "placeholder": "Enter text...",
        "helperText": "No space is allowed for the name of the attribute",
        "width": "full",
        "layout": "vertical",
        "defaultValue": "",
        "regexPattern": "",
        "settings": {
            "required": false,
            "unique": false,
            "private": false,
            "minLength": null,
            "maxLength": 255
        },
        "validation": {
            "rules": []
        },
        "conditions": []
    }',
    '[
        {
            "key": "short",
            "name": "Short text",
            "description": "Best for titles, names, links (URL). It also enables exact search on the field.",
            "component": "input"
        },
        {
            "key": "long",
            "name": "Long text",
            "description": "Best for descriptions, biography. Exact search is disabled.",
            "component": "textarea"
        }
    ]',
    'short',
    '{"minLength": 0, "maxLength": 255}',
    '{"required": false, "unique": false, "private": false, "minLength": null, "maxLength": null}',
    '["required", "unique", "private", "minLength", "maxLength"]',
    1,
    1,
    1,
    1
);
```

---

## 7. Key Design Decisions

### 7.1 Why `interface` is JSON?
- **Flexibility**: Different field types need different configurations
- **Extensibility**: Easy to add new settings without schema changes
- **Form Rendering**: Direct mapping to React component props
- **Versioning**: Can evolve interface structure over time

### 7.2 Why Separate `form_elements` Table?
- **Reusability**: Same field type can be used in multiple content types
- **Consistency**: Ensures all fields of same type have same base configuration
- **Customization**: Users can create custom field types
- **Library**: Acts as a template library for field types

### 7.3 Relationship with `fields` Table
- `form_elements`: Template/library of field types
- `fields`: Actual field instances in content types
- When creating a field in a content type:
  - User selects from `form_elements`
  - System creates entry in `fields` table
  - `fields.interface` can override `form_elements.interface`
  - `fields.options` stores field-specific configuration

---

## 8. API Endpoints Design

### 8.1 Form Elements Endpoints

```
GET    /form-elements                    # List all field types (with filters)
GET    /form-elements/:id                # Get field type details
POST   /form-elements                    # Create custom field type
PUT    /form-elements/:id                # Update field type
DELETE /form-elements/:id                # Delete custom field type (only if is_system = 0)
GET    /form-elements/:id/interface      # Get interface JSON for form rendering
```

### 8.2 Query Parameters

```
GET /form-elements?category=basic&is_active=1&search=text
```

---

## 9. Frontend Components Structure

```
frontend/
  components/
    form-elements/
      field-type-selector.tsx          # Modal with 15 field types grid
      field-config-form.tsx            # Basic + Advanced settings tabs
      field-renderer.tsx               # Dynamic form field renderer
      field-types/
        text-field.tsx                 # Text field component
        number-field.tsx               # Number field component
        date-field.tsx                 # Date field component
        boolean-field.tsx              # Boolean field component
        ...                            # Other field types
```

---

## 10. Next Steps

1. **Create Database Migration**: Write SQL script to create `form_elements` table
2. **Seed Default Data**: Create seed script for 15 default field types
3. **Backend Service**: Implement `FormElementsService` with CRUD operations
4. **Backend Controller**: Create API endpoints
5. **Frontend Selector**: Build field type selector UI
6. **Frontend Config Form**: Build field configuration form with tabs
7. **Form Renderer**: Create dynamic form rendering engine
8. **Integration**: Connect with content type creation flow

---

## 11. Success Criteria

- ✅ Users can see all 15 field types in a grid selector
- ✅ Users can configure field properties (basic + advanced)
- ✅ Interface JSON is properly stored and retrieved
- ✅ Forms can be dynamically rendered from interface JSON
- ✅ All 15 field types are supported
- ✅ Custom field types can be created
- ✅ Field types can be reused across content types

---

**Last Updated**: 2026-02-13  
**Status**: Planning Complete - Ready for Implementation
