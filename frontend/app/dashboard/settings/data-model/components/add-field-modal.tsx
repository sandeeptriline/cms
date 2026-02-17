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
import { iconLibrary, getIconComponent } from '@/lib/utils/icon-library'
import { contentTypesApi, CreateFieldDto } from '@/lib/api/content-types'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import { FieldFormRenderer } from './field-forms'
import { fieldConfigurationSchema, FieldConfigurationFormData } from './field-forms/types'

interface AddFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTypeId: string
  contentTypeName?: string
  onSuccess: () => void
}

type ViewMode = 'selection' | 'configuration'

export function AddFieldModal({
  open,
  onOpenChange,
  contentTypeId,
  contentTypeName,
  onSuccess,
}: AddFieldModalProps) {
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<ViewMode>('selection')
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedFormElement, setSelectedFormElement] = useState<FormElement | null>(null)
  const [activeTab, setActiveTab] = useState<'DEFAULT' | 'CUSTOM'>('DEFAULT')
  const [settingsTab, setSettingsTab] = useState<'BASIC' | 'ADVANCED'>('BASIC')
  const [contentTypes, setContentTypes] = useState<any[]>([])
  const [loadingContentTypes, setLoadingContentTypes] = useState(false)
  // Schema-specific state
  const [schemaStep, setSchemaStep] = useState<1 | 2>(1)
  const [schemaIconSearch, setSchemaIconSearch] = useState('')
  const [availableDataModels, setAvailableDataModels] = useState<any[]>([])
  // Dynamic Zone specific state
  const [dynamicZoneStep, setDynamicZoneStep] = useState<1 | 2>(1)
  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])

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

  useEffect(() => {
    if (open) {
      loadFormElements()
      loadContentTypes()
      setViewMode('selection')
      setSelectedFormElement(null)
      setSchemaStep(1)
      setSchemaIconSearch('')
      setDynamicZoneStep(1)
      setSelectedSchemas([])
      setSettingsTab('BASIC')
      reset()
    }
  }, [open, reset])

  // Reset to BASIC tab when schema step changes to 1
  useEffect(() => {
    if (selectedFormElement?.key === 'schema' && schemaStep === 1) {
      setSettingsTab('BASIC')
    }
  }, [schemaStep, selectedFormElement])

  const loadContentTypes = async () => {
    try {
      setLoadingContentTypes(true)
      const data = await contentTypesApi.getAll()
      setContentTypes(data || [])
      // Set available data models (excluding current one to prevent circular references)
      setAvailableDataModels(data || [])
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

  const loadFormElements = async () => {
    try {
      setLoading(true)
      const data = await formElementsApi.getAll()
      setFormElements(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load form elements',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectField = (formElement: FormElement) => {
    setSelectedFormElement(formElement)
    setViewMode('configuration')
    // Reset schema-specific state
    if (formElement.key === 'schema') {
      setSchemaStep(1)
      setSchemaIconSearch('')
    }
    if (formElement.key === 'dynamic_zone') {
      setDynamicZoneStep(1)
      setSelectedSchemas([])
    }
    reset({
      field: '',
      required: false,
      hidden: false,
      readonly: false,
      private: formElement.default_settings?.private || false,
      localized: false,
      unique: false,
      minLengthEnabled: false,
      maxLengthEnabled: false,
      note: '',
      variant: formElement.default_variant || undefined,
      minLength: formElement.validation_rules?.minLength || undefined,
      maxLength: formElement.validation_rules?.maxLength || undefined,
      defaultValue: formElement.interface?.defaultValue || undefined,
      regexPattern: formElement.interface?.regexPattern || undefined,
      allowedTypes: formElement.default_settings?.allowedTypes || formElement.interface?.settings?.allowedTypes || [],
      // Schema defaults
      schemaDisplayName: '',
      schemaIcon: 'Database',
      schemaId: undefined,
      schemaRepeatable: false,
    })
  }

  const handleBackToSelection = () => {
    setViewMode('selection')
    setSelectedFormElement(null)
    setSchemaStep(1)
    setSchemaIconSearch('')
    setDynamicZoneStep(1)
    setSelectedSchemas([])
    reset()
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
    const field = watch('field')
    // Validation for step 1
    if (!field || field.trim() === '') {
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

  const onSubmit = async (data: FieldConfigurationFormData) => {
    if (!selectedFormElement) return

    // Schema field validation
    if (selectedFormElement.key === 'schema') {
      if (schemaStep === 1) {
        handleSchemaStep1Next()
        return
      }

      // Step 2 validation
      // Field name is handled by standard submit, but we double check or let handleSubmit handle it.
      // Since field is required in schema, we assume it's valid if we are here? 
      // YES, handleSubmit only calls onSubmit if schema validation passes.
      // But verify if we have any custom logic.

      // Schema ID validation (might be optional in Zod but required for logic)
      if (!data.schemaId) {
        setError('schemaId', {
          type: 'manual',
          message: 'Please select a data model',
        })
        return
      }
    }

    // Dynamic Zone validation
    if (selectedFormElement.key === 'dynamic_zone') {
      if (dynamicZoneStep === 1) {
        handleDynamicZoneStep1Next()
        return
      }

      // Step 2 validation - ensure field name is set
      // Use watch to get the current field value since it might not be in data when input is not visible
      const fieldValue = data.field || watch('field') || ''
      if (!fieldValue || fieldValue.trim() === '') {
        setError('field', {
          type: 'manual',
          message: 'Field name is required',
        })
        // Switch back to step 1 to show the field name input
        setDynamicZoneStep(1)
        setSettingsTab('BASIC')
        // Manually trigger validation to show the error
        trigger('field')
        return
      }

      // Step 2 validation - ensure at least one schema is selected
      if (selectedSchemas.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one component',
          variant: 'destructive',
        })
        return
      }

      // Ensure the field value is set in the form data
      if (!data.field && fieldValue) {
        setValue('field', fieldValue)
      }
    }

    try {
      setSaving(true)

      const variant = selectedFormElement.variants?.find((v: any) => v.key === data.variant)
      const interfaceConfig = variant?.component
        ? { ...selectedFormElement.interface, component: variant.component }
        : selectedFormElement.interface

      // For dynamic zone, ensure we use the field value from watch if not in data
      const fieldName = data.field || (selectedFormElement.key === 'dynamic_zone' ? watch('field') : '')
      
      const fieldDto: CreateFieldDto = {
        field: fieldName,
        type: selectedFormElement.type,
        interface: interfaceConfig?.component || selectedFormElement.key,
        options: {
          ...interfaceConfig,
          ...selectedFormElement.default_settings,
          variant: data.variant || selectedFormElement.default_variant,
          allowedTypes: data.allowedTypes && data.allowedTypes.length > 0 ? data.allowedTypes : (selectedFormElement.default_settings?.allowedTypes || selectedFormElement.interface?.settings?.allowedTypes),
          private: data.private,
          localized: data.localized,
          unique: data.unique,
          regexPattern: data.regexPattern,
          // Relation-specific options
          ...(selectedFormElement.key === 'relation' && {
            relationType: data.relationType || 'oneWay',
            targetCollection: data.targetCollection,
            targetFieldName: data.targetFieldName,
            sourceCollection: contentTypeId,
          }),
          // Schema-specific options
          ...(selectedFormElement.key === 'schema' && {
            schemaDisplayName: data.schemaDisplayName,
            schemaIcon: data.schemaIcon,
            schemaId: data.schemaId,
            schemaRepeatable: data.schemaRepeatable,
          }),
          // Dynamic Zone options
          ...(selectedFormElement.key === 'dynamic_zone' && {
            allowed_schemas: selectedSchemas,
          }),
        },
        validation: {
          ...selectedFormElement.validation_rules,
          required: data.required,
          unique: data.unique,
          minLength: data.minLengthEnabled ? data.minLength : undefined,
          maxLength: data.maxLengthEnabled ? data.maxLength : undefined,
          regexPattern: data.regexPattern,
        },
        required: data.required,
        hidden: data.hidden,
        readonly: data.readonly,
        note: data.note || selectedFormElement.description || undefined,
      }

      await contentTypesApi.addField(contentTypeId, fieldDto)
      toast({
        title: 'Success',
        description: 'Field added successfully',
      })
      reset()
      setSchemaStep(1)
      setSchemaIconSearch('')
      setDynamicZoneStep(1)
      setSelectedSchemas([])
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to add field',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      reset()
      setViewMode('selection')
      setSelectedFormElement(null)
      onOpenChange(false)
    }
  }

  // Custom submit handler for dynamic zone at step 2
  // This bypasses React Hook Form validation since the field input is not visible at step 2
  const handleDynamicZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedFormElement || selectedFormElement.key !== 'dynamic_zone' || dynamicZoneStep !== 2) {
      // Fallback to normal submit
      handleSubmit(onSubmit)(e)
      return
    }

    // Get field value from watch
    const fieldValue = watch('field')
    if (!fieldValue || fieldValue.trim() === '') {
      setError('field', {
        type: 'manual',
        message: 'Field name is required',
      })
      setDynamicZoneStep(1)
      setSettingsTab('BASIC')
      return
    }

    // Validate schema selection
    if (selectedSchemas.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one component',
        variant: 'destructive',
      })
      return
    }

    // Get all form values from watch
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
      // Schema-specific fields (not used for dynamic zone but required by type)
      schemaDisplayName: watch('schemaDisplayName'),
      schemaIcon: watch('schemaIcon'),
      schemaId: watch('schemaId'),
      schemaRepeatable: watch('schemaRepeatable') || false,
      // Relation-specific fields (not used for dynamic zone but required by type)
      relationType: watch('relationType'),
      targetCollection: watch('targetCollection'),
      targetFieldName: watch('targetFieldName'),
    }
    
    // Call onSubmit with the form data
    await onSubmit(formData)
  }

  const handleAddAnother = () => {
    handleBackToSelection()
  }

  // Filter form elements by tab
  const defaultElements = formElements.filter((fe) => fe.is_system).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const customElements = formElements.filter((fe) => !fe.is_system).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  const displayElements = activeTab === 'DEFAULT' ? defaultElements : customElements

  // Separate into two sections:
  // Section 1: Regular fields (text, rich text blocks, number, date, media, relation, rich text markdown, boolean, json, email, password, enumeration, UID)
  // Section 2: Schema and Dynamic Zone
  const section1Fields = ['text', 'rich_text_blocks', 'number', 'date', 'media', 'relation', 'markdown', 'boolean', 'json', 'email', 'password', 'enumeration', 'uid']
  const section2Fields = ['schema', 'dynamic_zone']

  const section1Elements = displayElements.filter((fe) => section1Fields.includes(fe.key)).sort((a, b) => {
    const aIndex = section1Fields.indexOf(a.key)
    const bIndex = section1Fields.indexOf(b.key)
    return aIndex - bIndex
  })

  const section2Elements = displayElements.filter((fe) => section2Fields.includes(fe.key)).sort((a, b) => {
    const aIndex = section2Fields.indexOf(a.key)
    const bIndex = section2Fields.indexOf(b.key)
    return aIndex - bIndex
  })


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        {viewMode === 'selection' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {contentTypeName && (
                  <>
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {contentTypeName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-muted-foreground">{contentTypeName}</span>
                  </>
                )}
              </div>
              <DialogTitle className="mt-4">Select a field for your collection type</DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b mb-4">
              <button
                onClick={() => setActiveTab('DEFAULT')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'DEFAULT'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                DEFAULT
              </button>
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'CUSTOM'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                CUSTOM
              </button>
            </div>

            {/* Form Elements Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading form elements...</span>
              </div>
            ) : displayElements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">
                  No {activeTab === 'DEFAULT' ? 'default' : 'custom'} form elements available
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section 1: Regular Fields */}
                {section1Elements.length > 0 && (
                  <div>
                    <div className="grid grid-cols-2 gap-3">
                      {section1Elements.map((element) => {
                        // Get icon color or use default based on category
                        const getIconColor = () => {
                          if (element.icon_color) return element.icon_color
                          // Default colors based on category
                          const colorMap: Record<string, string> = {
                            basic: '#4CAF50', // Green
                            advanced: '#2196F3', // Blue
                            media: '#9C27B0', // Purple
                            relation: '#2196F3', // Blue
                          }
                          return colorMap[element.category || ''] || '#9333EA'
                        }

                        const iconColor = getIconColor()
                        const IconComponent = getIconComponent(element.icon)

                        return (
                          <button
                            key={element.id}
                            onClick={() => handleSelectField(element)}
                            className="border rounded-lg p-2 text-left hover:border-primary hover:shadow-sm transition-all cursor-pointer group bg-background"
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${iconColor}20`,
                                }}
                              >
                                {IconComponent ? (
                                  <div style={{ color: iconColor }}>
                                    <IconComponent className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <span className="text-sm">📝</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                    {element.name}
                                  </h3>
                                  {element.is_system && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-muted text-muted-foreground">
                                      System
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {element.description || 'No description available'}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Schema and Dynamic Zone */}
                {section2Elements.length > 0 && (
                  <div>
                    <div className="mb-3">
                      <div className="h-px bg-border"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {section2Elements.map((element) => {
                        // Get icon color or use default based on category
                        const getIconColor = () => {
                          if (element.icon_color) return element.icon_color
                          // Default colors based on category
                          const colorMap: Record<string, string> = {
                            basic: '#4CAF50', // Green
                            advanced: '#2196F3', // Blue
                            media: '#9C27B0', // Purple
                            relation: '#2196F3', // Blue
                          }
                          return colorMap[element.category || ''] || '#9333EA'
                        }

                        const iconColor = getIconColor()
                        const IconComponent = getIconComponent(element.icon)

                        return (
                          <button
                            key={element.id}
                            onClick={() => handleSelectField(element)}
                            className="border rounded-lg p-2 text-left hover:border-primary hover:shadow-sm transition-all cursor-pointer group bg-background"
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: `${iconColor}20`,
                                }}
                              >
                                {IconComponent ? (
                                  <div style={{ color: iconColor }}>
                                    <IconComponent className="h-3.5 w-3.5" />
                                  </div>
                                ) : (
                                  <span className="text-sm">📝</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                    {element.name}
                                  </h3>
                                  {element.is_system && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-muted text-muted-foreground">
                                      System
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {element.description || 'No description available'}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelection}
                  className="h-8 w-8 p-0"
                  disabled={saving}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedFormElement && (
                  <>
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${selectedFormElement.icon_color || '#9333EA'}20`,
                      }}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(selectedFormElement.icon)
                        const iconColor = selectedFormElement.icon_color || '#9333EA'
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
                {selectedFormElement?.key === 'schema'
                  ? `Add new schema (${schemaStep}/2)`
                  : `Add new ${selectedFormElement?.name || 'field'} field`
                }
              </DialogTitle>
              <DialogDescription>
                {selectedFormElement?.description || 'Configure the field settings'}
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
                  if (!(selectedFormElement?.key === 'schema' && schemaStep === 1)) {
                    setSettingsTab('ADVANCED')
                  }
                }}
                disabled={selectedFormElement?.key === 'schema' && schemaStep === 1}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${settingsTab === 'ADVANCED'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ADVANCED SETTINGS
              </button>
            </div>

            <form onSubmit={
              selectedFormElement?.key === 'dynamic_zone' && dynamicZoneStep === 2
                ? handleDynamicZoneSubmit
                : handleSubmit(onSubmit)
            }>
              <div className="space-y-4 py-4">
                {selectedFormElement && (
                  <FieldFormRenderer
                    formElement={selectedFormElement}
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
                    // Dynamic Zone props
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
                {selectedFormElement?.key === 'schema' && schemaStep === 1 ? (
                  <Button type="button" onClick={handleSchemaStep1Next} disabled={saving}>
                    Configure the schema
                  </Button>
                ) : selectedFormElement?.key === 'dynamic_zone' && dynamicZoneStep === 1 ? (
                  <Button type="button" onClick={handleDynamicZoneStep1Next} disabled={saving}>
                    <span className="flex items-center">
                      <span className="mr-2">+</span>
                      Add components to the zone
                    </span>
                  </Button>
                ) : (
                  <>
                    {((selectedFormElement?.key === 'schema' && schemaStep === 2) ||
                      (selectedFormElement?.key === 'dynamic_zone' && dynamicZoneStep === 2)) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={selectedFormElement?.key === 'schema' ? handleSchemaStep2Back : handleDynamicZoneStep2Back}
                          disabled={saving}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                      )}
                    {!(selectedFormElement?.key === 'schema' && schemaStep === 2) &&
                      !(selectedFormElement?.key === 'dynamic_zone' && dynamicZoneStep === 2) && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddAnother}
                          disabled={saving}
                        >
                          + Add another field
                        </Button>
                      )}
                    <Button 
                      type="submit" 
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {selectedFormElement?.key === 'dynamic_zone' ? 'Creating...' : 'Adding...'}
                        </>
                      ) : (
                        'Finish'
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
