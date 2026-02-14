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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Loader2,
  Trash2,
  Type,
  FileText,
  Image,
  Folder,
  Database,
  Settings,
  User,
  Users,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Link2,
  Tag,
  Bookmark,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Grid,
  List,
  Layout,
  BarChart,
  PieChart,
  TrendingUp,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  Wallet,
  Building,
  Home,
  Globe,
  Zap,
  Lightbulb,
  Flame,
  Award,
  Trophy,
  Shield,
  Lock,
  Key,
  Eye,
  Camera,
  Video,
  Music,
  Film,
  Gamepad2,
  Coffee,
  Utensils,
  Car,
  Plane,
  Ship,
  Bike,
} from 'lucide-react'
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
}

export function EditContentTypeModal({
  open,
  onOpenChange,
  contentType,
  onSuccess,
  onDelete,
  showDeleteButton = false,
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
  const iconValue = watch('icon')
  const [iconPickerOpen, setIconPickerOpen] = useState(false)

  // Icon library - around 50 icons
  const iconLibrary = [
    { name: 'Type', component: Type },
    { name: 'FileText', component: FileText },
    { name: 'Image', component: Image },
    { name: 'Folder', component: Folder },
    { name: 'Database', component: Database },
    { name: 'Settings', component: Settings },
    { name: 'User', component: User },
    { name: 'Users', component: Users },
    { name: 'Mail', component: Mail },
    { name: 'Phone', component: Phone },
    { name: 'Calendar', component: Calendar },
    { name: 'Clock', component: Clock },
    { name: 'MapPin', component: MapPin },
    { name: 'Link2', component: Link2 },
    { name: 'Tag', component: Tag },
    { name: 'Bookmark', component: Bookmark },
    { name: 'Star', component: Star },
    { name: 'Heart', component: Heart },
    { name: 'ThumbsUp', component: ThumbsUp },
    { name: 'MessageSquare', component: MessageSquare },
    { name: 'Bell', component: Bell },
    { name: 'Search', component: Search },
    { name: 'Filter', component: Filter },
    { name: 'Grid', component: Grid },
    { name: 'List', component: List },
    { name: 'Layout', component: Layout },
    { name: 'BarChart', component: BarChart },
    { name: 'PieChart', component: PieChart },
    { name: 'TrendingUp', component: TrendingUp },
    { name: 'ShoppingCart', component: ShoppingCart },
    { name: 'Package', component: Package },
    { name: 'Truck', component: Truck },
    { name: 'CreditCard', component: CreditCard },
    { name: 'Wallet', component: Wallet },
    { name: 'Building', component: Building },
    { name: 'Home', component: Home },
    { name: 'Globe', component: Globe },
    { name: 'Zap', component: Zap },
    { name: 'Lightbulb', component: Lightbulb },
    { name: 'Flame', component: Flame },
    { name: 'Award', component: Award },
    { name: 'Trophy', component: Trophy },
    { name: 'Shield', component: Shield },
    { name: 'Lock', component: Lock },
    { name: 'Key', component: Key },
    { name: 'Eye', component: Eye },
    { name: 'Camera', component: Camera },
    { name: 'Video', component: Video },
    { name: 'Music', component: Music },
    { name: 'Film', component: Film },
    { name: 'Gamepad2', component: Gamepad2 },
    { name: 'Coffee', component: Coffee },
    { name: 'Utensils', component: Utensils },
    { name: 'Car', component: Car },
    { name: 'Plane', component: Plane },
    { name: 'Ship', component: Ship },
    { name: 'Bike', component: Bike },
  ]

  const getIconComponent = (iconName: string | null | undefined) => {
    if (!iconName) return null
    const icon = iconLibrary.find(i => i.name.toLowerCase() === iconName.toLowerCase())
    return icon ? icon.component : null
  }

  const handleIconSelect = (iconName: string) => {
    setValue('icon', iconName)
    setIconPickerOpen(false)
  }

  const onSubmit = async (data: UpdateContentTypeFormData) => {
    try {
      setSaving(true)
      const updateDto: UpdateContentTypeDto = {
        name: data.name,
        collection: data.collection,
        icon: data.icon || 'FileText', // Default to FileText if no icon selected
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
      await contentTypesApi.delete(contentType.id)
      toast({
        title: 'Success',
        description: 'Data model deleted successfully',
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
        description: e.message || 'Failed to delete data model',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
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
              <div className="flex gap-2">
                <Input
                  id="icon"
                  placeholder="Select an icon or type name"
                  {...register('icon')}
                  disabled={saving || contentType.is_system}
                  className="flex-1"
                />
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving || contentType.is_system}
                      className="px-3"
                    >
                      {iconValue && getIconComponent(iconValue) ? (
                        (() => {
                          const IconComponent = getIconComponent(iconValue)!
                          return <IconComponent className="h-4 w-4" />
                        })()
                      ) : (
                        <Grid className="h-4 w-4" />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-4" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Select Icon</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setValue('icon', '')
                            setIconPickerOpen(false)
                          }}
                          className="h-7 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="grid grid-cols-8 gap-2 max-h-[300px] overflow-y-auto">
                        {iconLibrary.map((icon) => {
                          const IconComponent = icon.component
                          const isSelected = iconValue?.toLowerCase() === icon.name.toLowerCase()
                          return (
                            <button
                              key={icon.name}
                              type="button"
                              onClick={() => handleIconSelect(icon.name)}
                              className={`
                                p-2 rounded-md border transition-colors
                                ${isSelected 
                                  ? 'border-primary bg-primary/10 text-primary' 
                                  : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                                }
                              `}
                              title={icon.name}
                            >
                              <IconComponent className="h-5 w-5" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-muted-foreground">
                Select an icon from the library or type the icon name manually
              </p>
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
              <AlertDialogTitle>Delete Data Model</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{contentType.name}"? This action cannot be undone.
                Make sure there are no content entries using this data model.
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
