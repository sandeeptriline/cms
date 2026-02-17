'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface FieldComponentProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  registerOptions?: RegisterOptions
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function BooleanField({
  field,
  register,
  disabled,
  error,
  registerOptions,
}: FieldComponentProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Checkbox
          id={field.field}
          {...register(field.field, registerOptions)}
          disabled={disabled}
          className="scale-90"
        />
        <span>
          {formatLabel(field.field)}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </span>
      </label>
      <p className="text-xs text-muted-foreground">{field.note}</p>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
