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
import { platformUsersApi, UpdatePlatformUserDto, PlatformUser, PlatformRole } from '@/lib/api/platform-users'
import { Checkbox } from '@/components/ui/checkbox'
import { isSuperAdmin } from '@/lib/utils/roles'

const editUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  status: z.enum(['1', '0']),
  roleIds: z.array(z.string()).optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditPlatformUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: PlatformUser
  roles: PlatformRole[]
  onSuccess: () => void
}

export function EditPlatformUserModal({ open, onOpenChange, user, roles, onSuccess }: EditPlatformUserModalProps) {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  
  // Check if user is Super Admin
  const isUserSuperAdmin = isSuperAdmin(user.roles)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: user.email,
      name: user.name || '',
      status: String(user.status) as '1' | '0',
      roleIds: [],
    },
  })

  useEffect(() => {
    if (open && user) {
      reset({
        email: user.email,
        name: user.name || '',
        status: String(user.status) as '1' | '0',
        roleIds: [],
      })
      // Get role IDs from user roles
      const userRoleIds = roles
        .filter((role) => user.roles?.includes(role.name))
        .map((role) => role.id)
      setSelectedRoleIds(userRoleIds)
    }
  }, [open, user, roles, reset])

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const updateData: UpdatePlatformUserDto = {
        // For Super Admin, keep original email (don't allow changes)
        email: isUserSuperAdmin ? user.email : data.email,
        name: data.name || undefined,
        // For Super Admin, keep status as active (don't allow changes)
        status: isUserSuperAdmin ? 1 : Number(data.status),
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : [],
      }
      await platformUsersApi.update(user.id, updateData)
      toast({ title: 'Success', description: 'Platform user updated successfully' })
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to update user')
      toast({ title: 'Error', description: e.message || 'Failed to update user', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
      reset()
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Platform User</DialogTitle>
          <DialogDescription>Update user information and role assignments.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
              {isUserSuperAdmin && <span className="text-xs text-muted-foreground ml-2">(Cannot be changed)</span>}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@platform.com"
              {...register('email')}
              disabled={isSubmitting || isUserSuperAdmin}
              className={isUserSuperAdmin ? 'bg-muted cursor-not-allowed' : ''}
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
            <Label htmlFor="status">
              Status
              {isUserSuperAdmin && <span className="text-xs text-muted-foreground ml-2">(Cannot be changed)</span>}
            </Label>
            <select
              id="status"
              {...register('status')}
              disabled={isSubmitting || isUserSuperAdmin}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isUserSuperAdmin ? 'bg-muted' : ''}`}
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
