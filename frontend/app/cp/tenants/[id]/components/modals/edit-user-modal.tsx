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
import { tenantUsersApi, UpdateTenantUserDto, TenantUser, TenantRole } from '@/lib/api/tenant-users'
import { Checkbox } from '@/components/ui/checkbox'

const editUserSchema = z.object({
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  status: z.enum(['1', '0', '-1']).optional(),
  roleIds: z.array(z.string()).optional(),
})

type EditUserFormData = z.infer<typeof editUserSchema>

interface EditUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  user: TenantUser
  onSuccess: () => void
}

export function EditUserModal({ open, onOpenChange, tenantId, user, onSuccess }: EditUserModalProps) {
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  useEffect(() => {
    if (open) {
      loadRoles()
      if (user) {
        // Get role IDs from user roles (we need to fetch them or get from API)
        // For now, we'll need to get role IDs from the user object
        // The user object has roles as names, but we need IDs
        // We'll need to match role names to IDs
        reset({
          email: user.email,
          name: user.name || '',
          password: '',
          status: String(user.status),
          roleIds: [],
        })
        setSelectedRoleIds([]) // Will be populated after roles load
      }
    }
  }, [open, user, reset, tenantId])

  useEffect(() => {
    if (open && user && roles.length > 0) {
      // Match user role names to role IDs
      const userRoleIds = roles
        .filter((role) => user.roles?.includes(role.name))
        .map((role) => role.id)
      setSelectedRoleIds(userRoleIds)
    }
  }, [open, user, roles])

  const loadRoles = async () => {
    try {
      setLoadingRoles(true)
      const data = await tenantUsersApi.getRoles(tenantId)
      setRoles(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      console.error('Failed to load roles:', e.message)
      toast({
        title: 'Warning',
        description: 'Failed to load roles. You can still update the user without changing roles.',
        variant: 'destructive',
      })
    } finally {
      setLoadingRoles(false)
    }
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    )
  }

  const onSubmit = async (data: EditUserFormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const updateData: UpdateTenantUserDto = {}
      if (data.email && data.email !== user.email) updateData.email = data.email
      if (data.name !== undefined && data.name !== user.name) updateData.name = data.name || undefined
      if (data.password) updateData.password = data.password
      if (data.status) {
        updateData.status = Number(data.status)
      }

      // Check if roles changed
      const currentRoleIds = roles
        .filter((role) => user.roles?.includes(role.name))
        .map((role) => role.id)
        .sort()
      const newRoleIds = [...selectedRoleIds].sort()
      const rolesChanged = JSON.stringify(currentRoleIds) !== JSON.stringify(newRoleIds)
      
      if (rolesChanged) {
        updateData.roleIds = selectedRoleIds
      }

      if (Object.keys(updateData).length === 0) {
        toast({ title: 'Info', description: 'No changes to save' })
        return
      }

      await tenantUsersApi.update(tenantId, user.id, updateData)
      toast({ title: 'Success', description: 'User updated successfully' })
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
      setSelectedRoleIds([])
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information. Leave password blank to keep the current password.</DialogDescription>
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
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current password"
              {...register('password')}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">Minimum 6 characters. Leave blank to keep current password.</p>
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
              <option value="-1">Deleted</option>
            </select>
            {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="roles">Roles</Label>
            {loadingRoles ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading roles...
              </div>
            ) : roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles available. Create roles in the tenant settings.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRole(role.id)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {role.name}
                      {role.description && (
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {role.description}
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
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
