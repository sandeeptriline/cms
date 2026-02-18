'use client'

import { useEffect, useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import { ContentEntry, contentEntriesApi } from '@/lib/api/content-entries'
import { ContentTypeField } from '@/lib/api/content-types'
import { FieldError, UseFormRegister } from 'react-hook-form'
import { useProject } from '@/contexts/project-context'

interface RelationFieldProps {
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

const getRelationTypeFromField = (field: ContentTypeField) => {
  const options = field.options || {}
  return options.relationType || options.relation_type || 'oneWay'
}

const isManyRelation = (relationType: string) => /many/i.test(relationType)

type LabelableEntry = ContentEntry & { data?: Record<string, any> }

const isPrimitiveValue = (value: unknown): value is string | number | boolean =>
  ['string', 'number', 'boolean'].includes(typeof value)

const findPrimitiveValue = (value: unknown): string | undefined => {
  if (isPrimitiveValue(value)) {
    const str = String(value)
    return str.trim() === '' ? undefined : str
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const primitive = findPrimitiveValue(item)
      if (primitive) {
        return primitive
      }
    }
  }

  if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value as Record<string, any>)) {
      const primitive = findPrimitiveValue(nestedValue)
      if (primitive) {
        return primitive
      }
    }
  }

  return undefined
}

const getTargetFieldValue = (entry: LabelableEntry, field: ContentTypeField) => {
  const targetFieldName =
    field.options?.targetFieldName ||
    field.options?.target_field_name ||
    field.options?.displayField ||
    field.options?.display_field_name

  if (targetFieldName && entry.data) {
    const exactValue = entry.data[targetFieldName]
    const normalizedKey = Object.keys(entry.data).find(
      (key) => key.toLowerCase() === targetFieldName.toLowerCase()
    )
    const value = normalizedKey ? entry.data[normalizedKey] : exactValue
    const primitive = findPrimitiveValue(value)
    if (primitive) {
      return primitive
    }
  }

  return undefined
}

const buildEntryLabel = (entry: LabelableEntry, field: ContentTypeField): string => {
  const valueFromField = getTargetFieldValue(entry, field)
  if (valueFromField) {
    return valueFromField
  }

  const fallbackCandidates = [
    entry.title,
    entry.slug,
    entry.data,
  ]

  for (const candidate of fallbackCandidates) {
    const primitive = findPrimitiveValue(candidate)
    if (primitive) {
      return primitive
    }
  }

  return entry.id
}

export function RelationField({
  field,
  register,
  disabled,
  error,
  placeholder,
}: RelationFieldProps) {
  const { currentProject } = useProject()
  const projectId = currentProject?.id
  const relationType = useMemo(() => getRelationTypeFromField(field), [field])
  const isMultiple = isManyRelation(relationType)
  const targetCollectionId =
    field.options?.targetCollection ||
    field.options?.target_collection ||
    field.options?.targetContentTypeId

  const [entries, setEntries] = useState<ContentEntry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || !targetCollectionId) {
      setEntries([])
      return
    }

    let isMounted = true
    setLoadingEntries(true)
    setFetchError(null)

    contentEntriesApi
      .getAll(projectId, targetCollectionId, { limit: 50 })
      .then((response) => {
        if (!isMounted) return
        setEntries(response.data)
      })
      .catch((err: unknown) => {
        if (!isMounted) return
        const e = err as { message?: string }
        setFetchError(e.message || 'Failed to load related entries')
      })
      .finally(() => {
        if (!isMounted) return
        setLoadingEntries(false)
      })

    return () => {
      isMounted = false
    }
  }, [projectId, targetCollectionId])

  const label = formatLabel(field.field)
  const description =
    field.note ||
    field.validation?.description ||
    (targetCollectionId
      ? `Select up to ${isMultiple ? 'multiple' : 'one'} related entry from the linked collection`
      : 'Specify a target collection in the schema configuration')

  const renderOptions = () => {
    if (!targetCollectionId) {
      return (
        <option value="" disabled>
          No target collection configured
        </option>
      )
    }

    if (loadingEntries) {
      return (
        <option value="" disabled>
          Loading entries…
        </option>
      )
    }

    if (fetchError) {
      return (
        <option value="" disabled>
          {fetchError}
        </option>
      )
    }

    if (entries.length === 0) {
      return (
        <option value="" disabled>
          No entries available
        </option>
      )
    }

    return entries.map((entry) => (
      <option key={entry.id} value={entry.id}>
        {buildEntryLabel(entry, field)}
      </option>
    ))
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={field.field} className="text-sm font-medium text-foreground">
        {label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <select
        id={field.field}
        {...register(field.field)}
        disabled={disabled || !targetCollectionId || loadingEntries}
        multiple={isMultiple}
        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {!isMultiple && (
          <option value="">
            {placeholder || (targetCollectionId ? 'Select related entry' : 'Select target collection')}
          </option>
        )}
        {renderOptions()}
      </select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  )
}
