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
import { Loader2 } from 'lucide-react'
import { projectsApi, CreateProjectDto, Project } from '@/lib/api/projects'
import { useToast } from '@/lib/hooks/use-toast'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-z0-9-]+$/.test(val),
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
})

type CreateProjectFormData = z.infer<typeof createProjectSchema>

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (project?: Project) => void
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const name = watch('name')

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Update slug when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    const currentSlug = watch('slug')
    // Only auto-generate if slug is empty or matches the previous auto-generated slug
    if (!currentSlug || currentSlug === generateSlug(name)) {
      setValue('slug', generateSlug(newName), { shouldValidate: false })
    }
    register('name').onChange(e)
  }

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      setSaving(true)

      const createDto: CreateProjectDto = {
        name: data.name,
        slug: data.slug || generateSlug(data.name),
      }

      const created = await projectsApi.create(createDto)
      toast({
        title: 'Success',
        description: 'Project created successfully',
      })
      reset()
      onOpenChange(false)
      onSuccess(created)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to create project',
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
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your content models, content, and settings.
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
                placeholder="My Project"
                {...register('name')}
                onChange={handleNameChange}
                disabled={saving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="my-project"
                {...register('slug')}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Auto-generated from name if not provided.
              </p>
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
