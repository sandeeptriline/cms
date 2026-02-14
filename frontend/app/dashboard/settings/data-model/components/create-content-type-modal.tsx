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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Loader2,
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
        description: 'Content type created successfully',
      })
      reset()
      onOpenChange(false)
      onSuccess(created)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to create content type',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Content Type</DialogTitle>
          <DialogDescription>
            Create a new content type to define the structure of your content entries. You can add fields after creating the content type.
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
              <Label htmlFor="icon">Icon (optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="icon"
                  placeholder="Select an icon or type name"
                  {...register('icon')}
                  disabled={saving}
                  className="flex-1"
                />
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={saving}
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
