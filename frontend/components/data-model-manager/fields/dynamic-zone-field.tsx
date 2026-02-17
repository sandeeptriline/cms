'use client'

import { Label } from '@/components/ui/label'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, UseFormRegister } from 'react-hook-form'

interface DynamicZoneFieldProps {
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

export function DynamicZoneField({
  field,
  register,
  disabled,
  error,
  placeholder,
}: DynamicZoneFieldProps) {
  const label = formatLabel(field.field)
  const description = field.note || 'Dynamic zone entry (components will be supported later)'

  return (
    <div className="space-y-1">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <textarea
        id={field.field}
        {...register(field.field)}
        disabled
        placeholder={placeholder || description}
        className="w-full rounded-md border border-input px-3 py-2 text-sm resize-none min-h-[120px] focus:border-primary focus:outline-none"
      />
      <p className="text-xs text-muted-foreground">{description}</p>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
