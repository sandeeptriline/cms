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
import { Loader2 } from 'lucide-react'
import { projectsApi, UpdateProjectDto, Project } from '@/lib/api/projects'
import { useToast } from '@/lib/hooks/use-toast'

const editProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
})

type EditProjectFormData = z.infer<typeof editProjectSchema>

interface EditProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  onSuccess: () => void
}

export function EditProjectModal({
  open,
  onOpenChange,
  project,
  onSuccess,
}: EditProjectModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: project.name,
      slug: project.slug,
    },
  })

  // Reset form when project changes
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        slug: project.slug,
      })
    }
  }, [project, reset])

  const onSubmit = async (data: EditProjectFormData) => {
    try {
      setSaving(true)

      const updateDto: UpdateProjectDto = {
        name: data.name,
        slug: data.slug,
      }

      await projectsApi.update(project.id, updateDto)
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to update project',
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
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details. Changes will affect all project-scoped resources.
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
                disabled={saving}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                placeholder="my-project"
                {...register('slug')}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Changing this may affect existing references.
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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
