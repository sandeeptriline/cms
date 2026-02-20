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
import { Puzzle, Plus, Edit, Save, Loader2, AlertCircle, SlidersHorizontal, Trash2, GripVertical } from 'lucide-react'
import { componentsApi, Component, ComponentField } from '@/lib/api/components'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { getFieldTypeConfig } from '@/app/dashboard/settings/projects/[projectId]/data-model/components/field-type-icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AddComponentFieldModal } from './add-component-field-modal'
import { EditFieldModal } from '@/app/dashboard/settings/projects/[projectId]/data-model/components/edit-field-modal'

export interface ComponentModelViewProps {
  componentId: string
  projectId: string
  onRefresh?: () => void
  onEditComponent?: () => void
  onDeleteComponent?: () => void
}

function SortableComponentFieldRow({
  field,
  isRequired,
  onEdit,
  onDelete,
}: {
  field: ComponentField
  isRequired: boolean
  onEdit: () => void
  onDelete: () => void
}) {
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

  const config = getFieldTypeConfig(field.type)
  const Icon = config.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isDragging ? 'bg-white shadow-lg rounded' : ''
      }`}
    >
      {/* Drag Handle - same as DataModelView */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      {/* Spacer so alignment matches Content Model (which has expand chevron for some rows) */}
      <div className="w-5" />
      {/* Field Type Icon - same as DataModelView */}
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${config.color}20` }}
      >
        <div style={{ color: config.color }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {/* Field Name and Type - same as DataModelView */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {field.name}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {config.label}
        </div>
      </div>
      {/* Actions - same as DataModelView (Edit purple, Delete Trash2 icon) */}
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
  )
}

