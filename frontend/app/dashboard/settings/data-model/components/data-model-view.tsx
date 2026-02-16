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
} from 'lucide-react'
import { contentTypesApi, ContentType, ContentTypeField } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'
import { AddFieldModal } from './add-field-modal'
import { EditFieldModal } from './edit-field-modal'
import { EditContentTypeModal } from './edit-content-type-modal'
import { getFieldTypeConfig } from './field-type-icons'

interface DataModelViewProps {
  contentTypeId: string
  onRefresh?: () => void
}

interface SortableFieldItemProps {
  field: ContentTypeField
  onEdit: () => void
  onDelete: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  nestedFields?: ContentTypeField[]
}

function SortableFieldItem({ 
  field, 
  onEdit, 
  onDelete,
  isExpanded = false,
  onToggleExpand,
  nestedFields = [],
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

  const fieldConfig = getFieldTypeConfig(field.type)
  const IconComponent = fieldConfig.icon
  const isComponent = field.type.toLowerCase() === 'component'
  const hasNestedFields = nestedFields && nestedFields.length > 0

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

        {/* Expand/Collapse Button for Components */}
        {isComponent && (
          <button
            onClick={onToggleExpand}
            className="text-gray-400 hover:text-gray-600 p-0.5"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!isComponent && <div className="w-5" />}

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
              {field.required && (
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
                    {nestedField.required && (
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
    </>
  )
}

export function DataModelView({ contentTypeId, onRefresh }: DataModelViewProps) {
  const { toast } = useToast()
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false)
  const [editFieldModalOpen, setEditFieldModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ContentTypeField | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteFieldDialogOpen, setDeleteFieldDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<ContentTypeField | null>(null)
  const [fields, setFields] = useState<ContentTypeField[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (contentTypeId) {
      loadContentType()
    }
  }, [contentTypeId])

  const loadContentType = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contentTypesApi.getById(contentTypeId)
      setContentType(data)
      setFields(data.fields || [])
      setHasUnsavedChanges(false)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load data model')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load data model',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
      await contentTypesApi.updateFieldOrder(
        contentType.id,
        fields.map(f => ({ id: f.id, sort: f.sort || 0 }))
      )
      
      toast({
        title: 'Success',
        description: 'Field order saved successfully',
      })
      setHasUnsavedChanges(false)
      await loadContentType()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to save field order',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    setAddFieldModalOpen(true)
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

  const handleEditField = (field: ContentTypeField) => {
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

  const handleDeleteField = (field: ContentTypeField) => {
    setFieldToDelete(field)
    setDeleteFieldDialogOpen(true)
  }

  const handleConfirmDeleteField = async () => {
    if (!contentType || !fieldToDelete) return

    try {
      setSaving(true)
      await contentTypesApi.deleteField(contentType.id, fieldToDelete.id)
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
        <span className="ml-2 text-muted-foreground">Loading data model...</span>
      </div>
    )
  }

  if (error || !contentType) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Data model not found'}
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
              {contentType.icon && (
                <span className="text-2xl">{contentType.icon}</span>
              )}
              <h2 className="text-2xl font-semibold">{contentType.name}</h2>
              {contentType.is_system && (
                <Badge variant="outline">System</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {contentType.collection}
              </code>
              {contentType.singleton && (
                <Badge variant="secondary">Singleton</Badge>
              )}
              {contentType.hidden && (
                <Badge variant="secondary" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Hidden
                </Badge>
              )}
            </div>
            {contentType.note && (
              <p className="text-sm text-muted-foreground mt-2">
                {contentType.note}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(true)}
              disabled={contentType.is_system}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
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
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add new field
            </Button>
          </div>
        </div>

        {/* Fields List */}
        {fields.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No fields</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first field to this data model
            </p>
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add new field
            </Button>
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
                  if (field.type.toLowerCase() === 'component' && field.options?.fields) {
                    // If component has nested fields in options
                    nestedFields.push(...(field.options.fields as ContentTypeField[]))
                  }
                  
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
                    />
                  )
                })}
              </SortableContext>
            </DndContext>

            {/* Add Field Button at Bottom */}
            <div className="px-4 py-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddField}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another field
              </Button>
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
          />
        )}

        {/* Edit Modal with Delete */}
        <EditContentTypeModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          contentType={contentType}
          onSuccess={handleEditSuccess}
          onDelete={handleDeleteSuccess}
          showDeleteButton={true}
        />

        {/* Delete Field Confirmation Dialog */}
        <AlertDialog open={deleteFieldDialogOpen} onOpenChange={setDeleteFieldDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the field "{fieldToDelete?.field}"? This action cannot be undone.
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
