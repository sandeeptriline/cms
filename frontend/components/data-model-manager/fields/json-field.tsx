'use client'

import { useCallback, useEffect, useState, type ChangeEvent, type FocusEvent } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { Label } from '@/components/ui/label'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface JsonFieldProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  placeholder?: string
  registerOptions?: RegisterOptions
  defaultValue?: unknown
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const normalizeDefaultValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function JsonField({
  field,
  register,
  disabled,
  error,
  placeholder,
  registerOptions,
  defaultValue,
}: JsonFieldProps) {
  const { onChange, onBlur } = register(field.field, registerOptions)
  const [content, setContent] = useState(() =>
    normalizeDefaultValue(defaultValue)
  )

  useEffect(() => {
    setContent(normalizeDefaultValue(defaultValue))
  }, [defaultValue])

  const handleChange = useCallback(
    (value: string) => {
      setContent(value)
      onChange({ target: { value } } as ChangeEvent<HTMLInputElement>)
    },
    [onChange],
  )

  const handleBlur = useCallback(
    (event?: FocusEvent<HTMLElement>) => {
      onBlur(event as FocusEvent<HTMLInputElement>)
    },
    [onBlur],
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {formatLabel(field.field)}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="rounded-2xl border border-input/70 bg-slate-900">
        <CodeMirror
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          extensions={[json()]}
          readOnly={disabled}
          theme="dark"
          height="260px"
          className="rounded-2xl"
        />
      </div>
      {(placeholder || field.note) && (
        <p className="text-xs text-muted-foreground">
          {placeholder || field.note}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
