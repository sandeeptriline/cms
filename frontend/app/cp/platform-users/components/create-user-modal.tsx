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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { platformUsersApi, CreatePlatformUserDto, PlatformRole } from '@/lib/api/platform-users'
import { Checkbox } from '@/components/ui/checkbox'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  status: z.enum(['1', '0']).default('1'),
  roleIds: z.array(z.string()).optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

interface CreatePlatformUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: PlatformRole[]
  onSuccess: () => void
}

export function CreatePlatformUserModal({ open, onOpenChange, roles, onSuccess }: CreatePlatformUserModalProps) {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      status: '1',
      roleIds: [],
    },
  })

  useEffect(() => {
    if (open) {
      setSelectedRoleIds([])
    }
  }, [open])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const createData: CreatePlatformUserDto = {
        email: data.email,
        password: data.password,
        name: data.name || undefined,
        status: Number(data.status),
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      }
      await platformUsersApi.create(createData)
      toast({ title: 'Success', description: 'Platform user created successfully' })
      reset()
      setSelectedRoleIds([])
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to create user')
      toast({ title: 'Error', description: e.message || 'Failed to create user', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      reset()
      setError(null)
      setSelectedRoleIds([])
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Platform User</DialogTitle>
          <DialogDescription>Add a new platform user with role-based access. The user will be able to log in with the provided credentials.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="user@platform.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="User Name"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register('password')}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register('status')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
          </div>

          {roles.length > 0 && (
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      <div className="flex flex-col">
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">{role.description}</span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
