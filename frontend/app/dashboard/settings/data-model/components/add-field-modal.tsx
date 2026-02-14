'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Loader2, 
  ArrowLeft,
  Type,
  Hash,
  Calendar,
  Image as ImageIcon,
  Link2,
  FileText,
  ToggleLeft,
  Braces,
  Mail,
  Key,
  List,
  KeyRound,
  Blocks,
  Puzzle,
  Infinity,
  Plus,
  ArrowRight,
  ArrowLeftRight,
  ChevronDown,
  GitBranch,
  Network,
  Share2,
} from 'lucide-react'
import { contentTypesApi, CreateFieldDto } from '@/lib/api/content-types'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const fieldConfigurationSchema = z.object({
  field: z.string().min(1, 'Field name is required').max(64, 'Field name must be less than 64 characters'),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  readonly: z.boolean().default(false),
  private: z.boolean().default(false),
  localized: z.boolean().default(false),
  note: z.string().optional(),
  variant: z.string().optional(),
  minLength: z.number().optional().nullable(),
  maxLength: z.number().optional().nullable(),
  defaultValue: z.string().optional(),
  allowedTypes: z.array(z.string()).optional(),
  // Relation-specific fields
  relationType: z.string().optional(),
  targetCollection: z.string().optional(),
  targetFieldName: z.string().optional(),
})

type FieldConfigurationFormData = z.infer<typeof fieldConfigurationSchema>

interface AddFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTypeId: string
  contentTypeName?: string
  onSuccess: () => void
}

type ViewMode = 'selection' | 'configuration'

// Icon mapping: Maps icon name strings to lucide-react icon components
const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  // Text types
  Type,
  Aa: Type, // Alias for Type icon
  
  // Number types
  Hash,
  '123': Hash, // Alias for Hash icon
  
  // Date types
  Calendar,
  
  // Media types
  Image: ImageIcon,
  ImageIcon,
  
  // Relation types
  Link: Link2,
  Link2,
  
  // Rich text types
  FileText,
  Blocks,
  
  // Component
  Puzzle,
  
  // Boolean
  ToggleLeft,
  ToggleRight: ToggleLeft,
  
  // JSON
  Braces,
  '{}': Braces, // Alias for Braces icon
  
  // Email
  Mail,
  '@': Mail, // Alias for Mail icon
  
  // Password
  Key,
  Lock: Key,
  
  // Enumeration
  List,
  
  // UID
  KeyRound,
  
  // Dynamic zone
  Infinity,
}

/**
 * Get icon component from icon name string
 */
