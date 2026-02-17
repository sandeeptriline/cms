'use client'

import { useState } from 'react'
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
import { Loader2, Search } from 'lucide-react'
import { iconLibrary, getIconComponent, getDefaultIcon } from '@/lib/utils/icon-library'
import { contentTypesApi, CreateContentTypeDto, ContentType } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'

const createContentTypeSchema = z.object({
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

type CreateContentTypeFormData = z.infer<typeof createContentTypeSchema>

interface CreateContentTypeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (contentType?: ContentType) => void
}

export function CreateContentTypeModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateContentTypeModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateContentTypeFormData>({
    resolver: zodResolver(createContentTypeSchema),
    defaultValues: {
      singleton: false,
      hidden: false,
    },
  })

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

  const onSubmit = async (data: CreateContentTypeFormData) => {
    try {
      setSaving(true)
      
      const createDto: CreateContentTypeDto = {
        name: data.name,
        collection: data.collection,
        icon: data.icon || 'FileText', // Default to FileText if no icon selected
        singleton: data.singleton,
        note: data.note || undefined,
        hidden: data.hidden,
      }
      
      const created = await contentTypesApi.create(createDto)
      toast({
        title: 'Success',
        description: 'Data model created successfully',
      })
      reset()
      onOpenChange(false)
      onSuccess(created)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to create data model',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Create Data Model</DialogTitle>
          <DialogDescription>
            Create a new data model to define the structure of your content entries. You can add fields after creating the data model.
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
                placeholder="Blog Post"
                {...register('name')}
                disabled={saving}
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
                placeholder="blog_posts"
                {...register('collection')}
                disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                  className="pl-9 pr-8"
                  autoComplete="off"
                />
                {iconSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setIconSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
                    disabled={saving}
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
                          disabled={saving}
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
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Description (optional)</Label>
              <textarea
                id="note"
                placeholder="Blog posts for the website"
                {...register('note')}
                disabled={saving}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="singleton"
                checked={singleton}
                onCheckedChange={(checked) => setValue('singleton', checked === true)}
                disabled={saving}
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
                disabled={saving}
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
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
