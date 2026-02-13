'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

interface FieldSelectionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectField: (formElement: FormElement) => void
  contentTypeName?: string
}

export function FieldSelectionModal({
  open,
  onOpenChange,
  onSelectField,
  contentTypeName,
}: FieldSelectionModalProps) {
  const { toast } = useToast()
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'DEFAULT' | 'CUSTOM'>('DEFAULT')

  useEffect(() => {
    if (open) {
      loadFormElements()
    }
  }, [open])

  const loadFormElements = async () => {
    try {
      setLoading(true)
      const data = await formElementsApi.getAll()
      setFormElements(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load form elements',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelectField = (formElement: FormElement) => {
    onSelectField(formElement)
    onOpenChange(false)
  }

  // Filter form elements by tab
  const defaultElements = formElements.filter((fe) => fe.is_system)
  const customElements = formElements.filter((fe) => !fe.is_system)

  const displayElements = activeTab === 'DEFAULT' ? defaultElements : customElements

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {contentTypeName && (
                <>
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {contentTypeName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm text-muted-foreground">{contentTypeName}</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="mt-4">Select a field for your collection type</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b mb-4">
          <button
            onClick={() => setActiveTab('DEFAULT')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'DEFAULT'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            DEFAULT
          </button>
          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'CUSTOM'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            CUSTOM
          </button>
        </div>

        {/* Form Elements Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading form elements...</span>
          </div>
        ) : displayElements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No {activeTab === 'DEFAULT' ? 'default' : 'custom'} form elements available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayElements.map((element) => (
              <button
                key={element.id}
                onClick={() => handleSelectField(element)}
                className="border rounded-lg p-4 text-left hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="text-2xl flex-shrink-0"
                    style={{ color: element.icon_color || '#9333EA' }}
                  >
                    {element.icon || '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {element.name}
                      </h3>
                      {element.is_system && (
                        <Badge variant="outline" className="text-xs">System</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {element.description || 'No description available'}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {element.category && (
                        <Badge variant="secondary" className="text-xs">
                          {element.category}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {element.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