function getIconComponent(iconName: string | null | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
  if (!iconName) return null
  
  // Try exact match first
  if (iconMap[iconName]) {
    return iconMap[iconName]
  }
  
  // Try case-insensitive match
  const lowerIconName = iconName.toLowerCase()
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (key.toLowerCase() === lowerIconName) {
      return Icon
    }
  }
  
  return null
}

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
      allowedTypes: [],
    },
  })

  useEffect(() => {
    if (open) {
      loadFormElements()
      loadContentTypes()
      setViewMode('selection')
      setSelectedFormElement(null)
      reset()
    }
  }, [open, reset])

  const loadContentTypes = async () => {
    try {
      setLoadingContentTypes(true)
      const data = await contentTypesApi.getAll()
      setContentTypes(data || [])
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
    reset({
      field: '',
      required: false,
      hidden: false,
      readonly: false,
      private: formElement.default_settings?.private || false,
      localized: false,
      note: '',
      variant: formElement.default_variant || undefined,
      minLength: formElement.validation_rules?.minLength || undefined,
      maxLength: formElement.validation_rules?.maxLength || undefined,
      defaultValue: formElement.interface?.defaultValue || undefined,
      allowedTypes: formElement.default_settings?.allowedTypes || formElement.interface?.settings?.allowedTypes || [],
    })
  }

  const handleBackToSelection = () => {
    setViewMode('selection')
    setSelectedFormElement(null)
    reset()
  }

  const required = watch('required')
  const hidden = watch('hidden')
  const readonly = watch('readonly')
  const privateField = watch('private')
  const localized = watch('localized')
  const selectedVariant = watch('variant')
  const allowedTypes = watch('allowedTypes') || []
  const relationType = watch('relationType') || 'oneWay'
  const targetCollection = watch('targetCollection')
  const targetFieldName = watch('targetFieldName')
  
  // Get relation type configuration
  const relationTypeConfig = selectedFormElement?.interface?.relationTypes?.find(
    (rt: any) => rt.key === relationType
  )
  
  // Get relation description
  const getRelationDescription = () => {
    if (!contentTypeName || !targetCollection) return ''
    const targetType = contentTypes.find(ct => ct.id === targetCollection || ct.collection === targetCollection)
    const targetName = targetType?.name || targetCollection
    const relationLabel = relationTypeConfig?.label || 'has one'
    return `${contentTypeName} ${relationLabel} ${targetName}`
  }

  const onSubmit = async (data: FieldConfigurationFormData) => {
    if (!selectedFormElement) return

    try {
      setSaving(true)

      const variant = selectedFormElement.variants?.find((v: any) => v.key === data.variant)
      const interfaceConfig = variant?.component 
        ? { ...selectedFormElement.interface, component: variant.component }
        : selectedFormElement.interface

      const fieldDto: CreateFieldDto = {
        field: data.field,
        type: selectedFormElement.type,
        interface: interfaceConfig?.component || selectedFormElement.key,
        options: {
          ...interfaceConfig,
          ...selectedFormElement.default_settings,
          variant: data.variant || selectedFormElement.default_variant,
          allowedTypes: data.allowedTypes && data.allowedTypes.length > 0 ? data.allowedTypes : (selectedFormElement.default_settings?.allowedTypes || selectedFormElement.interface?.settings?.allowedTypes),
          private: data.private,
          localized: data.localized,
          // Relation-specific options
          ...(selectedFormElement.key === 'relation' && {
            relationType: data.relationType || 'oneWay',
            targetCollection: data.targetCollection,
            targetFieldName: data.targetFieldName,
            sourceCollection: contentTypeId,
          }),
        },
        validation: {
          ...selectedFormElement.validation_rules,
          required: data.required,
          minLength: data.minLength,
          maxLength: data.maxLength,
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

  const handleAddAnother = () => {
    handleBackToSelection()
  }

  // Filter form elements by tab
  const defaultElements = formElements.filter((fe) => fe.is_system)
  const customElements = formElements.filter((fe) => !fe.is_system)
  const displayElements = activeTab === 'DEFAULT' ? defaultElements : customElements

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
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'DEFAULT'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                DEFAULT
              </button>
              <button
                onClick={() => setActiveTab('CUSTOM')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'CUSTOM'
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
              <div className="grid grid-cols-2 gap-3">
                {displayElements.map((element) => {
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
                Add new {selectedFormElement?.name || 'field'} field
              </DialogTitle>
              <DialogDescription>
                {selectedFormElement?.description || 'Configure the field settings'}
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
                onClick={() => setSettingsTab('ADVANCED')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  settingsTab === 'ADVANCED'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                ADVANCED SETTINGS
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4 py-4">
                {settingsTab === 'BASIC' && selectedFormElement && (
                  <>
                    {/* Field Name */}
                    <div className="space-y-2">
                      <Label htmlFor="field">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="field"
                        placeholder="title"
                        {...register('field')}
                        disabled={saving}
                      />
                      {errors.field && (
                        <p className="text-sm text-destructive">{errors.field.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        No space is allowed for the name of the attribute
                      </p>
                    </div>

                    {/* Variant Selection */}
                    {selectedFormElement.variants && selectedFormElement.variants.length > 0 && (
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <div className="space-y-2">
                          {selectedFormElement.variants.map((variant: any) => (
                            <div key={variant.key} className="flex items-start space-x-2">
                              <input
                                type="radio"
                                id={`variant-${variant.key}`}
                                value={variant.key}
                                checked={selectedVariant === variant.key}
                                onChange={(e) => setValue('variant', e.target.value)}
                                disabled={saving}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={`variant-${variant.key}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {variant.name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {variant.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Relation Field Configuration */}
                    {selectedFormElement.key === 'relation' && (
                      <div className="space-y-4">
                        {/* Two Entity Cards with Relation Type Selector */}
                        <div className="flex items-center gap-4">
                          {/* Source Entity Card */}
                          <div className="flex-1 border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                                <Link2 className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium">{contentTypeName}</span>
                            </div>
                            <div className="border-t pt-3">
                              <Label htmlFor="sourceFieldName" className="text-sm">
                                Field name
                              </Label>
                              <Input
                                id="sourceFieldName"
                                {...register('field')}
                                placeholder="article"
                                disabled={saving}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          {/* Relation Type Icons Row - Vertically Centered */}
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="flex items-center gap-1">
                              {selectedFormElement.interface?.relationTypes?.map((rt: any) => {
                                const isSelected = relationType === rt.key
                                const getRelationIcon = () => {
                                  switch(rt.key) {
                                    case 'oneWay':
                                      return <ArrowRight className="h-4 w-4" />
                                    case 'oneToOne':
                                      return <ArrowLeftRight className="h-4 w-4" />
                                    case 'oneToMany':
                                      return <GitBranch className="h-4 w-4" />
                                    case 'manyToOne':
                                      return <GitBranch className="h-4 w-4 rotate-180" />
                                    case 'manyToMany':
                                      return <Network className="h-4 w-4" />
                                    case 'manyWay':
                                      return <Share2 className="h-4 w-4" />
                                    default:
                                      return <ArrowRight className="h-4 w-4" />
                                  }
                                }
                                return (
                                  <button
                                    key={rt.key}
                                    type="button"
                                    onClick={() => setValue('relationType', rt.key)}
                                    disabled={saving}
                                    className={`
                                      p-1.5 border rounded transition-colors
                                      ${isSelected 
                                        ? 'border-primary bg-primary text-white' 
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                      }
                                      disabled:opacity-50 disabled:cursor-not-allowed
                                    `}
                                    title={rt.label}
                                    aria-label={rt.label}
                                  >
                                    {getRelationIcon()}
                                  </button>
                                )
                              })}
                            </div>
                            {/* Relation Description Text */}
                            {relationTypeConfig && (
                              <p className="text-xs text-muted-foreground text-center whitespace-nowrap">
                                {relationTypeConfig.label}
                              </p>
                            )}
                          </div>

                          {/* Target Entity Card */}
                          <div className="flex-1 border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <select
                                  {...register('targetCollection')}
                                  disabled={saving || loadingContentTypes}
                                  className="w-full px-3 py-2 border rounded-md bg-white text-sm appearance-none pr-8"
                                >
                                  <option value="">Select collection...</option>
                                  {contentTypes
                                    .filter(ct => ct.id !== contentTypeId)
                                    .map((ct) => (
                                      <option key={ct.id} value={ct.id}>
                                        {ct.name}
                                      </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              </div>
                            </div>
                            <div className="border-t pt-3">
                              <Label htmlFor="targetFieldName" className="text-sm">
                                Field name
                              </Label>
                              <Input
                                id="targetFieldName"
                                {...register('targetFieldName')}
                                placeholder=""
                                disabled={saving || !targetCollection}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Relation Description */}
                        {relationTypeConfig && targetCollection && (
                          <div className="text-center py-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{contentTypeName}</span>
                              {' '}
                              <span>{relationTypeConfig.label}</span>
                              {' '}
                              <span className="font-medium">
                                {contentTypes.find(ct => ct.id === targetCollection || ct.collection === targetCollection)?.name || targetCollection}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Field Options */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required"
                          checked={required}
                          onCheckedChange={(checked) => setValue('required', checked === true)}
                          disabled={saving}
                        />
                        <Label htmlFor="required" className="font-normal cursor-pointer">
                          Required field
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="hidden"
                          checked={hidden}
                          onCheckedChange={(checked) => setValue('hidden', checked === true)}
                          disabled={saving}
                        />
                        <Label htmlFor="hidden" className="font-normal cursor-pointer">
                          Hidden field
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="readonly"
                          checked={readonly}
                          onCheckedChange={(checked) => setValue('readonly', checked === true)}
                          disabled={saving}
                        />
                        <Label htmlFor="readonly" className="font-normal cursor-pointer">
                          Read-only field
                        </Label>
                      </div>
                    </div>
                  </>
                )}

                {settingsTab === 'ADVANCED' && selectedFormElement && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Advanced settings for {selectedFormElement.name} field
                    </div>
                    
                    {selectedFormElement.available_settings && selectedFormElement.available_settings.length > 0 && (
                      <div className="space-y-3">
                        {selectedFormElement.available_settings.includes('minLength') && (
                          <div className="space-y-2">
                            <Label htmlFor="minLength">Minimum Length</Label>
                            <Input
                              id="minLength"
                              type="number"
                              {...register('minLength', { valueAsNumber: true })}
                              disabled={saving}
                            />
                          </div>
                        )}
                        {selectedFormElement.available_settings.includes('maxLength') && (
                          <div className="space-y-2">
                            <Label htmlFor="maxLength">Maximum Length</Label>
                            <Input
                              id="maxLength"
                              type="number"
                              {...register('maxLength', { valueAsNumber: true })}
                              disabled={saving}
                            />
                          </div>
                        )}
                        {selectedFormElement.available_settings.includes('defaultValue') && (
                          <div className="space-y-2">
                            <Label htmlFor="defaultValue">Default Value</Label>
                            <Input
                              id="defaultValue"
                              {...register('defaultValue')}
                              disabled={saving}
                            />
                          </div>
                        )}
                        {selectedFormElement.available_settings.includes('allowedTypes') && (
                          <div className="space-y-2">
                            <Label>Select allowed types of media</Label>
                            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                              {selectedFormElement.interface?.allowedTypesOptions?.map((option: any) => (
                                <div key={option.key} className="flex items-start space-x-2">
                                  <Checkbox
                                    id={`allowedType-${option.key}`}
                                    checked={allowedTypes.includes(option.key)}
                                    onCheckedChange={(checked) => {
                                      const currentTypes = allowedTypes || []
                                      if (checked) {
                                        setValue('allowedTypes', [...currentTypes, option.key])
                                      } else {
                                        setValue('allowedTypes', currentTypes.filter((t: string) => t !== option.key))
                                      }
                                    }}
                                    disabled={saving}
                                    className="mt-0.5"
                                  />
                                  <Label
                                    htmlFor={`allowedType-${option.key}`}
                                    className="font-normal cursor-pointer flex-1"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              )) || (
                                <div className="text-sm text-muted-foreground">
                                  No media type options available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Settings Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="text-sm font-medium">Settings</div>
                      <div className="space-y-4">
                        {/* Required Field */}
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="required-advanced"
                              checked={required}
                              onCheckedChange={(checked) => setValue('required', checked === true)}
                              disabled={saving}
                            />
                            <Label htmlFor="required-advanced" className="font-normal cursor-pointer">
                              Required field
                            </Label>
                          </div>
                          <p className="text-xs text-muted-foreground ml-6">
                            You won't be able to create an entry if this field is empty
                          </p>
                        </div>

                        {/* Private Field */}
                        {selectedFormElement.available_settings?.includes('private') && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="private"
                                checked={privateField}
                                onCheckedChange={(checked) => setValue('private', checked === true)}
                                disabled={saving}
                              />
                              <Label htmlFor="private" className="font-normal cursor-pointer">
                                Private field
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              This field will not show up in the API response
                            </p>
                          </div>
                        )}

                        {/* Enable Localization */}
                        {selectedFormElement.supports_translations && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="localized"
                                checked={localized}
                                onCheckedChange={(checked) => setValue('localized', checked === true)}
                                disabled={saving}
                              />
                              <Label htmlFor="localized" className="font-normal cursor-pointer">
                                Enable localization for this field
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">
                              The field can have different values in each language
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Condition Section */}
                    {selectedFormElement.supports_conditions && (
                      <div className="space-y-2 pt-4 border-t">
                        <Label>Condition</Label>
                        <p className="text-xs text-muted-foreground">
                          Toggle field settings depending on the value of another boolean or enumeration field.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement condition modal
                            toast({
                              title: 'Coming soon',
                              description: 'Condition feature will be available soon',
                            })
                          }}
                          disabled={saving}
                          className="w-full justify-start"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Apply condition
                        </Button>
                      </div>
                    )}

                    {/* Note Section */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="note">Note (optional)</Label>
                      <Input
                        id="note"
                        placeholder="Field description"
                        {...register('note')}
                        disabled={saving}
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAnother}
                  disabled={saving}
                >
                  + Add another field
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Finish'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
