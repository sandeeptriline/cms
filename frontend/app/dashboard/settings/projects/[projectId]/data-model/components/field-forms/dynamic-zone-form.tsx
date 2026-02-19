'use client'

import { UseFormReturn } from 'react-hook-form'
import { FieldConfigurationFormData } from './types'
import { FormElement } from '@/lib/api/form-elements'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DynamicZoneFormProps {
    formElement: FormElement
    form: UseFormReturn<FieldConfigurationFormData>
    saving: boolean
    settingsTab: 'BASIC' | 'ADVANCED'
    // Dynamic Zone specific props
    dynamicZoneStep: 1 | 2
    onStep1Next: () => void
    onStep2Back: () => void
    availableSchemas: any[] // Content types that can be added
    selectedSchemas: string[]
    onSelectedSchemasChange: (schemas: string[]) => void
    currentDataModelId?: string // Current data model ID to exclude from list
}

export function DynamicZoneForm({
    formElement,
    form,
    saving,
    settingsTab,
    dynamicZoneStep,
    onStep1Next,
    onStep2Back,
    availableSchemas,
    selectedSchemas,
    onSelectedSchemasChange,
    currentDataModelId,
}: DynamicZoneFormProps) {
    const { register, formState: { errors }, watch, setValue } = form
    const [schemaSearch, setSchemaSearch] = useState('')

    // Filter available schemas: exclude current data model and apply search filter
    const filteredSchemas = useMemo(() => {
        let filtered = availableSchemas

        // Exclude current data model to prevent circular references
        if (currentDataModelId) {
            filtered = filtered.filter(schema => schema.id !== currentDataModelId)
        }

        // Apply search filter
        if (schemaSearch) {
            filtered = filtered.filter(schema =>
                schema.name.toLowerCase().includes(schemaSearch.toLowerCase()) ||
                schema.collection.toLowerCase().includes(schemaSearch.toLowerCase())
            )
        }

        return filtered
    }, [availableSchemas, schemaSearch, currentDataModelId])

    // Handle toggle selection
    const toggleSchema = (schemaId: string) => {
        if (selectedSchemas.includes(schemaId)) {
            onSelectedSchemasChange(selectedSchemas.filter(id => id !== schemaId))
        } else {
            onSelectedSchemasChange([...selectedSchemas, schemaId])
        }
    }

    // Step 2: Select Schemas
    if (dynamicZoneStep === 2) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Select the schemas</Label>
                    <Badge variant="secondary">{selectedSchemas.length} selected</Badge>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search schemas..."
                        value={schemaSearch}
                        onChange={(e) => setSchemaSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Schema List using a styled select-like appearance as per design */}
                <div className="border rounded-md">
                    <ScrollArea className="h-[300px] p-2">
                        {filteredSchemas.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-8">
                                {schemaSearch 
                                    ? `No schemas found matching "${schemaSearch}"`
                                    : currentDataModelId
                                        ? 'No other schemas available (current data model excluded)'
                                        : 'No schemas available'}
                            </p>
                        ) : (
                            <div className="space-y-1">
                                {filteredSchemas.map((schema) => {
                                    const isSelected = selectedSchemas.includes(schema.id)
                                    return (
                                        <div
                                            key={schema.id}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                                                isSelected ? "bg-primary/10" : "hover:bg-accent/10"
                                            )}
                                            onClick={() => toggleSchema(schema.id)}
                                        >
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-sm font-medium">{schema.name}</span>
                                                <span className="text-xs text-muted-foreground truncate">{schema.collection}</span>
                                            </div>
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                onPointerDown={(e) => e.stopPropagation()}
                                                className="flex-shrink-0 ml-2"
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => {
                                                        toggleSchema(schema.id)
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        )
    }

    // Step 1: Basic Settings — Row 1: Name (col 1) | blank (col 2)
    if (settingsTab === 'BASIC') {
        return (
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="field">
                        Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="field"
                        placeholder="body_content"
                        {...register('field', { required: 'Field name is required' })}
                        disabled={saving}
                    />
                    {errors.field && (
                        <p className="text-sm text-destructive">{errors.field.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        No space is allowed for the name of the attribute
                    </p>
                </div>
                <div />
            </div>
        )
    }

    // Step 1: Advanced Settings
    return (
        <div className="space-y-4">
            <div className="text-sm font-medium">Settings</div>
            <div className="grid grid-cols-2 gap-4">
                {/* Required Field */}
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="required"
                            checked={watch('required')}
                            onCheckedChange={(checked) => setValue('required', checked === true)}
                            disabled={saving}
                        />
                        <Label htmlFor="required" className="font-normal cursor-pointer">
                            Required field
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        You won't be able to create an entry if this field is empty
                    </p>
                </div>

                {/* Max schemas */}
                {/* (Assuming we want to support min/max constraints for dynamic zones as per schema) */}
                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="maxLengthEnabled"
                            checked={watch('maxLengthEnabled')}
                            onCheckedChange={(checked) => {
                                setValue('maxLengthEnabled', checked === true)
                                if (!checked) setValue('maxLength', null)
                            }}
                            disabled={saving}
                        />
                        <Label htmlFor="maxLengthEnabled" className="font-normal cursor-pointer">
                            Maximum schemas
                        </Label>
                    </div>
                    {watch('maxLengthEnabled') && (
                        <div className="ml-6 mt-2">
                            <Input
                                type="number"
                                {...register('maxLength', { valueAsNumber: true })}
                                disabled={saving}
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="minLengthEnabled"
                            checked={watch('minLengthEnabled')}
                            onCheckedChange={(checked) => {
                                setValue('minLengthEnabled', checked === true)
                                if (!checked) setValue('minLength', null)
                            }}
                            disabled={saving}
                        />
                        <Label htmlFor="minLengthEnabled" className="font-normal cursor-pointer">
                            Minimum schemas
                        </Label>
                    </div>
                    {watch('minLengthEnabled') && (
                        <div className="ml-6 mt-2">
                            <Input
                                type="number"
                                {...register('minLength', { valueAsNumber: true })}
                                disabled={saving}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}
