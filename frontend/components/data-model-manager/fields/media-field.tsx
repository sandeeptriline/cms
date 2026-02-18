'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface MediaFieldProps {
  field: ContentTypeField
  register: UseFormRegister<Record<string, any>>
  disabled?: boolean
  error?: FieldError
  registerOptions?: RegisterOptions
  placeholder?: string
}

const formatLabel = (fieldName: string) =>
  fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const isMultiple = (field: ContentTypeField) => {
  const options = field.options || {}
  return Boolean(options.multiple || options.multiple_files)
}

const buildHelperText = (field: ContentTypeField, placeholder?: string) => {
  if (field.note) return field.note
  if (placeholder) return placeholder
  if (field.options?.allowedTypes) {
    return `Accepted types: ${field.options.allowedTypes.join(', ')}`
  }
  return 'Upload or drag & drop files'
}

export function MediaField({
  field,
  register,
  disabled,
  error,
  registerOptions,
  placeholder,
}: MediaFieldProps) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const multiple = isMultiple(field)
  const allowedTypes =
    field.options?.allowedTypes ||
    field.options?.allowed_types ||
    field.options?.mimeTypes ||
    []
  const acceptAttr = Array.isArray(allowedTypes) ? allowedTypes.join(',') : undefined
  const labelText = formatLabel(field.field)

  const registerProps = register(field.field, registerOptions)
  const { ref, onChange, name, onBlur } = registerProps

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    const names = files ? Array.from(files).map((file) => file.name) : []
    setSelectedFiles(names)
    onChange?.(event)
  }

  const baseHelperText = buildHelperText(field, placeholder)

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const files = event.dataTransfer?.files
    if (!files || files.length === 0) {
      return
    }

    const names = Array.from(files).map((file) => file.name)
    setSelectedFiles(names)

    if (inputRef.current) {
      const dataTransfer = new DataTransfer()
      Array.from(files).forEach((file) => dataTransfer.items.add(file))
      inputRef.current.files = dataTransfer.files
      onChange?.({
        target: inputRef.current,
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    }
  }

  return (
    <div className="space-y-2">
      <Label
        htmlFor={field.field}
        className="text-sm font-medium text-foreground"
      >
        {labelText}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div
        className={`flex flex-col gap-3 rounded-2xl border border-dashed px-4 py-6 text-sm transition-colors cursor-pointer ${
          isDragging
            ? 'border-primary/80 bg-primary/10 text-foreground'
            : 'border-input bg-muted/20 text-muted-foreground hover:border-primary'
        }`}
        onClick={() => {
          if (disabled) return
          inputRef.current?.click()
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
              : 'Click to upload files'}
          </p>
          <Button size="sm" variant="outline" disabled={disabled}>
            Browse
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {baseHelperText}
        </p>
        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {selectedFiles.map((name) => (
              <span
                key={name}
                className="rounded-full border border-input px-3 py-1 bg-background text-foreground"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
      <input
        id={field.field}
        name={name}
        type="file"
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        ref={(el) => {
          ref(el)
          inputRef.current = el
        }}
        onChange={handleInputChange}
        onBlur={onBlur}
        accept={acceptAttr}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
