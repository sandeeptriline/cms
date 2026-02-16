'use client'

import { FormElement } from '@/lib/api/form-elements'
import { UseFormReturn } from 'react-hook-form'
import { FieldConfigurationFormData } from './types'
import { TextFieldForm } from './text-field-form'
import { SchemaFieldForm } from './schema-field-form'
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
  // Schema-specific props
  schemaStep?: 1 | 2
  onSchemaStep1Next?: () => void
  onSchemaStep2Back?: () => void
  schemaIconSearch?: string
  onSchemaIconSearchChange?: (value: string) => void
  availableDataModels?: any[]
  currentDataModelId?: string
}

export function FieldFormRenderer(props: FieldFormRendererProps) {
  const { formElement } = props

  // Render based on field type
  switch (formElement.key) {
    case 'text':
      return <TextFieldForm {...props} />
    
    case 'schema':
      return (
        <SchemaFieldForm
          {...props}
          schemaStep={props.schemaStep || 1}
          onStep1Next={props.onSchemaStep1Next || (() => {})}
          onStep2Back={props.onSchemaStep2Back || (() => {})}
          schemaIconSearch={props.schemaIconSearch || ''}
          onSchemaIconSearchChange={props.onSchemaIconSearchChange || (() => {})}
          availableDataModels={props.availableDataModels || []}
          currentDataModelId={props.currentDataModelId}
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
