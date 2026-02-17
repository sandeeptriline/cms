'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, X, ChevronDown } from 'lucide-react'
import { iconLibrary } from '@/lib/utils/icon-library'
import { BaseFieldFormProps } from './types'

interface SchemaFieldFormProps extends BaseFieldFormProps {
  schemaStep: 1 | 2
  onStep1Next: () => void
  onStep2Back: () => void
  schemaIconSearch: string
  onSchemaIconSearchChange: (value: string) => void
  availableDataModels: any[]
  currentDataModelId?: string
}

export function SchemaFieldForm({
  formElement,
  form,
  saving,
  settingsTab,
  schemaStep,
  onStep1Next,
  onStep2Back,
  schemaIconSearch,
  onSchemaIconSearchChange,
  availableDataModels,
  currentDataModelId,
  loadingContentTypes,
}: SchemaFieldFormProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const schemaIcon = watch('schemaIcon')
  const schemaRepeatable = watch('schemaRepeatable')
  const schemaId = watch('schemaId')

  // Step 1/2: Basic Information (Display Name + Icon)
  if (schemaStep === 1) {
    return (
      <>
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="schemaDisplayName">
            Display name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="schemaDisplayName"
            placeholder=""
            {...register('schemaDisplayName', { required: 'Display name is required' })}
            disabled={saving}
          />
          {errors.schemaDisplayName && (
            <p className="text-sm text-destructive">{errors.schemaDisplayName.message}</p>
          )}
        </div>

        {/* Icon Picker */}
        <div className="space-y-2">
          <Label>Icon</Label>
          <div className="space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search icon button"
                value={schemaIconSearch}
                onChange={(e) => onSchemaIconSearchChange(e.target.value)}
                disabled={saving}
                className="pl-9 pr-8"
                autoComplete="off"
              />
              {schemaIconSearch && (
                <button
                  type="button"
                  onClick={() => onSchemaIconSearchChange('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Icon Grid */}
            <div className="border rounded-md p-4 max-h-[150px] overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {iconLibrary
                  .filter((icon) =>
                    icon.name.toLowerCase().includes(schemaIconSearch.toLowerCase())
                  )
                  .map((icon) => {
                    const IconComponent = icon.component
                    const isSelected = schemaIcon?.toLowerCase() === icon.name.toLowerCase()
                    return (
                      <label
                        key={icon.name}
                        className={`
                          relative flex items-center justify-center w-8 h-8 p-0.5 rounded-md border transition-colors cursor-pointer flex-shrink-0
                          ${isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                          }
                        `}
                        title={icon.name}
                      >
                        <input
                          type="radio"
                          name="schemaIcon"
                          value={icon.name}
                          checked={isSelected}
                          onChange={() => setValue('schemaIcon', icon.name)}
                          className="sr-only"
                          disabled={saving}
                        />
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                      </label>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Step 2/2: Configuration (Name + Type + Data Model Select)
  return (
    <>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="field">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="field"
          placeholder=""
          {...register('field')}
          disabled={saving}
          className="border-primary"
        />
        {errors.field && (
          <p className="text-sm text-destructive">{errors.field.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          No space is allowed for the name of the attribute
        </p>
      </div>

      {/* Type Selection - Repeatable vs Single */}
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`
              p-4 border rounded-lg cursor-pointer transition-colors
              ${!schemaRepeatable
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                checked={!schemaRepeatable}
                onChange={() => setValue('schemaRepeatable', false)}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Single schema</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best for grouping fields like full address, main information, etc...
                </p>
              </div>
            </div>
          </label>
          <label
            className={`
              p-4 border rounded-lg cursor-pointer transition-colors
              ${schemaRepeatable
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                checked={schemaRepeatable}
                onChange={() => setValue('schemaRepeatable', true)}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Repeatable schema</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best for multiple instances (array) of ingredients, meta tags, etc..
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Data Model Selection */}
      <div className="space-y-2">
        <Label htmlFor="schemaId">
          Select a data model <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <select
            id="schemaId"
            {...register('schemaId', { required: 'Please select a data model' })}
            disabled={saving || loadingContentTypes}
            className="w-full px-3 py-2 border rounded-md bg-white text-sm appearance-none pr-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Select a data model...</option>
            {loadingContentTypes ? (
              <option value="" disabled>Loading data models...</option>
            ) : availableDataModels && availableDataModels.length > 0 ? (
              availableDataModels
                .filter((dm) => !currentDataModelId || dm.id !== currentDataModelId)
                .map((dm) => (
                  <option key={dm.id} value={dm.id}>
                    {dm.name}
                  </option>
                ))
            ) : (
              <option value="" disabled>No data models available</option>
            )}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {errors.schemaId && (
          <p className="text-sm text-destructive">{errors.schemaId.message}</p>
        )}
        {loadingContentTypes && (
          <p className="text-xs text-muted-foreground">Loading data models...</p>
        )}
        {!loadingContentTypes && availableDataModels && availableDataModels.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No data models found. Create a data model first in the Data Model section.
          </p>
        )}
        {currentDataModelId && availableDataModels && availableDataModels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Current data model is excluded to prevent circular references.
          </p>
        )}
      </div>
    </>
  )
}
