'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { BaseFieldFormProps } from './types'

export function DefaultFieldForm({ formElement, form, saving, settingsTab }: BaseFieldFormProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const required = watch('required')
  const hidden = watch('hidden')
  const readonly = watch('readonly')
  const selectedVariant = watch('variant')

  if (settingsTab === 'BASIC') {
    return (
      <>
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="field">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="field"
            placeholder=""
            {...register('field')}
            disabled={saving}
          />
          {errors.field && (
            <p className="text-sm text-destructive">{errors.field.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            No space is allowed for the name of the attribute
          </p>
        </div>

        {/* Variant Selection - 2 Column Grid Layout */}
        {formElement.variants && formElement.variants.length > 0 && (
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {formElement.variants.map((variant: any) => {
                const isSelected = selectedVariant === variant.key
                return (
                  <label
                    key={variant.key}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-colors
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="radio"
                        id={`variant-${variant.key}`}
                        value={variant.key}
                        checked={isSelected}
                        onChange={(e) => setValue('variant', e.target.value)}
                        disabled={saving}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {variant.name}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {variant.description}
                        </p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Field Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={required}
              onCheckedChange={(checked) => setValue('required', checked === true)}
              disabled={saving}
            />
            <Label htmlFor="required" className="font-normal cursor-pointer">
              Required field
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hidden"
              checked={hidden}
              onCheckedChange={(checked) => setValue('hidden', checked === true)}
              disabled={saving}
            />
            <Label htmlFor="hidden" className="font-normal cursor-pointer">
              Hidden field
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="readonly"
              checked={readonly}
              onCheckedChange={(checked) => setValue('readonly', checked === true)}
              disabled={saving}
            />
            <Label htmlFor="readonly" className="font-normal cursor-pointer">
              Read-only field
            </Label>
          </div>
        </div>
      </>
    )
  }

  // ADVANCED SETTINGS
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Advanced settings for {formElement.name} field
      </div>
      
      {/* Default value and other inputs in 2-column grid when applicable */}
      {formElement.available_settings?.includes('defaultValue') && (
        <div className="space-y-2">
          <Label htmlFor="defaultValue">Default value</Label>
          <textarea
            id="defaultValue"
            {...register('defaultValue')}
            disabled={saving}
            rows={4}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      {/* Media allowed types */}
      {formElement.available_settings?.includes('allowedTypes') && (
        <div className="space-y-2">
          <Label>Select allowed types of media</Label>
          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
            {formElement.interface?.allowedTypesOptions?.map((option: any) => (
              <div key={option.key} className="flex items-start space-x-2">
                <Checkbox
                  id={`allowedType-${option.key}`}
                  checked={(watch('allowedTypes') || []).includes(option.key)}
                  onCheckedChange={(checked) => {
                    const currentTypes = watch('allowedTypes') || []
                    if (checked) {
                      setValue('allowedTypes', [...currentTypes, option.key])
                    } else {
                      setValue('allowedTypes', currentTypes.filter((t: string) => t !== option.key))
                    }
                  }}
                  disabled={saving}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`allowedType-${option.key}`}
                  className="font-normal cursor-pointer flex-1"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="space-y-4 pt-4 border-t">
        <div className="text-sm font-medium">Settings</div>
        <div className="grid grid-cols-2 gap-4">
          {/* Required Field */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="required-advanced"
                checked={required}
                onCheckedChange={(checked) => setValue('required', checked === true)}
                disabled={saving}
              />
              <Label htmlFor="required-advanced" className="font-normal cursor-pointer">
                Required field
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              You won't be able to create an entry if this field is empty
            </p>
          </div>

          {/* Unique Field */}
          {formElement.available_settings?.includes('unique') && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unique"
                  checked={watch('unique')}
                  onCheckedChange={(checked) => setValue('unique', checked === true)}
                  disabled={saving}
                />
                <Label htmlFor="unique" className="font-normal cursor-pointer">
                  Unique field
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                You won't be able to create an entry if there is an existing entry with identical content
              </p>
            </div>
          )}

          {/* Maximum Length */}
          {formElement.available_settings?.includes('maxLength') && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maxLengthEnabled"
                  checked={watch('maxLengthEnabled')}
                  onCheckedChange={(checked) => {
                    setValue('maxLengthEnabled', checked === true)
                    if (!checked) {
                      setValue('maxLength', null)
                    }
                  }}
                  disabled={saving}
                />
                <Label htmlFor="maxLengthEnabled" className="font-normal cursor-pointer">
                  Maximum length
                </Label>
              </div>
              {watch('maxLengthEnabled') && (
                <div className="ml-6 mt-2">
                  <Input
                    id="maxLength"
                    type="number"
                    placeholder="Enter maximum length"
                    {...register('maxLength', { valueAsNumber: true })}
                    disabled={saving}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Minimum Length */}
          {formElement.available_settings?.includes('minLength') && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="minLengthEnabled"
                  checked={watch('minLengthEnabled')}
                  onCheckedChange={(checked) => {
                    setValue('minLengthEnabled', checked === true)
                    if (!checked) {
                      setValue('minLength', null)
                    }
                  }}
                  disabled={saving}
                />
                <Label htmlFor="minLengthEnabled" className="font-normal cursor-pointer">
                  Minimum length
                </Label>
              </div>
              {watch('minLengthEnabled') && (
                <div className="ml-6 mt-2">
                  <Input
                    id="minLength"
                    type="number"
                    placeholder="Enter minimum length"
                    {...register('minLength', { valueAsNumber: true })}
                    disabled={saving}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}

          {/* Private Field */}
          {formElement.available_settings?.includes('private') && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="private"
                  checked={watch('private')}
                  onCheckedChange={(checked) => setValue('private', checked === true)}
                  disabled={saving}
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

          {/* Enable Localization */}
          {formElement.supports_translations && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="localized"
                  checked={watch('localized')}
                  onCheckedChange={(checked) => setValue('localized', checked === true)}
                  disabled={saving}
                />
                <Label htmlFor="localized" className="font-normal cursor-pointer">
                  Enable localization for this field
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                The field can have different values in each language
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
