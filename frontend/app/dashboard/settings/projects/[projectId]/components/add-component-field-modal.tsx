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
import { componentsApi, CreateComponentFieldDto } from '@/lib/api/components'
import { useToast } from '@/lib/hooks/use-toast'

interface AddComponentFieldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentId: string
  componentName?: string
  projectId: string
  onSuccess: () => void
}

export function AddComponentFieldModal({
  open,
  onOpenChange,
  componentId,
  componentName,
  projectId,
  onSuccess,
}: AddComponentFieldModalProps) {
  const { toast } = useToast()
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [typeKey, setTypeKey] = useState('')
  const [required, setRequired] = useState(false)

  useEffect(() => {
    if (open && projectId) {
      setLoading(true)
      formElementsApi
        .getAll(projectId)
        .then((data) => {
          const arr = Array.isArray(data) ? data : []
          setFormElements(arr)
          if (arr.length > 0 && !typeKey) setTypeKey(arr[0].key)
        })
        .catch(() => setFormElements([]))
        .finally(() => setLoading(false))
    }
  }, [open, projectId, typeKey])

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
      const dto: CreateComponentFieldDto = {
        name: apiName,
        type: fe.type,
        required,
        config: fe.default_settings ? { ...fe.default_settings } : undefined,
      }
      await componentsApi.addField(componentId, dto)
      toast({ title: 'Field added' })
      setName('')
      setRequired(false)
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to add field', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add field</DialogTitle>
          <DialogDescription>
            {componentName ? `Add a field to ${componentName}. ` : ''}
            Choose type and name. You can change advanced options after creating.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading field types…
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
                  placeholder="e.g. title, meta_description"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="required" className="font-normal">Required</Label>
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add field
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
