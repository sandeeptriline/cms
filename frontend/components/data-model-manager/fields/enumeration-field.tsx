'use client'

import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'
import { Label } from '@/components/ui/label'

interface EnumerationFieldProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
  registerOptions?: RegisterOptions
}

interface Option {
  label: string
  value: string
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const collectOptions = (field: ContentTypeField): Option[] => {
  const optionsFromList = field.options?.options
  if (Array.isArray(optionsFromList) && optionsFromList.length > 0) {
    return optionsFromList
      .map((option) => {
        if (!option) {
          return undefined
        }
        if (typeof option === 'object') {
          return {
            label: option.label || option.value || String(option),
            value: option.value || option.label || String(option),
          }
        }
        const text = String(option).trim()
        return { label: text, value: text }
      })
      .filter(Boolean) as Option[]
  }

  const rawValues = field.options?.values
  if (typeof rawValues === 'string' && rawValues.trim()) {
    return rawValues
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter((value) => value !== '')
      .map((value) => ({
        label: value,
        value,
      }))
  }

  return []
}

export function EnumerationField({
  field,
  register,
  disabled,
  placeholder,
  error,
  registerOptions,
}: EnumerationFieldProps) {
  const options = collectOptions(field)
  const labelText = formatLabel(field.field)
  const helperText = placeholder || field.note || `Select a value for ${labelText}`

  return (
    <div className="space-y-1">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {labelText}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <select
        id={field.field}
        {...register(field.field, registerOptions)}
        disabled={disabled}
        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        <option value="">
          {helperText}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
