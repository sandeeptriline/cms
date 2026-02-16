'use client'

import { FormElement } from '@/lib/api/form-elements'
import { UseFormReturn } from 'react-hook-form'
import { FieldConfigurationFormData } from './types'
import { TextFieldForm } from './text-field-form'
import { ComponentFieldForm, ComponentFieldFormProps } from './component-field-form'
import { RelationFieldForm } from './relation-field-form'
import { DefaultFieldForm } from './default-field-form'

interface FieldFormRendererProps {
  formElement: FormElement
  form: UseFormReturn<FieldConfigurationFormData>
  saving: boolean
  settingsTab: 'BASIC' | 'ADVANCED'
  contentTypeName?: string
  contentTypeId: string
  contentTypes: any[]
  loadingContentTypes: boolean
  // Component-specific props
  componentStep?: 1 | 2
  onComponentStep1Next?: () => void
  onComponentStep2Back?: () => void
  componentIconSearch?: string
  onComponentIconSearchChange?: (value: string) => void
  availableComponents?: any[]
}

export function FieldFormRenderer(props: FieldFormRendererProps) {
  const { formElement } = props

  // Render based on field type
  switch (formElement.key) {
    case 'text':
      return <TextFieldForm {...props} />
    
    case 'component':
      return (
        <ComponentFieldForm
          {...props}
          componentStep={props.componentStep || 1}
          onStep1Next={props.onComponentStep1Next || (() => {})}
          onStep2Back={props.onComponentStep2Back || (() => {})}
          componentIconSearch={props.componentIconSearch || ''}
          onComponentIconSearchChange={props.onComponentIconSearchChange || (() => {})}
          availableComponents={props.availableComponents || []}
        />
      )
    
    case 'relation':
      return <RelationFieldForm {...props} />
    
    // Add more specific field types as needed
    // For now, use DefaultFieldForm for all other types
    default:
      return <DefaultFieldForm {...props} />
  }
}
