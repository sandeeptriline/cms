'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface FieldComponentProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
  registerOptions?: RegisterOptions
  inputType?: string
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function TextField({
  field,
  register,
  disabled,
  error,
  placeholder,
  registerOptions,
  inputType = 'text',
}: FieldComponentProps) {
  const label = formatLabel(field.field)
  const description = field.note || field.validation?.description

  return (
    <div className="space-y-1">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.field}
        type={inputType}
        {...register(field.field, registerOptions)}
        disabled={disabled}
        placeholder={placeholder || description}
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
