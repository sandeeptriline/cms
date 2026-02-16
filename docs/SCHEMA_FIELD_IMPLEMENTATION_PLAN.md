# Schema Field Implementation Plan

## Overview
Replace the "component" field type with a new "schema" field type that allows referencing existing data models (content types) within a data model.

## Requirements

### Schema Field Structure
1. **Step 1: Basic Information**
   - Display Name (required)
   - Icon (optional, with search)

2. **Step 2: Configuration**
   - Name (field name, required)
   - Type (radio buttons):
     - Single Schema (one instance)
     - Repeatable Schema (multiple instances/array)
   - Data Model Selection (single select dropdown):
     - List of all existing data models
     - In edit mode: Exclude the current data model being edited (to prevent circular references)

## Implementation Steps

### Phase 1: Database Changes

#### 1.1 Update Form Elements Table
**Option A: Delete and Replace (Recommended)**
- Delete existing "component" form element from `form_elements` table
- Insert new "schema" form element with appropriate configuration

**SQL Script:**
```sql
-- Delete component form element
DELETE FROM form_elements WHERE `key` = 'component' AND is_system = 1;

-- Insert schema form element
INSERT INTO form_elements (
    id, project_id, name, `key`, type, category, icon, icon_color, description,
    interface, variants, default_variant, validation_rules, default_settings,
    available_settings, supports_conditions, supports_translations, supports_relations,
    is_system, is_active, sort_order
) VALUES (
    UUID(),
    NULL,  -- System element
    'Schema',
    'schema',
    'schema',
    'advanced',
    'Database',  -- Icon name
    '#9333EA',  -- Purple color
    'Reference to an existing data model',
    JSON_OBJECT(
        'component', 'schema',
        'type', 'schema',
        'label', 'Schema',
        'helperText', 'Reference to an existing data model',
        'width', 'full',
        'layout', 'vertical',
        'schemaDisplayName', NULL,
        'schemaIcon', 'Database',
        'schemaId', NULL,
        'schemaRepeatable', false,
        'defaultValue', NULL,
        'settings', JSON_OBJECT(
            'required', false,
            'private', false
        ),
        'validation', JSON_OBJECT('rules', JSON_ARRAY()),
        'conditions', JSON_ARRAY()
    ),
    NULL,  -- No variants
    NULL,  -- No default variant
    JSON_OBJECT('required', false),
    JSON_OBJECT('required', false, 'private', false),
    JSON_ARRAY('required', 'private', 'schemaDisplayName', 'schemaIcon', 'schemaId', 'schemaRepeatable'),
    1,  -- supports_conditions
    0,  -- supports_translations
    0,  -- supports_relations
    1,  -- is_system
    1,  -- is_active
    13  -- sort_order (after component's position)
);
```

#### 1.2 Update Existing Fields (Optional)
- If there are existing fields using component type, they need to be migrated
- **Decision needed**: Should we migrate existing component fields to schema fields, or mark them as deprecated?

### Phase 2: Frontend Type Definitions

#### 2.1 Update `field-forms/types.ts`
**Remove:**
- `componentType`
- `componentDisplayName`
- `componentCategory`
- `componentIcon`
- `componentId`
- `componentRepeatable`

**Add:**
- `schemaDisplayName: z.string().optional()`
- `schemaIcon: z.string().optional()`
- `schemaId: z.string().optional()` (for selected data model)
- `schemaRepeatable: z.boolean().default(false)`

### Phase 3: Create Schema Field Form Component

#### 3.1 Create `schema-field-form.tsx`
**Location:** `frontend/app/dashboard/settings/data-model/components/field-forms/schema-field-form.tsx`

**Structure:**
- Similar to `component-field-form.tsx` but simplified
- Step 1: Display Name + Icon (no category, no create/existing selection)
- Step 2: Name + Type (single/repeatable) + Data Model Select

**Key Differences from Component:**
- No "create new" vs "use existing" option
- Always references existing data models
- No category field
- Simpler structure

