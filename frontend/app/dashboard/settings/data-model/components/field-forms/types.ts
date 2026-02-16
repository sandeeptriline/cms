import { UseFormReturn } from 'react-hook-form'
import { FormElement } from '@/lib/api/form-elements'
import { z } from 'zod'

export const fieldConfigurationSchema = z.object({
  field: z.string().min(1, 'Field name is required').max(64, 'Field name must be less than 64 characters'),
  required: z.boolean().default(false),
  hidden: z.boolean().default(false),
  readonly: z.boolean().default(false),
  private: z.boolean().default(false),
  localized: z.boolean().default(false),
  unique: z.boolean().default(false),
  note: z.string().optional(),
  variant: z.string().optional(),
  minLength: z.number().optional().nullable(),
  maxLength: z.number().optional().nullable(),
  minLengthEnabled: z.boolean().default(false),
  maxLengthEnabled: z.boolean().default(false),
  defaultValue: z.string().optional(),
  regexPattern: z.string().optional(),
  allowedTypes: z.array(z.string()).optional(),
  // Relation-specific fields
  relationType: z.string().optional(),
  targetCollection: z.string().optional(),
  targetFieldName: z.string().optional(),
  // Component-specific fields
  componentType: z.enum(['create', 'existing']).optional(),
  componentDisplayName: z.string().optional(),
  componentCategory: z.string().optional(),
  componentIcon: z.string().optional(),
  componentId: z.string().optional(),
  componentRepeatable: z.boolean().default(false),
})

export type FieldConfigurationFormData = z.infer<typeof fieldConfigurationSchema>

export interface BaseFieldFormProps {
  formElement: FormElement
  form: UseFormReturn<FieldConfigurationFormData>
  saving: boolean
  settingsTab: 'BASIC' | 'ADVANCED'
  contentTypeName?: string
  contentTypeId: string
  contentTypes: any[]
  loadingContentTypes: boolean
}
