'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Link2, ArrowRight, ArrowLeftRight, GitBranch, Network, Share2, ChevronDown } from 'lucide-react'
import { BaseFieldFormProps } from './types'

export function RelationFieldForm({
  formElement,
  form,
  saving,
  settingsTab,
  contentTypeName,
  contentTypeId,
  contentTypes,
  loadingContentTypes,
}: BaseFieldFormProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const relationType = watch('relationType') || 'oneWay'
  const targetCollection = watch('targetCollection')

  // Get relation type configuration
  const relationTypeConfig = formElement.interface?.relationTypes?.find(
    (rt: any) => rt.key === relationType
  )

  const getRelationIcon = () => {
    switch (relationType) {
      case 'oneWay':
        return <ArrowRight className="h-4 w-4" />
      case 'oneToOne':
        return <ArrowLeftRight className="h-4 w-4" />
      case 'oneToMany':
        return <GitBranch className="h-4 w-4" />
      case 'manyToOne':
        return <GitBranch className="h-4 w-4 rotate-180" />
      case 'manyToMany':
        return <Network className="h-4 w-4" />
      case 'manyWay':
        return <Share2 className="h-4 w-4" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  if (settingsTab === 'BASIC') {
    return (
      <div className="space-y-4">
        {/* Two Entity Cards with Relation Type Selector */}
        <div className="flex items-center gap-4">
          {/* Source Entity Card */}
          <div className="flex-1 border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium">{contentTypeName}</span>
            </div>
            <div className="border-t pt-3">
              <Label htmlFor="sourceFieldName" className="text-sm">
                Field name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sourceFieldName"
                {...register('field', { required: 'Field name is required' })}
                placeholder="article"
                disabled={saving}
                className="mt-1"
              />
              {errors.field && (
                <p className="text-xs text-destructive mt-1">{errors.field.message}</p>
              )}
            </div>
          </div>

          {/* Relation Type Icons Row - Vertically Centered */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              {formElement.interface?.relationTypes?.map((rt: any) => {
                const isSelected = relationType === rt.key
                const getIcon = () => {
                  switch (rt.key) {
                    case 'oneWay':
                      return <ArrowRight className="h-4 w-4" />
                    case 'oneToOne':
                      return <ArrowLeftRight className="h-4 w-4" />
                    case 'oneToMany':
                      return <GitBranch className="h-4 w-4" />
                    case 'manyToOne':
                      return <GitBranch className="h-4 w-4 rotate-180" />
                    case 'manyToMany':
                      return <Network className="h-4 w-4" />
                    case 'manyWay':
                      return <Share2 className="h-4 w-4" />
                    default:
                      return <ArrowRight className="h-4 w-4" />
                  }
                }
                return (
                  <button
                    key={rt.key}
                    type="button"
                    onClick={() => setValue('relationType', rt.key)}
                    disabled={saving}
                    className={`
                      p-1.5 border rounded transition-colors
                      ${isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    title={rt.label}
                    aria-label={rt.label}
                  >
                    {getIcon()}
                  </button>
                )
              })}
            </div>
            {/* Relation Description Text */}
            {relationTypeConfig && (
              <p className="text-xs text-muted-foreground text-center whitespace-nowrap">
                {relationTypeConfig.label}
              </p>
            )}
          </div>

          {/* Target Entity Card */}
          <div className="flex-1 border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  {...register('targetCollection', { required: 'Target collection is required' })}
                  disabled={saving || loadingContentTypes}
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm appearance-none pr-8"
                >
                  <option value="">Select collection...</option>
                  {contentTypes
                    .filter(ct => ct.id !== contentTypeId)
                    .map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            {errors.targetCollection && (
              <p className="text-xs text-destructive mt-1">{errors.targetCollection.message}</p>
            )}
            <div className="border-t pt-3">
              <Label htmlFor="targetFieldName" className="text-sm">
                Field name
              </Label>
              <Input
                id="targetFieldName"
                {...register('targetFieldName')}
                placeholder=""
                disabled={saving || !targetCollection}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Relation Description */}
        {relationTypeConfig && targetCollection && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{contentTypeName}</span>
              {' '}
              <span>{relationTypeConfig.label}</span>
              {' '}
              <span className="font-medium">
                {contentTypes.find(ct => ct.id === targetCollection || ct.collection === targetCollection)?.name || targetCollection}
              </span>
            </p>
          </div>
        )}
      </div>
    )
  }

  // ADVANCED SETTINGS - Relation fields don't have advanced settings in the reference
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Advanced settings for {formElement.name} field
      </div>

      {/* Settings Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="text-sm font-medium">Settings</div>
        <div className="space-y-4">
          {/* Required Field */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="required-advanced"
                checked={watch('required')}
                onChange={(e) => setValue('required', e.target.checked)}
                disabled={saving}
                className="h-4 w-4"
              />
              <Label htmlFor="required-advanced" className="font-normal cursor-pointer">
                Required field
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              You won't be able to create an entry if this field is empty
            </p>
          </div>

          {/* Private Field */}
          {formElement.available_settings?.includes('private') && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={watch('private')}
                  onChange={(e) => setValue('private', e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4"
                />
                <Label htmlFor="private" className="font-normal cursor-pointer">
                  Private field
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                This field will not show up in the API response
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Condition Section */}
      {formElement.supports_conditions && (
        <div className="space-y-2 pt-4 border-t">
          <Label>Condition</Label>
          <p className="text-xs text-muted-foreground">
            Toggle field settings depending on the value of another boolean or enumeration field.
          </p>
          <button
            type="button"
            className="w-full justify-start px-3 py-2 text-sm border rounded-md hover:bg-accent"
            disabled={saving}
          >
            <span className="flex items-center">
              <span className="mr-2">+</span>
              Apply condition
            </span>
          </button>
        </div>
      )}

      {/* Note Section */}
      <div className="space-y-2 pt-4 border-t">
        <Label htmlFor="note">Note (optional)</Label>
        <Input
          id="note"
          placeholder="Field description"
          {...register('note')}
          disabled={saving}
        />
      </div>
    </div>
  )
}
