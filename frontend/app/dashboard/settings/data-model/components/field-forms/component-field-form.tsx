'use client'

import { useState, useRef, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Search, X, ChevronDown } from 'lucide-react'
import { iconLibrary } from '@/lib/utils/icon-library'
import { BaseFieldFormProps } from './types'

interface ComponentFieldFormProps extends BaseFieldFormProps {
  componentStep: 1 | 2
  onStep1Next: () => void
  onStep2Back: () => void
  componentIconSearch: string
  onComponentIconSearchChange: (value: string) => void
  availableComponents: any[]
}

export function ComponentFieldForm({
  formElement,
  form,
  saving,
  settingsTab,
  componentStep,
  onStep1Next,
  onStep2Back,
  componentIconSearch,
  onComponentIconSearchChange,
  availableComponents,
  loadingContentTypes,
}: ComponentFieldFormProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const componentType = watch('componentType') || 'create'
  const componentIcon = watch('componentIcon')
  const componentRepeatable = watch('componentRepeatable')
  const componentCategory = watch('componentCategory') || ''
  
  // Category combobox state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState(-1)
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  
  // Predefined categories
  const predefinedCategories = ['shared', 'Items', 'global', 'dynamic-zone']
  
  // Filter categories based on input
  const filteredCategories = predefinedCategories.filter(cat =>
    cat.toLowerCase().includes(componentCategory.toLowerCase())
  )
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false)
        setHoveredCategoryIndex(-1)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleCategorySelect = (category: string) => {
    setValue('componentCategory', category)
    setIsCategoryOpen(false)
    setHoveredCategoryIndex(-1)
    categoryInputRef.current?.blur()
  }
  
  const handleCategoryInputChange = (value: string) => {
    setValue('componentCategory', value)
    setIsCategoryOpen(true)
  }
  
  const handleCategoryInputFocus = () => {
    setIsCategoryOpen(true)
  }
  
  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHoveredCategoryIndex(prev => 
        prev < filteredCategories.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHoveredCategoryIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter' && hoveredCategoryIndex >= 0) {
      e.preventDefault()
      handleCategorySelect(filteredCategories[hoveredCategoryIndex])
    } else if (e.key === 'Escape') {
      setIsCategoryOpen(false)
      setHoveredCategoryIndex(-1)
    }
  }

  // Step 1/2: Basic Settings
  if (componentStep === 1) {
    return (
      <>
        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="space-y-3">
            <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="create"
                checked={componentType === 'create'}
                onChange={(e) => setValue('componentType', e.target.value as 'create' | 'existing')}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Create a new component</div>
                <p className="text-xs text-muted-foreground mt-1">
                  A component is shared across types and components, it will be available and accessible everywhere.
                </p>
              </div>
            </label>
            <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                value="existing"
                checked={componentType === 'existing'}
                onChange={(e) => setValue('componentType', e.target.value as 'create' | 'existing')}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Use an existing component</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reuse a component already created to keep your data consistent across content-types.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Display Name and Category in 2-column grid (for new component) */}
        {componentType === 'create' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="componentDisplayName">
                  Display name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="componentDisplayName"
                  placeholder=""
                  {...register('componentDisplayName', { required: componentType === 'create' })}
                  disabled={saving}
                />
                {errors.componentDisplayName && (
                  <p className="text-sm text-destructive">This value is required.</p>
                )}
              </div>

              {/* Category - Combobox */}
              <div className="space-y-2">
                <Label htmlFor="componentCategory">
                  Select a category or enter a name to create a new one <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="componentCategory"
                    placeholder="Select or enter a value"
                    value={componentCategory}
                    onChange={(e) => {
                      handleCategoryInputChange(e.target.value)
                      setValue('componentCategory', e.target.value, { shouldValidate: true })
                    }}
                    onFocus={handleCategoryInputFocus}
                    onKeyDown={handleCategoryKeyDown}
                    disabled={saving}
                    className={`pr-8 ${isCategoryOpen ? 'border-primary focus-visible:ring-primary' : ''}`}
                    ref={(e) => {
                      categoryInputRef.current = e
                      const { ref } = register('componentCategory', { required: componentType === 'create' })
                      if (typeof ref === 'function') {
                        ref(e)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    disabled={saving}
                  >
                    <ChevronDown className={`h-4 w-4 text-muted-foreground pointer-events-none transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown List */}
                  {isCategoryOpen && (
                    <div
                      ref={categoryDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                    >
                      {filteredCategories.length > 0 ? (
                        <div className="py-1">
                          {filteredCategories.map((category, index) => {
                            const isHovered = hoveredCategoryIndex === index
                            const isSelected = componentCategory.toLowerCase() === category.toLowerCase()
                            return (
                              <div
                                key={category}
                                onClick={() => handleCategorySelect(category)}
                                onMouseEnter={() => setHoveredCategoryIndex(index)}
                                className={`
                                  px-3 py-2 cursor-pointer text-sm transition-colors
                                  ${isHovered || isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-900 hover:bg-gray-50'
                                  }
                                `}
                              >
                                {category}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No categories found. Type to create a new one.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {errors.componentCategory && (
                  <p className="text-sm text-destructive">This value is required.</p>
                )}
              </div>
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
                    value={componentIconSearch}
                    onChange={(e) => onComponentIconSearchChange(e.target.value)}
                    disabled={saving}
                    className="pl-9 pr-8"
                    autoComplete="off"
                  />
                  {componentIconSearch && (
                    <button
                      type="button"
                      onClick={() => onComponentIconSearchChange('')}
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
                        icon.name.toLowerCase().includes(componentIconSearch.toLowerCase())
                      )
                      .map((icon) => {
                        const IconComponent = icon.component
                        const isSelected = componentIcon?.toLowerCase() === icon.name.toLowerCase()
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
                              name="componentIcon"
                              value={icon.name}
                              checked={isSelected}
                              onChange={() => setValue('componentIcon', icon.name)}
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
        )}

        {/* Existing Component Selection */}
        {componentType === 'existing' && (
          <div className="space-y-2">
            <Label htmlFor="componentId">
              Select a component <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <select
                id="componentId"
                {...register('componentId', { required: componentType === 'existing' })}
                disabled={saving || loadingContentTypes}
                className="w-full px-3 py-2 border rounded-md bg-white text-sm appearance-none pr-8"
              >
                <option value="">Select or enter a value</option>
                {availableComponents.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.componentId && (
              <p className="text-sm text-destructive">This value is required.</p>
            )}
          </div>
        )}
      </>
    )
  }

  // Step 2/2: Configure the component
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

      {/* Select Component (for existing) */}
      {componentType === 'existing' && (
        <div className="space-y-2">
          <Label htmlFor="componentIdSelect">
            Select a component
          </Label>
          <div className="relative">
            <select
              id="componentIdSelect"
              {...register('componentId')}
              disabled={saving || loadingContentTypes}
              className="w-full px-3 py-2 border rounded-md bg-white text-sm appearance-none pr-8"
            >
              <option value="">Select component...</option>
              {availableComponents.map((comp) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Type Selection - Repeatable vs Single */}
      <div className="space-y-2">
        <Label>Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`
              p-4 border rounded-lg cursor-pointer transition-colors
              ${!componentRepeatable 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                checked={!componentRepeatable}
                onChange={() => setValue('componentRepeatable', false)}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Single component</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best for grouping fields like full address, main information, etc...
                </p>
              </div>
            </div>
          </label>
          <label
            className={`
              p-4 border rounded-lg cursor-pointer transition-colors
              ${componentRepeatable 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                checked={componentRepeatable}
                onChange={() => setValue('componentRepeatable', true)}
                disabled={saving}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Repeatable component</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Best for multiple instances (array) of ingredients, meta tags, etc..
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>
    </>
  )
}
