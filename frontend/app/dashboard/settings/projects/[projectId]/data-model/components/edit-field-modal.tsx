'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { getIconComponent } from '@/lib/utils/icon-library'
import { contentTypesApi, ContentTypeField, UpdateFieldDto } from '@/lib/api/content-types'
import { collectionsApi, UpdateCollectionFieldDto } from '@/lib/api/collections'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { componentsApi, Component, ComponentField, UpdateComponentFieldDto } from '@/lib/api/components'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { FieldFormRenderer } from './field-forms'
import { fieldConfigurationSchema, FieldConfigurationFormData } from './field-forms/types'

interface EditFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTypeId?: string
  contentTypeName?: string
  /** When set, we're editing a component field; use componentsApi and ignore contentTypeId for save */
  componentId?: string
  componentName?: string
  field: ContentTypeField | import('@/lib/api/collections').CollectionField | ComponentField
  onSuccess: () => void
  useV2?: boolean
}

const isComponentField = (f: EditFieldModalProps['field']): f is ComponentField =>
  'component_id' in f && !!f.component_id

export function EditFieldModal({
  open,
  onOpenChange,
  contentTypeId,
  contentTypeName,
  componentId,
  componentName,
  field,
  onSuccess,
  useV2 = false,
}: EditFieldModalProps) {
  const isComponentMode = !!componentId
  const displayName = isComponentMode ? componentName : contentTypeName
  const entityId = isComponentMode ? componentId : contentTypeId
  const { toast } = useToast()
  const { currentProject } = useProject()
  const [formElement, setFormElement] = useState<FormElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'BASIC' | 'ADVANCED'>('BASIC')
  const [contentTypes, setContentTypes] = useState<any[]>([])
  const [loadingContentTypes, setLoadingContentTypes] = useState(false)
  // Schema-specific state
  const [schemaStep, setSchemaStep] = useState<1 | 2>(1)
  const [schemaIconSearch, setSchemaIconSearch] = useState('')
  const [availableDataModels, setAvailableDataModels] = useState<any[]>([])
  const [dynamicZoneStep, setDynamicZoneStep] = useState<1 | 2>(1)
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])
  const [components, setComponents] = useState<Component[]>([])
  const [loadingComponents, setLoadingComponents] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
  } = useForm<FieldConfigurationFormData>({
    resolver: zodResolver(fieldConfigurationSchema),
    defaultValues: {
      required: false,
      hidden: false,
      readonly: false,
      private: false,
      localized: false,
      unique: false,
      minLengthEnabled: false,
      maxLengthEnabled: false,
      allowedTypes: [],
    },
  })

  const loadComponents = async () => {
    if (!currentProject) return
    try {
      setLoadingComponents(true)
      const data = await componentsApi.getAll(currentProject.id)
      setComponents(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load components',
        variant: 'destructive',
      })
    } finally {
      setLoadingComponents(false)
    }
  }

  useEffect(() => {
    if (open && field && currentProject) {
      loadFormElement()
      loadContentTypes()
      loadComponents()
      setSettingsTab('BASIC')
      setSchemaStep(1)
      setSchemaIconSearch('')
    }
  }, [open, field, currentProject])

  // Load form element and populate form when formElement is loaded
  useEffect(() => {
    if (formElement && field) {
      populateFormFromField()
    }
  }, [formElement, field])

  const loadContentTypes = async () => {
    if (!currentProject) return
    try {
      setLoadingContentTypes(true)
      if (useV2) {
        const data = await collectionsApi.getAll(currentProject.id)
        const arr = data || []
        setContentTypes(arr)
        setAvailableDataModels(entityId ? arr.filter((c: { id: string }) => c.id !== entityId) : arr)
      } else {
        const data = await contentTypesApi.getAll(currentProject.id)
        setContentTypes(data || [])
        const arr = data || []
        setAvailableDataModels(entityId ? arr.filter((ct: { id: string }) => ct.id !== entityId) : arr)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content models',
        variant: 'destructive',
      })
    } finally {
      setLoadingContentTypes(false)
    }
  }

  const loadFormElement = async () => {
    try {
      setLoading(true)
      if (!currentProject) {
        setLoading(false)
        return
      }
      const allElements = await formElementsApi.getAll(currentProject.id)
      // ComponentField only has type; ContentType/Collection have interface or type
      const fieldInterface = !isComponentField(field) && 'interface' in field ? field.interface : undefined
      const element = allElements.find(
        (fe) => fe.key === fieldInterface || fe.type === field.type || fe.key === field.type
      )

      if (!element) {
        toast({
          title: 'Error',
          description: 'Form element not found for this field type',
          variant: 'destructive',
        })
        return
      }

      setFormElement(element)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load form element',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const populateFormFromField = () => {
    if (!formElement || !field) return

    // ComponentField: name, type, config (required inside config)
    const isCompField = isComponentField(field)
    const isV2Field = 'is_required' in field
    const options = isCompField ? (field.config || {}) : (isV2Field ? (field.config || {}) : (field.options || {}))
    const validation = isCompField || isV2Field ? {} : (field.validation || {})
    const fieldName = isCompField ? field.name : ((field as { field?: string; name?: string }).field ?? (field as { name?: string }).name)
    const required = isCompField
      ? !!(field.config && (field.config as { required?: boolean }).required)
      : ((field as { required?: boolean; is_required?: boolean }).required ?? (field as { is_required?: boolean }).is_required ?? false)

    // For schema fields, always start at step 1 when editing
    if (formElement.key === 'schema') {
      setSchemaStep(1)
    }

    reset({
      field: fieldName,
      required,
      hidden: (field as { hidden?: boolean }).hidden ?? options.hidden ?? false,
      readonly: (field as { readonly?: boolean }).readonly ?? options.readonly ?? false,
      private: options.private || formElement.default_settings?.private || false,
      localized: options.localized || false,
      unique: validation.unique || false,
      minLengthEnabled: !!validation.minLength,
      maxLengthEnabled: !!validation.maxLength,
      note: (field as { note?: string }).note ?? options.note ?? '',
      variant: options.variant || formElement.default_variant || undefined,
      minLength: validation.minLength || undefined,
      maxLength: validation.maxLength || undefined,
      defaultValue: options.defaultValue || formElement.interface?.defaultValue || undefined,
      regexPattern: validation.regexPattern || options.regexPattern || undefined,
      allowedTypes: options.allowedTypes || formElement.default_settings?.allowedTypes || [],
      // Relation-specific
      relationType: options.relationType || undefined,
      targetCollection: options.targetCollection || undefined,
      targetFieldName: options.targetFieldName || undefined,
      // Schema-specific
      schemaDisplayName: options.schemaDisplayName || '',
      schemaIcon: options.schemaIcon || 'Database',
      schemaId: options.schemaId || undefined,
      schemaRepeatable: options.schemaRepeatable || false,
      // Component-specific (v2)
      componentId: options.component_id || options.componentId || undefined,
    })
    if (formElement.key === 'dynamic_zone' || formElement.key === 'dynamic-zone') {
      setDynamicZoneStep(2)
      const allowedSchemas = options.allowed_schemas || options.allowedSchemas || []
      setSelectedSchemas(Array.isArray(allowedSchemas) ? allowedSchemas : [])
    }
  }

  const handleSchemaStep1Next = async () => {
    const displayName = watch('schemaDisplayName')

    // Validation for step 1
    if (!displayName || displayName.trim() === '') {
      setError('schemaDisplayName', {
        type: 'manual',
        message: 'Display name is required',
      })
      return
    }

    clearErrors('schemaDisplayName')
    setSchemaStep(2)
  }

  const handleSchemaStep2Back = () => {
    setSchemaStep(1)
  }

  const handleDynamicZoneStep1Next = async () => {
    const fieldName = watch('field')
    if (!fieldName || fieldName.trim() === '') {
      setError('field', {
        type: 'manual',
        message: 'Field name is required',
      })
      return
    }
    clearErrors('field')
    setDynamicZoneStep(2)
  }

  const handleDynamicZoneStep2Back = () => {
    setDynamicZoneStep(1)
  }

  const handleDynamicZoneSubmit = async (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!formElement || formElement.key !== 'dynamic_zone' || dynamicZoneStep !== 2) {
      handleSubmit(onSubmit)(e)
      return
    }

    const fieldValue = watch('field') || ''
    if (!fieldValue.trim()) {
      setError('field', {
        type: 'manual',
        message: 'Field name is required',
      })
      setDynamicZoneStep(1)
      setSettingsTab('BASIC')
      trigger('field')
      return
    }

    if (selectedSchemas.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one component',
        variant: 'destructive',
      })
      return
    }

    const formData: FieldConfigurationFormData = {
      field: fieldValue,
      required: watch('required') || false,
      hidden: watch('hidden') || false,
      readonly: watch('readonly') || false,
      private: watch('private') || false,
      localized: watch('localized') || false,
      unique: watch('unique') || false,
      note: watch('note') || '',
      variant: watch('variant'),
      minLength: watch('minLength'),
      maxLength: watch('maxLength'),
      minLengthEnabled: watch('minLengthEnabled') || false,
      maxLengthEnabled: watch('maxLengthEnabled') || false,
      defaultValue: watch('defaultValue'),
      regexPattern: watch('regexPattern'),
      allowedTypes: watch('allowedTypes') || [],
      schemaDisplayName: watch('schemaDisplayName'),
      schemaIcon: watch('schemaIcon'),
      schemaId: watch('schemaId'),
      schemaRepeatable: watch('schemaRepeatable') || false,
      relationType: watch('relationType'),
      targetCollection: watch('targetCollection'),
      targetFieldName: watch('targetFieldName'),
    }

    selectedSchemas.length > 0 && setValue('field', fieldValue)
    await onSubmit(formData)
  }

  const onSubmit = async (data: FieldConfigurationFormData) => {
    if (!formElement) return

    // Schema field validation
    if (formElement.key === 'schema') {
      if (schemaStep === 1) {
        handleSchemaStep1Next()
        return
      }
      // Step 2 validation
      if (!data.field || data.field.trim() === '') {
        setError('field', {
          type: 'manual',
          message: 'Field name is required',
        })
        return
      }
    }

    if (formElement.key === 'component') {
      if (!data.componentId || data.componentId.trim() === '') {
        setError('componentId', {
          type: 'manual',
          message: 'Please select a component',
        })
        return
      }
      clearErrors('componentId')
    }

    if (formElement.key === 'dynamic_zone') {
      if (dynamicZoneStep === 1) {
        handleDynamicZoneStep1Next()
        return
      }

      const fieldValue = data.field || watch('field') || ''
      if (!fieldValue || fieldValue.trim() === '') {
        setError('field', {
          type: 'manual',
          message: 'Field name is required',
        })
        setDynamicZoneStep(1)
        setSettingsTab('BASIC')
        trigger('field')
        return
      }

      if (selectedSchemas.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one component',
          variant: 'destructive',
        })
        return
      }

      if (!data.field && fieldValue) {
        setValue('field', fieldValue)
      }
    }

    try {
      setSaving(true)

      const variant = formElement.variants?.find((v: any) => v.key === data.variant)
      const interfaceConfig = variant?.component
        ? { ...formElement.interface, component: variant.component }
        : formElement.interface

      const updateDto: UpdateFieldDto = {
        field: data.field,
        type: formElement.type,
        interface: interfaceConfig?.component || formElement.key,
        options: {
          ...interfaceConfig,
          ...formElement.default_settings,
          variant: data.variant || formElement.default_variant,
          allowedTypes: data.allowedTypes && data.allowedTypes.length > 0 ? data.allowedTypes : (formElement.default_settings?.allowedTypes || formElement.interface?.settings?.allowedTypes),
          private: data.private,
          localized: data.localized,
          unique: data.unique,
          regexPattern: data.regexPattern,
          // Relation-specific options
          ...(formElement.key === 'relation' && {
            relationType: data.relationType || 'oneWay',
            targetCollection: data.targetCollection,
            targetFieldName: data.targetFieldName,
            sourceCollection: entityId,
          }),
          // Schema-specific options
          ...(formElement.key === 'schema' && {
            schemaDisplayName: data.schemaDisplayName,
            schemaIcon: data.schemaIcon,
            schemaId: data.schemaId,
            schemaRepeatable: data.schemaRepeatable,
          }),
          // Component-specific options (v2)
          ...(formElement.key === 'component' && data.componentId && {
            component_id: data.componentId,
          }),
        },
        validation: {
          ...formElement.validation_rules,
          required: data.required,
          unique: data.unique,
          minLength: data.minLengthEnabled ? data.minLength : undefined,
          maxLength: data.maxLengthEnabled ? data.maxLength : undefined,
          regexPattern: data.regexPattern,
        },
        required: data.required,
        hidden: data.hidden,
        readonly: data.readonly,
        note: data.note || formElement.description || undefined,
      }

      if (componentId && isComponentField(field)) {
        const dto: UpdateComponentFieldDto = {
          name: updateDto.field,
          type: updateDto.type,
          required: updateDto.required,
          config: updateDto.options,
        }
        await componentsApi.updateField(componentId, field.id, dto)
      } else if (useV2 && contentTypeId) {
        const dto: UpdateCollectionFieldDto = {
          name: updateDto.field,
          type: updateDto.type,
          is_required: updateDto.required,
          config: updateDto.options,
        }
        await collectionsApi.updateField(contentTypeId, field.id, dto)
      } else if (contentTypeId) {
        await contentTypesApi.updateField(contentTypeId, field.id, updateDto)
      }
      toast({
        title: 'Success',
        description: 'Field updated successfully',
      })
      reset()
      setSchemaStep(1)
      setSchemaIconSearch('')
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to update field',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      reset()
      onOpenChange(false)
    }
  }

  if (loading || !formElement) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading field configuration</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading field configuration...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            {formElement && (
              <>
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${formElement.icon_color || '#9333EA'}20`,
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(formElement.icon)
                    const iconColor = formElement.icon_color || '#9333EA'
                    return IconComponent ? (
                      <div style={{ color: iconColor }}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                    ) : (
                      <span className="text-xl">📝</span>
                    )
                  })()}
                </div>
                {(displayName || contentTypeName) && (
                  <span className="text-sm text-muted-foreground">{displayName ?? contentTypeName}</span>
                )}
              </>
            )}
          </div>
          <DialogTitle>
            {formElement?.key === 'schema'
              ? `Edit schema (${schemaStep}/2)`
              : `Edit ${formElement?.name || 'field'} field`
            }
          </DialogTitle>
          <DialogDescription>
            {formElement?.description || 'Update the field settings'}
          </DialogDescription>
        </DialogHeader>

        {/* Settings Tabs */}
        <div className="flex items-center gap-4 border-b mb-4">
          <button
            onClick={() => setSettingsTab('BASIC')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${settingsTab === 'BASIC'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            BASIC SETTINGS
          </button>
          <button
            onClick={() => {
              if (!(formElement?.key === 'schema' && schemaStep === 1)) {
                setSettingsTab('ADVANCED')
              }
            }}
            disabled={formElement?.key === 'schema' && schemaStep === 1}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${settingsTab === 'ADVANCED'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ADVANCED SETTINGS
          </button>
        </div>

        <form
          onSubmit={
            formElement?.key === 'dynamic_zone' && dynamicZoneStep === 2
              ? handleDynamicZoneSubmit
              : handleSubmit(onSubmit)
          }
        >
          <div className="space-y-4 py-4">
            {formElement && (
              <FieldFormRenderer
                formElement={formElement}
                form={{
                  register,
                  handleSubmit,
                  formState: { errors },
                  reset,
                  watch,
                  setValue,
                } as any}
                saving={saving}
                settingsTab={settingsTab}
                contentTypeName={displayName ?? contentTypeName}
                contentTypeId={entityId ?? contentTypeId}
                contentTypes={contentTypes}
                loadingContentTypes={loadingContentTypes}
                schemaStep={schemaStep}
                onSchemaStep1Next={handleSchemaStep1Next}
                onSchemaStep2Back={handleSchemaStep2Back}
                schemaIconSearch={schemaIconSearch}
                onSchemaIconSearchChange={setSchemaIconSearch}
                availableDataModels={availableDataModels}
                currentDataModelId={entityId ?? contentTypeId}
                components={components}
                loadingComponents={loadingComponents}
                dynamicZoneStep={dynamicZoneStep}
                  onDynamicZoneStep1Next={handleDynamicZoneStep1Next}
                  onDynamicZoneStep2Back={handleDynamicZoneStep2Back}
                  selectedSchemas={selectedSchemas}
                  onSelectedSchemasChange={setSelectedSchemas}
              />
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            {formElement?.key === 'schema' && schemaStep === 1 ? (
              <Button
                type="button"
                onClick={handleSchemaStep1Next}
                disabled={saving}
              >
                Configure the schema
              </Button>
            ) : (
              <>
                {formElement?.key === 'schema' && schemaStep === 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSchemaStep2Back}
                    disabled={saving}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
