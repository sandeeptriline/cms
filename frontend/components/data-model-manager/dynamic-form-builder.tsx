'use client'

import { useForm } from 'react-hook-form'
import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { ContentTypeField } from '@/lib/api/content-types'
import { BooleanField } from '@/components/data-model-manager/fields/boolean-field'
import { DynamicZoneField } from '@/components/data-model-manager/fields/dynamic-zone-field'
import { SchemaField } from '@/components/data-model-manager/fields/schema-field'
import { TextareaField } from '@/components/data-model-manager/fields/textarea-field'
import { TextField } from '@/components/data-model-manager/fields/text-field'
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface DynamicFormBuilderProps {
  fields: ContentTypeField[]
  defaultValues?: Record<string, any>
  submitLabel?: string
  disabled?: boolean
  columns?: number
  onSubmit: (values: Record<string, any>) => Promise<void> | void
}

type EntryValues = Record<string, any>

interface FieldRendererProps {
  field: ContentTypeField
  register: UseFormRegister<EntryValues>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
  registerOptions?: RegisterOptions
  inputType?: string
}

type FieldRenderer = (props: FieldRendererProps) => ReactElement

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const buildValidationRules = (field: ContentTypeField): RegisterOptions => {
  const rules: RegisterOptions = {}
  const validation = field.validation || {}

  if (field.required) {
    rules.required = `${formatLabel(field.field)} is required`
  }

  if (validation.minLength !== undefined && validation.minLength !== null) {
    rules.minLength = {
      value: validation.minLength,
      message: `Minimum ${validation.minLength} characters`,
    }
  }

  if (validation.maxLength !== undefined && validation.maxLength !== null) {
    rules.maxLength = {
      value: validation.maxLength,
      message: `Maximum ${validation.maxLength} characters`,
    }
  }

  if (validation.min !== undefined && validation.min !== null) {
    rules.min = {
      value: validation.min,
      message: `Minimum value ${validation.min}`,
    }
  }

  if (validation.max !== undefined && validation.max !== null) {
    rules.max = {
      value: validation.max,
      message: `Maximum value ${validation.max}`,
    }
  }

  if (validation.pattern) {
    rules.pattern = {
      value: new RegExp(validation.pattern),
      message: validation.message || `Must match pattern`,
    }
  }

  return rules
}

export function DynamicFormBuilder({
  fields,
  defaultValues = {},
  submitLabel = 'Save entry',
  disabled = false,
  columns = 1,
  onSubmit,
}: DynamicFormBuilderProps) {
  const form = useForm<EntryValues>({
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const renderers: Record<string, FieldRenderer> = {
    text: TextField,
    input: TextField,
    textarea: TextareaField,
    boolean: BooleanField,
    schema: SchemaField,
    'single-schema': SchemaField,
    'repeatable-schema': SchemaField,
    'dynamic-zone': DynamicZoneField,
  }

  const getInputType = (field: ContentTypeField): string => {
    switch (field.type) {
      case 'email':
        return 'email'
      case 'password':
        return 'password'
      case 'number':
      case 'integer':
      case 'float':
      case 'decimal':
        return 'number'
      case 'date':
        return 'date'
      case 'datetime':
        return 'datetime-local'
      case 'time':
        return 'time'
      default:
        return 'text'
    }
  }

  const renderField = (field: ContentTypeField) => {
    const typeKey = (field.interface || field.type || 'text').toLowerCase()
    const Renderer = renderers[typeKey] || TextField
    const placeholder =
      field.validation?.placeholder || field.note || field.options?.placeholder || ''
    const rules = buildValidationRules(field)
    const fieldError = errors[field.field] as FieldError | undefined

    const htmlType = getInputType(field)

    return (
      <div key={field.id}>
        <Renderer
          field={field}
          register={register}
          disabled={disabled || isSubmitting}
          error={fieldError}
          placeholder={placeholder}
          registerOptions={rules}
          inputType={htmlType}
        />
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(values))}
      className="space-y-6"
    >
      <div
        className="grid gap-4"
        style={
          columns > 1
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {fields.map((field) => renderField(field))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