export function ComponentModelView({
  componentId,
  projectId,
  onRefresh,
  onEditComponent,
  onDeleteComponent,
}: ComponentModelViewProps) {
  const { toast } = useToast()
  const [component, setComponent] = useState<Component | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<ComponentField | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<ComponentField | null>(null)
  const [saving, setSaving] = useState(false)
  const [addFieldName, setAddFieldName] = useState('')
  const [addFieldTypeKey, setAddFieldTypeKey] = useState('')
  const [addFieldRequired, setAddFieldRequired] = useState(false)
  const [addFieldSaving, setAddFieldSaving] = useState(false)
  const [fields, setFields] = useState<ComponentField[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const loadComponent = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await componentsApi.getById(componentId)
      setComponent(data)
      setFields(data.fields ?? [])
      setHasUnsavedChanges(false)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load component')
      toast({ title: 'Error', description: e.message || 'Failed to load component', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const loadFormElements = async () => {
    if (!projectId) return
    try {
      const data = await formElementsApi.getAll(projectId)
      setFormElements(Array.isArray(data) ? data : [])
    } catch {
      setFormElements([])
    }
  }

  useEffect(() => {
    if (componentId) {
      loadComponent()
      loadFormElements()
    }
  }, [componentId])

  useEffect(() => {
    if (formElements.length > 0 && !addFieldTypeKey) setAddFieldTypeKey(formElements[0].key)
  }, [formElements, addFieldTypeKey])

  const handleQuickAddField = async () => {
    const name = addFieldName.trim().replace(/\s+/g, '_').toLowerCase() || addFieldName.trim()
    if (!name) {
      toast({ title: 'Field name required', variant: 'destructive' })
      return
    }
    const fe = formElements.find((e) => e.key === addFieldTypeKey)
    if (!fe || !component) {
      toast({ title: 'Select a field type', variant: 'destructive' })
      return
    }
    setAddFieldSaving(true)
    try {
      await componentsApi.addField(component.id, {
        name,
        type: fe.type,
        required: addFieldRequired,
        config: fe.default_settings ? { ...fe.default_settings } : undefined,
      })
      toast({ title: 'Field added' })
      setAddFieldName('')
      await loadComponent()
      setHasUnsavedChanges(false)
      onRefresh?.()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to add field', variant: 'destructive' })
    } finally {
      setAddFieldSaving(false)
    }
  }

  const handleEditField = (field: ComponentField) => {
    setEditingField(field)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setEditingField(null)
    loadComponent()
    onRefresh?.()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        setHasUnsavedChanges(true)
        return reordered
      })
    }
  }

  const handleSaveOrder = async () => {
    if (!component) return
    try {
      setSavingOrder(true)
      await componentsApi.updateFieldOrder(
        component.id,
        fields.map((f, index) => ({ id: f.id, sort: index })),
      )
      toast({ title: 'Order saved' })
      setHasUnsavedChanges(false)
      await loadComponent()
      onRefresh?.()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to save order', variant: 'destructive' })
    } finally {
      setSavingOrder(false)
    }
  }

  const handleDeleteField = (field: ComponentField) => {
    setFieldToDelete(field)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDeleteField = async () => {
    if (!component || !fieldToDelete) return
    try {
      setSaving(true)
      await componentsApi.deleteField(component.id, fieldToDelete.id)
      toast({ title: 'Field deleted' })
      setDeleteDialogOpen(false)
      setFieldToDelete(null)
      await loadComponent()
      onRefresh?.()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete field', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const isRequired = (f: ComponentField) => !!(f.config && (f.config as { required?: boolean }).required)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading component…</span>
      </div>
    )
  }

  if (error || !component) {
    return (
      <div className="px-6 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Component not found'}</AlertDescription>
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
            <h2 className="text-2xl font-semibold">{component.name}</h2>
            <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">{component.slug}</code>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Full options…
            </Button>
            {hasUnsavedChanges && (
              <Button variant="outline" onClick={handleSaveOrder} disabled={savingOrder}>
                <Save className="h-4 w-4 mr-2" />
                {savingOrder ? 'Saving…' : 'Save'}
              </Button>
            )}
            {onEditComponent && (
              <Button variant="outline" onClick={onEditComponent}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {onDeleteComponent && (
              <Button variant="outline" onClick={onDeleteComponent} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Inline add field (same pattern as content model) */}
        <div className="border rounded-lg bg-muted/30 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Field type</Label>
              <select
                value={addFieldTypeKey}
                onChange={(e) => setAddFieldTypeKey(e.target.value)}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                {formElements.length === 0 && <option value="">Loading…</option>}
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
                placeholder="e.g. title, meta_description"
                value={addFieldName}
                onChange={(e) => setAddFieldName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddField()}
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2 h-9 mt-6">
              <Checkbox
                id="comp-required"
                checked={addFieldRequired}
                onCheckedChange={(v) => setAddFieldRequired(!!v)}
              />
              <Label htmlFor="comp-required" className="text-sm font-normal cursor-pointer">Required</Label>
            </div>
            <Button onClick={handleQuickAddField} disabled={addFieldSaving || !addFieldName.trim()}>
              {addFieldSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2">Add field</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Choose type, name, then Add. Use Full options… for more settings.
          </p>
        </div>

        {/* Fields list */}
        {fields.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No fields yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use the form above to add your first field
            </p>
          </div>
        ) : (
          <div className="border rounded-lg bg-white">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {fields.map((field) => (
                  <SortableComponentFieldRow
                    key={field.id}
                    field={field}
                    isRequired={isRequired(field)}
                    onEdit={() => handleEditField(field)}
                    onDelete={() => handleDeleteField(field)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <div className="px-4 py-3 border-t border-gray-100 text-sm text-muted-foreground">
              Add more fields using the form builder above, or drag to reorder.
            </div>
          </div>
        )}

        <AddComponentFieldModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          componentId={component.id}
          componentName={component.name}
          projectId={projectId}
          onSuccess={() => { loadComponent(); onRefresh?.() }}
        />

        {editingField && (
          <EditFieldModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            componentId={component.id}
            componentName={component.name}
            field={editingField}
            onSuccess={handleEditSuccess}
          />
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete field</AlertDialogTitle>
              <AlertDialogDescription>
                Delete &quot;{fieldToDelete?.name}&quot;? This cannot be undone.
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
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