**Props Interface:**
```typescript
interface SchemaFieldFormProps extends BaseFieldFormProps {
  schemaStep: 1 | 2
  onStep1Next: () => void
  onStep2Back: () => void
  schemaIconSearch: string
  onSchemaIconSearchChange: (value: string) => void
  availableDataModels: any[]  // List of data models (excluding current if editing)
  currentDataModelId?: string  // Current data model ID (to exclude from list)
}
```

### Phase 4: Update Field Form Renderer

#### 4.1 Update `field-forms/index.tsx`
**Changes:**
- Remove `ComponentFieldForm` import
- Add `SchemaFieldForm` import
- Replace `case 'component':` with `case 'schema':`
- Update props to use schema-specific naming:
  - `componentStep` → `schemaStep`
  - `onComponentStep1Next` → `onSchemaStep1Next`
  - `onComponentStep2Back` → `onSchemaStep2Back`
  - `componentIconSearch` → `schemaIconSearch`
  - `onComponentIconSearchChange` → `onSchemaIconSearchChange`
  - `availableComponents` → `availableDataModels`

### Phase 5: Update Add Field Modal

#### 5.1 Update `add-field-modal.tsx`
**Changes:**
- Remove component-specific state:
  - `componentStep`
  - `componentIconSearch`
  - `availableComponents`
- Add schema-specific state:
  - `schemaStep: useState<1 | 2>(1)`
  - `schemaIconSearch: useState('')`
  - `availableDataModels: useState<any[]>([])`
- Update form reset defaults:
  - Remove component fields
  - Add schema fields:
    ```typescript
    schemaDisplayName: '',
    schemaIcon: 'Database',
    schemaId: undefined,
    schemaRepeatable: false,
    ```
- Update `handleSelectField` to reset schema state
- Update `handleSchemaStep1Next` (similar to component but simpler validation)
- Update `onSubmit` to handle schema fields instead of component fields
- Update section2Fields array: `['schema', 'dynamic_zone']` (remove 'component')
- Update modal title logic: `selectedFormElement?.key === 'schema'`
- Update FieldFormRenderer props to use schema naming

### Phase 6: Update Edit Field Modal

#### 6.1 Update `edit-field-modal.tsx`
**Changes:**
- Remove component-specific state
- Add schema-specific state
- Update `populateFormFromField` to handle schema fields:
  ```typescript
  schemaDisplayName: options.schemaDisplayName || '',
  schemaIcon: options.schemaIcon || 'Database',
  schemaId: options.schemaId || undefined,
  schemaRepeatable: options.schemaRepeatable || false,
  ```
- Update `loadContentTypes` to filter out current data model:
  ```typescript
  const data = await contentTypesApi.getAll()
  // Exclude current data model to prevent circular references
  const filtered = data.filter(ct => ct.id !== contentTypeId)
  setContentTypes(filtered || [])
  ```
- Update `onSubmit` to handle schema fields
- Update FieldFormRenderer props

### Phase 7: Update Field Submission Logic

#### 7.1 Update Field DTO Structure
**In `add-field-modal.tsx` and `edit-field-modal.tsx`:**

**Remove component options:**
```typescript
// Remove this block
...(selectedFormElement.key === 'component' && {
  componentType: data.componentType,
  componentDisplayName: data.componentDisplayName,
  componentCategory: data.componentCategory,
  componentIcon: data.componentIcon,
  componentId: data.componentId,
  componentRepeatable: data.componentRepeatable,
  componentMetadata: {...},
}),
```

**Add schema options:**
```typescript
// Schema-specific options
...(selectedFormElement.key === 'schema' && {
  schemaDisplayName: data.schemaDisplayName,
  schemaIcon: data.schemaIcon,
  schemaId: data.schemaId,  // Selected data model ID
  schemaRepeatable: data.schemaRepeatable,
}),
```

### Phase 8: Cleanup

#### 8.1 Remove Component Files
- Delete `component-field-form.tsx` (after schema is working)
- Remove component references from documentation

#### 8.2 Update Section Filtering
**In `add-field-modal.tsx`:**
```typescript
// Update section2Fields
const section2Fields = ['schema', 'dynamic_zone']  // Remove 'component'
```

