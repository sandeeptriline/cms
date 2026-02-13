'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { contentTypesApi, ContentType, UpdateContentTypeDto } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'

const updateContentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  collection: z
    .string()
    .min(1, 'Collection is required')
    .max(100, 'Collection must be less than 100 characters')
    .regex(/^[a-z0-9_]+$/, 'Collection must contain only lowercase letters, numbers, and underscores'),
  icon: z.string().optional(),
  singleton: z.boolean().default(false),
  note: z.string().optional(),
  hidden: z.boolean().default(false),
})

type UpdateContentTypeFormData = z.infer<typeof updateContentTypeSchema>

interface EditContentTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentType: ContentType
  onSuccess: () => void
}

export function EditContentTypeModal({
  open,
  onOpenChange,
  contentType,
  onSuccess,
}: EditContentTypeModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UpdateContentTypeFormData>({
    resolver: zodResolver(updateContentTypeSchema),
    defaultValues: {
      name: contentType.name,
      collection: contentType.collection,
      icon: contentType.icon || '',
      singleton: contentType.singleton,
      note: contentType.note || '',
      hidden: contentType.hidden,
    },
  })

  useEffect(() => {
    if (open && contentType) {
      reset({
        name: contentType.name,
        collection: contentType.collection,
        icon: contentType.icon || '',
        singleton: contentType.singleton,
        note: contentType.note || '',
        hidden: contentType.hidden,
      })
    }
  }, [open, contentType, reset])

  const singleton = watch('singleton')
  const hidden = watch('hidden')

  const onSubmit = async (data: UpdateContentTypeFormData) => {
    try {
      setSaving(true)
      const updateDto: UpdateContentTypeDto = {
        name: data.name,
        collection: data.collection,
        icon: data.icon || undefined,
        singleton: data.singleton,
        note: data.note || undefined,
        hidden: data.hidden,
      }
      await contentTypesApi.update(contentType.id, updateDto)
      toast({
        title: 'Success',
        description: 'Content type updated successfully',
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to update content type',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Content Type</DialogTitle>
          <DialogDescription>
            Update the content type properties. System content types cannot be modified.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                disabled={saving || contentType.is_system}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">
                Collection <span className="text-destructive">*</span>
              </Label>
              <Input
                id="collection"
                {...register('collection')}
                disabled={saving || contentType.is_system}
              />
              {errors.collection && (
                <p className="text-sm text-destructive">{errors.collection.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Unique identifier (lowercase, numbers, underscores only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                {...register('icon')}
                disabled={saving || contentType.is_system}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Description (optional)</Label>
              <textarea
                id="note"
                {...register('note')}
                disabled={saving || contentType.is_system}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="singleton"
                checked={singleton}
                onCheckedChange={(checked) => setValue('singleton', checked === true)}
                disabled={saving || contentType.is_system}
              />
              <Label htmlFor="singleton" className="font-normal cursor-pointer">
                Singleton (single item per collection)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hidden"
                checked={hidden}
                onCheckedChange={(checked) => setValue('hidden', checked === true)}
                disabled={saving || contentType.is_system}
              />
              <Label htmlFor="hidden" className="font-normal cursor-pointer">
                Hidden from sidebar
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || contentType.is_system}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
