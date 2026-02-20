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
import { Loader2, Trash2, Search } from 'lucide-react'
import { iconLibrary, getIconComponent, getDefaultIcon } from '@/lib/utils/icon-library'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { contentTypesApi, ContentType, UpdateContentTypeDto } from '@/lib/api/content-types'
import { collectionsApi, UpdateCollectionDto } from '@/lib/api/collections'
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
  onDelete?: () => void
  showDeleteButton?: boolean
  useV2?: boolean
}

export function EditContentTypeModal({
  open,
  onOpenChange,
  contentType,
  onSuccess,
  onDelete,
  showDeleteButton = false,
  useV2 = false,
}: EditContentTypeModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

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
      collection: (contentType as { collection?: string; slug?: string }).collection ?? (contentType as { slug?: string }).slug ?? '',
      icon: (contentType as { icon?: string; config?: { icon?: string } }).icon ?? (contentType as { config?: { icon?: string } }).config?.icon ?? '',
      singleton: (contentType as { singleton?: boolean; config?: { singleton?: boolean } }).singleton ?? (contentType as { config?: { singleton?: boolean } }).config?.singleton ?? false,
      note: (contentType as { note?: string; config?: { note?: string } }).note ?? (contentType as { config?: { note?: string } }).config?.note ?? '',
      hidden: (contentType as { hidden?: boolean; config?: { hidden?: boolean } }).hidden ?? (contentType as { config?: { hidden?: boolean } }).config?.hidden ?? false,
    },
  })

  useEffect(() => {
    if (open && contentType) {
      const c = contentType as ContentType & { slug?: string; config?: { icon?: string; note?: string; singleton?: boolean; hidden?: boolean } }
      reset({
        name: contentType.name,
        collection: c.collection ?? c.slug ?? '',
        icon: c.icon ?? c.config?.icon ?? '',
        singleton: c.singleton ?? c.config?.singleton ?? false,
        note: c.note ?? c.config?.note ?? '',
        hidden: c.hidden ?? c.config?.hidden ?? false,
      })
    }
  }, [open, contentType, reset])

  const singleton = watch('singleton')
  const hidden = watch('hidden')
  const iconValue = watch('icon')
  const [iconSearchQuery, setIconSearchQuery] = useState('')

  const handleIconSelect = (iconName: string) => {
    setValue('icon', iconName)
  }

  // Filter icons based on search query
  const filteredIcons = iconLibrary.filter((icon) =>
    icon.name.toLowerCase().includes(iconSearchQuery.toLowerCase())
  )

  const onSubmit = async (data: UpdateContentTypeFormData) => {
    try {
      setSaving(true)
      if (useV2) {
        const updateDto: UpdateCollectionDto = {
          name: data.name,
          slug: data.collection,
          config: {
            icon: data.icon || 'FileText',
            note: data.note || undefined,
            singleton: data.singleton,
            hidden: data.hidden,
          },
        }
        await collectionsApi.update(contentType.id, updateDto)
      } else {
        const updateDto: UpdateContentTypeDto = {
          name: data.name,
          collection: data.collection,
          icon: data.icon || 'FileText',
          singleton: data.singleton,
          note: data.note || undefined,
          hidden: data.hidden,
        }
        await contentTypesApi.update(contentType.id, updateDto)
      }
      toast({
        title: 'Success',
        description: useV2 ? 'Collection updated successfully' : 'Content type updated successfully',
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
    if (!saving && !deleting) {
      onOpenChange(false)
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true)
      if (useV2) {
        await collectionsApi.delete(contentType.id)
      } else {
        await contentTypesApi.delete(contentType.id)
      }
      toast({
        title: 'Success',
        description: 'Content model deleted successfully',
      })
      setDeleteDialogOpen(false)
      onOpenChange(false)
      if (onDelete) {
        onDelete()
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete content model',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-w-[95vw]">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="icon">Icon</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValue('icon', '')
                    setIconSearchQuery('')
                  }}
                  className="h-7 text-xs"
                  disabled={saving || contentType.is_system}
                >
                  Clear
                </Button>
              </div>
              
              {/* Search Field */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search for an icon"
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  disabled={saving || contentType.is_system}
                  className="pl-9 pr-8"
                  autoComplete="off"
                />
                {iconSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setIconSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
                    disabled={saving || contentType.is_system}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Icon Grid */}
              <div className="border rounded-md p-4 max-h-[150px] overflow-y-auto">
                <div className="flex flex-wrap gap-1.5">
                  {filteredIcons.map((icon) => {
                    const IconComponent = icon.component
                    const isSelected = iconValue?.toLowerCase() === icon.name.toLowerCase()
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
                          name="icon"
                          value={icon.name}
                          checked={isSelected}
                          onChange={() => handleIconSelect(icon.name)}
                          className="sr-only"
                          disabled={saving || contentType.is_system}
                        />
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                      </label>
                    )
                  })}
                </div>
                {filteredIcons.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No icons found matching "{iconSearchQuery}"
                  </div>
                )}
              </div>
              
              {/* Manual Input (optional) */}
              <div className="space-y-1">
                <Label htmlFor="icon-manual" className="text-xs text-muted-foreground">
                  Or type icon name manually
                </Label>
                <Input
                  id="icon-manual"
                  placeholder="e.g., FileText, Database, Settings"
                  {...register('icon')}
                  disabled={saving || contentType.is_system}
                />
              </div>
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
            <div className="flex items-center justify-between w-full">
              {showDeleteButton && !contentType.is_system && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={saving || deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={handleClose} disabled={saving || deleting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || deleting || contentType.is_system}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Content Model</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{contentType.name}"? This action cannot be undone.
                Make sure there are no content entries using this content model.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
