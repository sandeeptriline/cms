'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Database,
  Plus,
  Edit,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  EyeOff,
  GripVertical,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react'
import { contentTypesApi, ContentType, ContentTypeField, CreateFieldDto } from '@/lib/api/content-types'
import { collectionsApi, Collection, CollectionField, CreateCollectionFieldDto } from '@/lib/api/collections'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { AddFieldModal } from './add-field-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { EditFieldModal } from './edit-field-modal'
import { EditContentTypeModal } from './edit-content-type-modal'
import { getFieldTypeConfig } from './field-type-icons'

interface DataModelViewProps {
  contentTypeId: string
  onRefresh?: () => void
  useV2?: boolean
  projectId?: string
}

interface SortableFieldItemProps {
  field: ContentTypeField | CollectionField
  onEdit: () => void
  onDelete: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  nestedFields?: (ContentTypeField | CollectionField)[]
  contentTypes?: (ContentType | Collection)[]
}

function SortableFieldItem({ 
  field, 
  onEdit, 
  onDelete,
  isExpanded = false,
  onToggleExpand,
  nestedFields = [],
  contentTypes = [],
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const fieldInterface = (('interface' in field ? field.interface : '') || '').toLowerCase()
  const fieldType = (field.type || '').toLowerCase()
  
  // Check if it's a schema field (interface can be 'schema' or 'schema-selector', or type can be 'schema')
  const isSchema = fieldInterface === 'schema' || 
                   fieldInterface === 'schema-selector' || 
                   fieldInterface?.includes('schema') ||
                   fieldType === 'schema'
  
  // Check if it's a dynamic zone field (interface can be 'dynamic-zone' or 'dynamic_zone', or type can be 'dynamiczone' or 'dynamic_zone')
  const isDynamicZone = fieldInterface === 'dynamic-zone' || 
                        fieldInterface === 'dynamic_zone' || 
                        fieldInterface?.includes('dynamic') ||
                        fieldType === 'dynamiczone' || 
                        fieldType === 'dynamic_zone'
  
  const isComponent = fieldType === 'component'
  
  // Get field config - use interface for schema/dynamic zone, otherwise use type
  const displayType = isSchema ? 'schema' : (isDynamicZone ? 'dynamiczone' : field.type)
  const fieldConfig = getFieldTypeConfig(displayType)
  const IconComponent = fieldConfig.icon
  const hasNestedFields = nestedFields && nestedFields.length > 0
  
  // ContentTypeField has required; CollectionField has is_required
  const isRequired = 'required' in field ? field.required : field.is_required

  // Get schema-specific info from options (ContentTypeField has options; CollectionField does not)
  const fieldOptions = 'options' in field ? field.options : undefined
  const schemaInfo = isSchema && fieldOptions ? {
    displayName: fieldOptions.schemaDisplayName || fieldOptions.displayName || '',
    icon: fieldOptions.schemaIcon || fieldOptions.icon || 'Database',
    repeatable: fieldOptions.schemaRepeatable || fieldOptions.repeatable || false,
    schemaId: fieldOptions.schemaId || fieldOptions.id || '',
  } : null

  // Get dynamic zone-specific info from options
  const dynamicZoneInfo = isDynamicZone && fieldOptions ? {
    allowedSchemas: Array.isArray(fieldOptions.allowed_schemas)
      ? fieldOptions.allowed_schemas
      : (Array.isArray(fieldOptions.allowedSchemas) ? fieldOptions.allowedSchemas : []),
  } : null

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          isDragging ? 'bg-white shadow-lg rounded' : ''
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Expand/Collapse Button for Components, Schema, and Dynamic Zone */}
        {(isComponent || isSchema || isDynamicZone) ? (
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            disabled={!onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Field Type Icon */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${fieldConfig.color}20` }}
        >
          <div style={{ color: fieldConfig.color }}>
            <IconComponent className="h-5 w-5" />
          </div>
        </div>

        {/* Field Name and Type */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {field.field}
              {isComponent && hasNestedFields && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({nestedFields.length} {nestedFields.length === 1 ? 'field' : 'fields'})
                </span>
              )}
              {isSchema && schemaInfo && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({(() => {
                    const dataModel = schemaInfo.schemaId 
                      ? contentTypes.find(ct => ct.id === schemaInfo.schemaId)
                      : null
                    return dataModel ? dataModel.name : (schemaInfo.displayName || '')
                  })()})
                </span>
              )}
              {isDynamicZone && dynamicZoneInfo && (
                <span className="text-muted-foreground font-normal ml-1">
                  ({dynamicZoneInfo.allowedSchemas.length} {dynamicZoneInfo.allowedSchemas.length === 1 ? 'schema' : 'schemas'})
                </span>
              )}
              {isRequired && (
                <span className="text-destructive ml-1">*</span>
              )}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {fieldConfig.label}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Nested Fields for Components */}
      {isComponent && isExpanded && hasNestedFields && (
        <div className="bg-gray-50 border-l-2 border-gray-200 ml-4">
          {nestedFields.map((nestedField) => (
            <div
              key={nestedField.id}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="w-5" /> {/* Spacer for alignment */}
              <div className="w-5" /> {/* Spacer for expand button */}
              <div
                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${getFieldTypeConfig(nestedField.type).color}20` }}
              >
                <div style={{ color: getFieldTypeConfig(nestedField.type).color }}>
                  {(() => {
                    const NestedIcon = getFieldTypeConfig(nestedField.type).icon
                    return <NestedIcon className="h-4 w-4" />
                  })()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {nestedField.field}
                    {('required' in nestedField ? nestedField.required : nestedField.is_required) && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {getFieldTypeConfig(nestedField.type).label}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  onClick={() => onEdit()}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="w-full justify-start text-muted-foreground hover:text-foreground text-xs"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add another field to this component
            </Button>
          </div>
        </div>
      )}

      {/* Schema Field Details */}
      {isSchema && isExpanded && schemaInfo && (
        <div className="bg-gray-50 border-l-2 border-gray-200 ml-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-muted-foreground mb-2">Schema Configuration</div>
            <div className="text-sm">
              {(() => {
                const dataModel = schemaInfo.schemaId 
                  ? contentTypes.find(ct => ct.id === schemaInfo.schemaId)
                  : null
                const schemaName = dataModel ? dataModel.name : (schemaInfo.displayName || '')
                const schemaType = schemaInfo.repeatable ? 'repeatable schema' : 'single schema'
                return schemaName ? `${schemaName} (${schemaType})` : schemaType
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Zone Field Details */}
      {isDynamicZone && isExpanded && dynamicZoneInfo && (
        <div className="bg-gray-50 border-l-2 border-gray-200 ml-4">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Allowed Schemas ({dynamicZoneInfo.allowedSchemas.length})
            </div>
            {dynamicZoneInfo.allowedSchemas.length === 0 ? (
              <p className="text-xs text-muted-foreground">No schemas selected</p>
            ) : (
              <div className="space-y-1">
                {dynamicZoneInfo.allowedSchemas.map((schemaId: string) => {
                  const dataModel = contentTypes.find(ct => ct.id === schemaId)
                  return (
                    <div
                      key={schemaId}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-white border border-gray-200"
                    >
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium">
                        {dataModel ? dataModel.name : schemaId}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function DataModelView({ contentTypeId, onRefresh, useV2 = false, projectId: projectIdProp }: DataModelViewProps) {
  const { toast } = useToast()
  const { currentProject } = useProject()
  const projectId = projectIdProp ?? currentProject?.id
  const [contentType, setContentType] = useState<ContentType | Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false)
  const [editFieldModalOpen, setEditFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ContentTypeField | CollectionField | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteFieldDialogOpen, setDeleteFieldDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<ContentTypeField | CollectionField | null>(null)
  const [deleteContentTypeDialogOpen, setDeleteContentTypeDialogOpen] = useState(false)
  const [deletingContentType, setDeletingContentType] = useState(false)
  const [fields, setFields] = useState<(ContentTypeField | CollectionField)[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())
  const [allContentTypes, setAllContentTypes] = useState<(ContentType | Collection)[]>([])
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [addFieldName, setAddFieldName] = useState('')
  const [addFieldTypeKey, setAddFieldTypeKey] = useState<string>('')
  const [addFieldRequired, setAddFieldRequired] = useState(false)
  const [addFieldSaving, setAddFieldSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadFormElements = async () => {
    const pid = projectId ?? currentProject?.id
    if (!pid) return
    try {
      const data = await formElementsApi.getAll(pid)
      setFormElements(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load form elements:', err)
      setFormElements([])
    }
  }

  useEffect(() => {
    if (contentTypeId) {
      loadContentType()
      loadAllContentTypes()
      loadFormElements()
    }
  }, [contentTypeId])

  useEffect(() => {
    if (formElements.length > 0 && !addFieldTypeKey) {
      setAddFieldTypeKey(formElements[0].key)
    }
  }, [formElements, addFieldTypeKey])

  const loadContentType = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = useV2
        ? await collectionsApi.getById(contentTypeId)
        : await contentTypesApi.getById(contentTypeId)
      setContentType(data)
      setFields(data.fields || [])
      setHasUnsavedChanges(false)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load content model')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content model',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllContentTypes = async () => {
    const pid = projectId ?? currentProject?.id
    if (!pid) return
    try {
      const data = useV2 ? await collectionsApi.getAll(pid) : await contentTypesApi.getAll(pid)
      setAllContentTypes(data || [])
    } catch (err: unknown) {
      console.error('Failed to load content types for mapping:', err)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newFields = arrayMove(items, oldIndex, newIndex)
        
        // Update sort order
        const updatedFields = newFields.map((field, index) => ({
          ...field,
          sort: index,
        }))
        
        setHasUnsavedChanges(true)
        return updatedFields
      })
    }
  }

  const handleSaveOrder = async () => {
    if (!contentType) return
    try {
      setSaving(true)
      if (useV2) {
        await collectionsApi.updateFieldOrder(
          contentType.id,
          fields.map((f, index) => ({ id: f.id, sort: index }))
        )
      } else {
        await contentTypesApi.updateFieldOrder(
          contentType.id,
          fields.map((f, index) => ({ id: f.id, sort: ('sort' in f ? f.sort : 0) ?? index }))
        )
      }
      toast({ title: 'Success', description: 'Field order saved successfully' })
      setHasUnsavedChanges(false)
      await loadContentType()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to save field order', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    setAddFieldModalOpen(true)
  }

  const handleQuickAddField = async () => {
    const name = addFieldName.trim().replace(/\s+/g, '_').toLowerCase() || addFieldName.trim()
    if (!name) {
      toast({ title: 'Field name required', variant: 'destructive' })
      return
    }
    const fe = formElements.find((e) => e.key === addFieldTypeKey)
    if (!fe || !contentType) {
      toast({ title: 'Select a field type', variant: 'destructive' })
      return
    }
    setAddFieldSaving(true)
    try {
      const interfaceConfig = fe.interface?.component ? fe.interface : { component: fe.key }
      if (useV2) {
        const dto: CreateCollectionFieldDto = {
          name: name,
          type: fe.type,
          is_required: addFieldRequired,
          config: { ...fe.default_settings },
        }
        await collectionsApi.addField(contentType.id, dto)
      } else {
        const fieldDto: CreateFieldDto = {
          field: name,
          type: fe.type,
          interface: interfaceConfig?.component ?? fe.key,
          options: { ...fe.default_settings },
          validation: { ...fe.validation_rules, required: addFieldRequired },
          required: addFieldRequired,
        }
        await contentTypesApi.addField(contentType.id, fieldDto)
      }
      toast({ title: 'Field added' })
      setAddFieldName('')
      await loadContentType()
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to add field', variant: 'destructive' })
    } finally {
      setAddFieldSaving(false)
    }
  }

  const handleFieldAdded = () => {
    setAddFieldModalOpen(false)
    loadContentType()
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleEditSuccess = () => {
    loadContentType()
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleDeleteSuccess = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleConfirmDeleteContentType = async () => {
    if (!contentType) return
    try {
      setDeletingContentType(true)
      if (useV2) {
        await collectionsApi.delete(contentType.id)
      } else {
        await contentTypesApi.delete(contentType.id)
      }
      toast({
        title: 'Success',
        description: 'Content model deleted successfully',
      })
      setDeleteContentTypeDialogOpen(false)
      handleDeleteSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete content model',
        variant: 'destructive',
      })
    } finally {
      setDeletingContentType(false)
    }
  }

  const handleEditField = (field: ContentTypeField | CollectionField) => {
    setEditingField(field)
    setEditFieldModalOpen(true)
  }

  const handleEditFieldSuccess = () => {
    setEditFieldModalOpen(false)
    setEditingField(null)
    loadContentType()
    if (onRefresh) {
      onRefresh()
    }
  }

  const handleDeleteField = (field: ContentTypeField | CollectionField) => {
    setFieldToDelete(field)
    setDeleteFieldDialogOpen(true)
  }

  const handleConfirmDeleteField = async () => {
    if (!contentType || !fieldToDelete) return

    try {
      setSaving(true)
      if (useV2) {
        await collectionsApi.deleteField(contentType.id, fieldToDelete.id)
      } else {
        await contentTypesApi.deleteField(contentType.id, fieldToDelete.id)
      }
      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      })
      setDeleteFieldDialogOpen(false)
      setFieldToDelete(null)
      await loadContentType()
      if (onRefresh) {
        onRefresh()
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete field',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading content model...</span>
      </div>
    )
  }

  if (error || !contentType) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Content model not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">{contentType.name}</h2>
              {'is_system' in contentType && contentType.is_system && (
                <Badge variant="outline">System</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {contentType.collection}
              </code>
              {'singleton' in contentType && contentType.singleton && (
                <Badge variant="secondary">Singleton</Badge>
              )}
              {'hidden' in contentType && contentType.hidden && (
                <Badge variant="secondary" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </Badge>
              )}
            </div>
            {/* {contentType.note && (
              <p className="text-sm text-muted-foreground mt-2">
                {contentType.note}
              </p>
            )} */}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddField}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Full options…
            </Button>
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={handleSaveOrder}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(true)}
              disabled={'is_system' in contentType && contentType.is_system}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteContentTypeDialogOpen(true)}
              disabled={'is_system' in contentType && contentType.is_system}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Inline form builder: add field in one click */}
        <div className="border rounded-lg bg-muted/30 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Field type</Label>
              <select
                value={addFieldTypeKey}
                onChange={(e) => setAddFieldTypeKey(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {formElements.length === 0 && (
                  <option value="">Loading…</option>
                )}
                {formElements.map((fe) => (
                  <option key={fe.id} value={fe.key}>
                    {fe.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground">Field name (API key)</Label>
              <Input
                placeholder="e.g. title, body, published_at"
                value={addFieldName}
                onChange={(e) => setAddFieldName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddField()}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 h-9 mt-6">
              <Checkbox
                id="quick-add-required"
                checked={addFieldRequired}
                onCheckedChange={(v) => setAddFieldRequired(!!v)}
              />
              <Label htmlFor="quick-add-required" className="text-sm font-normal cursor-pointer">Required</Label>
            </div>
            <Button onClick={handleQuickAddField} disabled={addFieldSaving || !addFieldName.trim()}>
              {addFieldSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2">Add field</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Choose type, enter a name, then click Add. Drag rows to reorder; use Edit on a field for more options.
          </p>
        </div>

        {/* Fields List */}
        {fields.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No fields yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use the form above to add your first field in one click
            </p>
          </div>
        ) : (
          <div className="border rounded-lg bg-white">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => {
                  // For components, check if there are nested fields (by group or component_id)
                  // For now, we'll check if options contains component fields
                  const nestedFields: ContentTypeField[] = []
                  const fieldType = (field.type || '').toLowerCase()
                  const fieldInterface = (('interface' in field ? field.interface : '') || '').toLowerCase()
                  
                  if (fieldType === 'component' && 'options' in field && field.options?.fields) {
                    // If component has nested fields in options (ContentTypeField only)
                    nestedFields.push(...(field.options.fields as ContentTypeField[]))
                  }
                  
                  // Check if field is expandable (component, schema, or dynamic zone)
                  const isExpandable = fieldType === 'component' || 
                                       fieldInterface === 'schema' || 
                                       fieldInterface === 'schema-selector' ||
                                       fieldInterface === 'dynamic-zone' || 
                                       fieldInterface === 'dynamic_zone'
                  
                  return (
                    <SortableFieldItem
                      key={field.id}
                      field={field}
                      onEdit={() => handleEditField(field)}
                      onDelete={() => handleDeleteField(field)}
                      isExpanded={expandedComponents.has(field.id)}
                      onToggleExpand={() => {
                        setExpandedComponents((prev) => {
                          const next = new Set(prev)
                          if (next.has(field.id)) {
                            next.delete(field.id)
                          } else {
                            next.add(field.id)
                          }
                          return next
                        })
                      }}
                      nestedFields={nestedFields}
                      contentTypes={allContentTypes}
                    />
                  )
                })}
              </SortableContext>
            </DndContext>

            <div className="px-4 py-3 border-t border-gray-100 text-sm text-muted-foreground">
              Add more fields using the form builder above, or drag to reorder.
            </div>
          </div>
        )}

        {/* Add Field Modal */}
        <AddFieldModal
          open={addFieldModalOpen}
          onOpenChange={setAddFieldModalOpen}
          contentTypeId={contentType.id}
          contentTypeName={contentType.name}
          onSuccess={handleFieldAdded}
          useV2={useV2}
        />

        {/* Edit Field Modal */}
        {editingField && (
          <EditFieldModal
            open={editFieldModalOpen}
            onOpenChange={setEditFieldModalOpen}
            contentTypeId={contentType.id}
            contentTypeName={contentType.name}
            field={editingField}
            onSuccess={handleEditFieldSuccess}
            useV2={useV2}
          />
        )}

        {/* Edit Modal with Delete */}
        <EditContentTypeModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          contentType={contentType as ContentType & { slug?: string; config?: Record<string, unknown> }}
          onSuccess={handleEditSuccess}
          onDelete={handleDeleteSuccess}
          showDeleteButton={true}
          useV2={useV2}
        />

        {/* Delete Content Model Confirmation Dialog */}
        <AlertDialog open={deleteContentTypeDialogOpen} onOpenChange={setDeleteContentTypeDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content Model</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{contentType?.name}&quot;? This action cannot be undone.
                Make sure there are no content entries using this content model.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingContentType} onClick={() => setDeleteContentTypeDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteContentType}
                disabled={deletingContentType}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingContentType ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Field Confirmation Dialog */}
        <AlertDialog open={deleteFieldDialogOpen} onOpenChange={setDeleteFieldDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the field "{fieldToDelete ? ('name' in fieldToDelete ? fieldToDelete.name : fieldToDelete.field) : ''}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving} onClick={() => setFieldToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteField}
                disabled={saving}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