## Data Flow

### Adding Schema Field
1. User selects "Schema" from field type list
2. Step 1: Enter Display Name, Select Icon
3. Click "Configure the schema" → Step 2
4. Step 2: Enter Name, Select Type (Single/Repeatable), Select Data Model
5. Submit → Field created with schema reference

### Editing Schema Field
1. User clicks edit on existing schema field
2. Modal opens at Step 1 (always start at step 1)
3. Display Name and Icon are pre-filled
4. User can proceed to Step 2
5. Name, Type, and Data Model are pre-filled
6. Data Model dropdown excludes current data model

## Database Schema for Field Options

### Schema Field Options Structure
```json
{
  "schemaDisplayName": "Address",
  "schemaIcon": "MapPin",
  "schemaId": "uuid-of-selected-data-model",
  "schemaRepeatable": false
}
```

## Validation Rules

### Step 1 Validation
- Display Name: Required, min 1 character
- Icon: Optional (defaults to 'Database')

### Step 2 Validation
- Name: Required, valid field name (no spaces, alphanumeric + underscore)
- Type: Required (single or repeatable)
- Data Model: Required (must select one)

### Edit Mode
- Cannot select the current data model (prevented in dropdown)
- All other validations apply

## Edge Cases

1. **Circular Reference Prevention**
   - In edit mode, exclude current data model from dropdown
   - Backend should also validate this

2. **Data Model Deletion**
   - If a referenced data model is deleted, schema fields referencing it should be handled
   - Options: Mark as invalid, prevent deletion, or cascade

3. **Existing Component Fields**
   - Need migration strategy or deprecation notice

## Testing Checklist

- [ ] Schema field appears in field type list
- [ ] Step 1: Display Name and Icon work correctly
- [ ] Step 2: Name, Type, and Data Model selection work
- [ ] Single schema type works
- [ ] Repeatable schema type works
- [ ] Edit mode excludes current data model
- [ ] Field submission saves correctly
- [ ] Field editing loads existing values
- [ ] Component field type is removed/hidden
- [ ] Database migration works correctly

## Migration Strategy

### Option 1: Clean Replacement (Recommended)
1. Delete component form element
2. Add schema form element
3. Existing component fields become invalid (user must recreate)
4. Clear migration path

### Option 2: Parallel Support
1. Keep component, add schema
2. Deprecate component
3. Allow migration tool
4. Remove component later

**Recommendation: Option 1** - Cleaner, simpler, forces users to use new structure

## Files to Modify

1. ✅ `docs/sql-scripts/form-elements-complete.sql` - Add schema seed data
2. ✅ `frontend/app/dashboard/settings/data-model/components/field-forms/types.ts`
3. ✅ `frontend/app/dashboard/settings/data-model/components/field-forms/schema-field-form.tsx` (NEW)
4. ✅ `frontend/app/dashboard/settings/data-model/components/field-forms/index.tsx`
5. ✅ `frontend/app/dashboard/settings/data-model/components/add-field-modal.tsx`
6. ✅ `frontend/app/dashboard/settings/data-model/components/edit-field-modal.tsx`
7. ❌ `frontend/app/dashboard/settings/data-model/components/field-forms/component-field-form.tsx` (DELETE after migration)

## Questions for Review

1. **Migration**: Should we migrate existing component fields or require recreation?
2. **Icon Default**: Should default icon be 'Database' or something else?
3. **Validation**: Should backend validate schemaId exists and is not current data model?
4. **Naming**: Is "Schema" the right name, or prefer "Data Model Reference"?
5. **Step 1 Display Name**: Is this needed, or can we use the selected data model's name?

## Implementation Order

1. ✅ Create plan (this document)
2. ⏳ Update database (SQL script)
3. ⏳ Update types.ts
4. ⏳ Create schema-field-form.tsx
5. ⏳ Update field-forms/index.tsx
6. ⏳ Update add-field-modal.tsx
7. ⏳ Update edit-field-modal.tsx
8. ⏳ Test and fix issues
9. ⏳ Remove component-field-form.tsx
10. ⏳ Update documentation
