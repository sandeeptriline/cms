'use client'

import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface FieldComponentProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
  registerOptions?: RegisterOptions
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function TextareaField({
  field,
  register,
  disabled,
  error,
  placeholder,
  registerOptions,
}: FieldComponentProps) {
  const label = formatLabel(field.field)
  const description = field.note || field.validation?.description

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-foreground flex items-center gap-1">
        {label}
        {field.required && <span className="text-destructive">*</span>}
      </p>
      <textarea
        id={field.field}
        {...register(field.field, registerOptions)}
        disabled={disabled}
        className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none min-h-[120px] focus:border-primary focus:outline-none"
        placeholder={placeholder || description}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
