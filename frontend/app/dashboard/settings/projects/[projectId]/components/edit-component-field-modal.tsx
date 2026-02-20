'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { formElementsApi, FormElement } from '@/lib/api/form-elements'
import { componentsApi, ComponentField, UpdateComponentFieldDto } from '@/lib/api/components'
import { useToast } from '@/lib/hooks/use-toast'

interface EditComponentFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentId: string
  componentName?: string
  projectId: string
  field: ComponentField
  onSuccess: () => void
}

export function EditComponentFieldModal({
  open,
  onOpenChange,
  componentId,
  componentName,
  projectId,
  field,
  onSuccess,
}: EditComponentFieldModalProps) {
  const { toast } = useToast()
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(field.name)
  const [typeKey, setTypeKey] = useState('')
  const [required, setRequired] = useState(
    !!(field.config && (field.config as { required?: boolean }).required),
  )

  useEffect(() => {
    setName(field.name)
    setRequired(!!(field.config && (field.config as { required?: boolean }).required))
  }, [field])

  useEffect(() => {
    if (open && projectId) {
      setLoading(true)
      formElementsApi
        .getAll(projectId)
        .then((data) => {
          const arr = Array.isArray(data) ? data : []
          setFormElements(arr)
          const match = arr.find((fe) => fe.type === field.type)
          setTypeKey(match ? match.key : (arr[0]?.key ?? ''))
        })
        .catch(() => setFormElements([]))
        .finally(() => setLoading(false))
    }
  }, [open, projectId, field.type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const apiName = name.trim().replace(/\s+/g, '_').toLowerCase() || name.trim()
    if (!apiName) {
      toast({ title: 'Field name is required', variant: 'destructive' })
      return
    }
    const fe = formElements.find((e) => e.key === typeKey)
    if (!fe) {
      toast({ title: 'Select a field type', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const dto: UpdateComponentFieldDto = {
        name: apiName,
        type: fe.type,
        required,
      }
      await componentsApi.updateField(componentId, field.id, dto)
      toast({ title: 'Field updated' })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to update field', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit field</DialogTitle>
          <DialogDescription>
            {componentName ? `Update field in ${componentName}.` : 'Update name, type, and required.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Field type</Label>
                <select
                  value={typeKey}
                  onChange={(e) => setTypeKey(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {formElements.map((fe) => (
                    <option key={fe.id} value={fe.key}>
                      {fe.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Field name (API key)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. title"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-required"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="edit-required" className="font-normal">Required</Label>
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
