'use client'

import { useState, useEffect } from 'react'
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
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { FieldFormRenderer } from './field-forms'
import { fieldConfigurationSchema, FieldConfigurationFormData } from './field-forms/types'

interface EditFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTypeId: string
  contentTypeName?: string
  field: ContentTypeField
  onSuccess: () => void
}

export function EditFieldModal({
  open,
  onOpenChange,
  contentTypeId,
  contentTypeName,
  field,
  onSuccess,
}: EditFieldModalProps) {
  const { toast } = useToast()
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
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

  useEffect(() => {
    if (open && field) {
      loadFormElement()
      loadContentTypes()
      setSettingsTab('BASIC')
      setSchemaStep(1)
      setSchemaIconSearch('')
    }
  }, [open, field])

  // Load form element and populate form when formElement is loaded
  useEffect(() => {
    if (formElement && field) {
      populateFormFromField()
    }
  }, [formElement, field])

  const loadContentTypes = async () => {
    try {
      setLoadingContentTypes(true)
      const data = await contentTypesApi.getAll()
      setContentTypes(data || [])
      // Exclude current data model to prevent circular references
      const filtered = data.filter(ct => ct.id !== contentTypeId)
      setAvailableDataModels(filtered || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content types',
        variant: 'destructive',
      })
    } finally {
      setLoadingContentTypes(false)
    }
  }

  const loadFormElement = async () => {
    try {
      setLoading(true)
      // Find the form element based on field's interface or type
      const allElements = await formElementsApi.getAll()
      const element = allElements.find(
        (fe) => fe.key === field.interface || fe.type === field.type || fe.key === field.type
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

    // Extract values from field.options and field.validation
    const options = field.options || {}
    const validation = field.validation || {}

    // For schema fields, always start at step 1 when editing
    if (formElement.key === 'schema') {
      setSchemaStep(1)
    }

    reset({
      field: field.field,
      required: field.required || false,
      hidden: field.hidden || false,
      readonly: field.readonly || false,
      private: options.private || formElement.default_settings?.private || false,
      localized: options.localized || false,
      unique: validation.unique || false,
      minLengthEnabled: !!validation.minLength,
      maxLengthEnabled: !!validation.maxLength,
      note: field.note || '',
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
    })
  }

  const handleSchemaStep1Next = () => {
    const displayName = watch('schemaDisplayName')
    
    // Validation for step 1
    if (!displayName || displayName.trim() === '') {
      toast({
        title: 'Error',
        description: 'Display name is required',
        variant: 'destructive',
      })
      return
    }
    
    setSchemaStep(2)
  }

  const handleSchemaStep2Back = () => {
    setSchemaStep(1)
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
        toast({
          title: 'Error',
          description: 'Field name is required',
          variant: 'destructive',
        })
        return
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
            sourceCollection: contentTypeId,
          }),
          // Schema-specific options
          ...(formElement.key === 'schema' && {
            schemaDisplayName: data.schemaDisplayName,
            schemaIcon: data.schemaIcon,
            schemaId: data.schemaId,
            schemaRepeatable: data.schemaRepeatable,
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

      await contentTypesApi.updateField(contentTypeId, field.id, updateDto)
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
                {contentTypeName && (
                  <span className="text-sm text-muted-foreground">{contentTypeName}</span>
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
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              settingsTab === 'BASIC'
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
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              settingsTab === 'ADVANCED'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ADVANCED SETTINGS
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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
                contentTypeName={contentTypeName}
                contentTypeId={contentTypeId}
                contentTypes={contentTypes}
                loadingContentTypes={loadingContentTypes}
                schemaStep={schemaStep}
                onSchemaStep1Next={handleSchemaStep1Next}
                onSchemaStep2Back={handleSchemaStep2Back}
                schemaIconSearch={schemaIconSearch}
                onSchemaIconSearchChange={setSchemaIconSearch}
                availableDataModels={availableDataModels}
                currentDataModelId={contentTypeId}
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
