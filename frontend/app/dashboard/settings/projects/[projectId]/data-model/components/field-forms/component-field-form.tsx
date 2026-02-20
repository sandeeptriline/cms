'use client'

import { Label } from '@/components/ui/label'
import { BaseFieldFormProps } from './types'
import { DefaultFieldForm } from './default-field-form'
import { Component } from '@/lib/api/components'

interface ComponentFieldFormProps extends BaseFieldFormProps {
  components: Component[]
  loadingComponents: boolean
}

export function ComponentFieldForm({
  components,
  loadingComponents,
  ...baseProps
}: ComponentFieldFormProps) {
  const { form, saving } = baseProps
  const { register, formState: { errors } } = form
  const hasComponents = components.length > 0

  return (
    <>
      {/* Step: Select component (v2 reusable block) */}
      <div className="space-y-2">
        <Label htmlFor="componentId">
          Component <span className="text-destructive">*</span>
        </Label>
        <select
          id="componentId"
          {...register('componentId')}
          disabled={saving || loadingComponents}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">
            {loadingComponents ? 'Loading components...' : hasComponents ? 'Select a component' : 'No components available'}
          </option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>
        {errors.componentId && (
          <p className="text-sm text-destructive">{errors.componentId.message}</p>
        )}
        {!hasComponents && !loadingComponents && (
          <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
            No components in this project yet. Go to Settings → Components to create reusable blocks, then reference them here.
          </p>
        )}
        {hasComponents && (
          <p className="text-xs text-muted-foreground">
            Reusable block of fields to embed in this content model
          </p>
        )}
      </div>

      <DefaultFieldForm {...baseProps} />
    </>
  )
}
