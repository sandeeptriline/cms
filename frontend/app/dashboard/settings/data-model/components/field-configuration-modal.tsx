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
import { Loader2, ArrowLeft } from 'lucide-react'
import { contentTypesApi, CreateFieldDto } from '@/lib/api/content-types'
import { FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const fieldConfigurationSchema = z.object({
  field: z.string().min(1, 'Field name is required').max(64, 'Field name must be less than 64 characters'),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  readonly: z.boolean().default(false),
  note: z.string().optional(),
  // Variant selection (for fields that support variants)
  variant: z.string().optional(),
  // Advanced settings (will be expanded based on form element)
  minLength: z.number().optional().nullable(),
  maxLength: z.number().optional().nullable(),
  defaultValue: z.string().optional(),
})

type FieldConfigurationFormData = z.infer<typeof fieldConfigurationSchema>

interface FieldConfigurationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formElement: FormElement | null
  contentTypeId: string
  contentTypeName?: string
  onSuccess: () => void
  onBack: () => void
}

export function FieldConfigurationModal({
  open,
  onOpenChange,
  formElement,
  contentTypeId,
  contentTypeName,
  onSuccess,
  onBack,
}: FieldConfigurationModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'BASIC' | 'ADVANCED'>('BASIC')

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
      variant: formElement?.default_variant || undefined,
    },
  })

  useEffect(() => {
    if (open && formElement) {
      reset({
        field: '',
        required: false,
        hidden: false,
        readonly: false,
        note: '',
        variant: formElement.default_variant || undefined,
        minLength: formElement.validation_rules?.minLength || undefined,
        maxLength: formElement.validation_rules?.maxLength || undefined,
        defaultValue: formElement.interface?.defaultValue || undefined,
      })
    }
  }, [open, formElement, reset])

  const required = watch('required')
  const hidden = watch('hidden')
  const readonly = watch('readonly')
  const selectedVariant = watch('variant')

  const onSubmit = async (data: FieldConfigurationFormData) => {
    if (!formElement) return

    try {
      setSaving(true)

      // Get selected variant if applicable
      const variant = formElement.variants?.find((v: any) => v.key === data.variant)
      const interfaceConfig = variant?.component 
        ? { ...formElement.interface, component: variant.component }
        : formElement.interface

      const fieldDto: CreateFieldDto = {
        field: data.field,
        type: formElement.type,
        interface: interfaceConfig?.component || formElement.key,
        options: {
          ...interfaceConfig,
          ...formElement.default_settings,
          variant: data.variant || formElement.default_variant,
        },
        validation: {
          ...formElement.validation_rules,
          required: data.required,
          minLength: data.minLength,
          maxLength: data.maxLength,
        },
        required: data.required,
        hidden: data.hidden,
        readonly: data.readonly,
        note: data.note || formElement.description || undefined,
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
      onOpenChange(false)
    }
  }

  if (!formElement) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="text-xl"
              style={{ color: formElement.icon_color || '#9333EA' }}
            >
              {formElement.icon || '📝'}
            </div>
            {contentTypeName && (
              <span className="text-sm text-muted-foreground">{contentTypeName}</span>
            )}
          </div>
          <DialogTitle>Add new {formElement.name} field</DialogTitle>
          <DialogDescription>
            {formElement.description || 'Configure the field settings'}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b mb-4">
          <button
            onClick={() => setActiveTab('BASIC')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'BASIC'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            BASIC SETTINGS
          </button>
          <button
            onClick={() => setActiveTab('ADVANCED')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'ADVANCED'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            ADVANCED SETTINGS
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {activeTab === 'BASIC' && (
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

                {/* Variant Selection (if available) */}
                {formElement.variants && formElement.variants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="space-y-2">
                      {formElement.variants.map((variant: any) => (
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

            {activeTab === 'ADVANCED' && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Advanced settings for {formElement.name} field
                </div>
                
                {/* Show available settings from form element */}
                {formElement.available_settings && formElement.available_settings.length > 0 && (
                  <div className="space-y-3">
                    {formElement.available_settings.includes('minLength') && (
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
                    {formElement.available_settings.includes('maxLength') && (
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
                    {formElement.available_settings.includes('defaultValue') && (
                      <div className="space-y-2">
                        <Label htmlFor="defaultValue">Default Value</Label>
                        <Input
                          id="defaultValue"
                          {...register('defaultValue')}
                          disabled={saving}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
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
              onClick={() => {
                // Add another field - go back to selection
                onBack()
              }}
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
      </DialogContent>
    </Dialog>
  )
}
