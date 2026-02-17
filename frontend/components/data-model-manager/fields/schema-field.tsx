'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, UseFormRegister } from 'react-hook-form'

interface SchemaFieldProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export function SchemaField({ field, register, disabled, error, placeholder }: SchemaFieldProps) {
  const label = formatLabel(field.field)
  const description = field.note || 'Select the related schema for this field'

  return (
    <div className="space-y-1">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={field.field}
        {...register(field.field)}
        disabled
        placeholder={placeholder || description}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
