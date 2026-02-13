'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  AlertCircle,
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Filter,
  Eye,
  KeyRound,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/utils/date'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/lib/hooks/use-toast'
import { tenantUsersApi, TenantUser } from '@/lib/api/tenant-users'
import { Tenant } from '@/lib/api/tenants'
import { CreateUserModal } from './modals/create-user-modal'
import { EditUserModal } from './modals/edit-user-modal'
import { ResetPasswordModal } from './modals/reset-password-modal'

interface UsersTabProps {
  tenant: Tenant
  onUserSelected?: (user: TenantUser | null) => void
}

export function UsersTab({ tenant, onUserSelected }: UsersTabProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [tenant.id, statusFilter])

  useEffect(() => {
    const handleOpenCreateModal = () => {
      setCreateModalOpen(true)
    }
    window.addEventListener('open-create-user-modal', handleOpenCreateModal)
    return () => {
      window.removeEventListener('open-create-user-modal', handleOpenCreateModal)
    }
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const filters: { status?: number } = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      // When statusFilter is 'all', don't send status filter - backend will return all users
      const data = await tenantUsersApi.getByTenant(tenant.id, Object.keys(filters).length > 0 ? filters : undefined)
      setUsers(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load users')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Compute filtered users (used in multiple places)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Status filter - when 'all', show all users
      if (statusFilter !== 'all') {
        // Convert both to numbers for comparison (handle string '1' vs number 1)
        const userStatus = typeof user.status === 'string' ? Number(user.status) : user.status
        const filterStatus = typeof statusFilter === 'string' ? Number(statusFilter) : statusFilter
        if (userStatus !== filterStatus) {
          return false
        }
      }
      
      // Search filter
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        user.email.toLowerCase().includes(q) ||
        (user.name && user.name.toLowerCase().includes(q))
      )
    })
  }, [users, statusFilter, searchQuery])

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredUsers.map((user) => user.id))
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      setActionLoading(true)
      await tenantUsersApi.delete(tenant.id, userId)
      toast({ title: 'Success', description: 'User deleted successfully' })
      loadUsers()
      setSelectedItems((prev) => prev.filter((id) => id !== userId))
      if (selectedUser?.id === userId) {
        setSelectedUser(null)
        onUserSelected?.(null)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete user', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} user(s)? This action cannot be undone.`)) return
    try {
      setActionLoading(true)
      await Promise.all(selectedItems.map((id) => tenantUsersApi.delete(tenant.id, id)))
      toast({ title: 'Success', description: `${selectedItems.length} user(s) deleted successfully` })
      setSelectedItems([])
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete users', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      setActionLoading(true)
      await tenantUsersApi.update(tenant.id, userId, { status: 1 })
      toast({ title: 'Success', description: 'User activated successfully' })
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to activate user', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    try {
      setActionLoading(true)
      await tenantUsersApi.update(tenant.id, userId, { status: 0 })
      toast({ title: 'Success', description: 'User deactivated successfully' })
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to deactivate user', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkActivate = async () => {
    if (selectedItems.length === 0) return
    try {
      setActionLoading(true)
      await Promise.all(
        selectedItems.map((id) => tenantUsersApi.update(tenant.id, id, { status: 1 }))
      )
      toast({ title: 'Success', description: `${selectedItems.length} user(s) activated successfully` })
      loadUsers()
      setSelectedItems([])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to activate users', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedItems.length === 0) return
    try {
      setActionLoading(true)
      await Promise.all(
        selectedItems.map((id) => tenantUsersApi.update(tenant.id, id, { status: 0 }))
      )
      toast({ title: 'Success', description: `${selectedItems.length} user(s) deactivated successfully` })
      loadUsers()
      setSelectedItems([])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to deactivate users', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserClick = (user: TenantUser) => {
    setSelectedUser(user)
    onUserSelected?.(user)
  }

  const handleEdit = (user: TenantUser) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleResetPassword = (user: TenantUser) => {
    setSelectedUser(user)
    setResetPasswordModalOpen(true)
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <Badge variant="default" className={cn('text-xs font-medium', 'bg-green-100 text-green-800 border-green-200')}>
          Active
        </Badge>
      )
    } else if (status === 0) {
      return (
        <Badge variant="secondary" className={cn('text-xs font-medium', 'bg-gray-100 text-gray-800 border-gray-200')}>
          Inactive
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className={cn('text-xs font-medium', 'bg-red-100 text-red-800 border-red-200')}>
          Deleted
        </Badge>
      )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Actions Bar */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search users by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={selectedItems.length === 0 || actionLoading}>
                <Filter className="h-4 w-4 mr-2" />
                Bulk Actions ({selectedItems.length})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleBulkActivate} disabled={actionLoading}>
                Activate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBulkDeactivate} disabled={actionLoading}>
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleBulkDelete}
                disabled={actionLoading}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter === 1 ? 'Active' : statusFilter === 0 ? 'Inactive' : 'Deleted'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(1)}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(0)}>Inactive</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter(-1)}>Deleted</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No users found</p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search query'
                : statusFilter !== 'all'
                  ? 'No users match the selected status filter'
                  : 'Get started by creating your first user'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            )}
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="rounded-md border border-border bg-background overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="w-12 h-12 px-4">
                      <Checkbox
                        checked={filteredUsers.length > 0 && selectedItems.length === filteredUsers.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Name</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Email</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Roles</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Status</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Last Login</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Created</TableHead>
                    <TableHead className="w-12 h-12 px-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={cn(
                        'border-b border-border transition-colors cursor-pointer',
                        selectedItems.includes(user.id) && 'bg-muted/30',
                        selectedUser?.id === user.id && 'bg-primary/5',
                        'hover:bg-muted/50'
                      )}
                      onClick={() => handleUserClick(user)}
                    >
                      <TableCell className="h-12 px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedItems.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell className="h-12 px-4 font-medium">{user.name || '-'}</TableCell>
                      <TableCell className="h-12 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="h-12 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                {role}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No roles</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="h-12 px-4">{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="h-12 px-4">
                        <span className="text-muted-foreground text-sm">
                          {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell className="h-12 px-4">
                        <span className="text-muted-foreground text-sm">
                          {formatDateOnly(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="h-12 px-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setEditModalOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setResetPasswordModalOpen(true)
                              }}
                            >
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 1 ? (
                              <DropdownMenuItem
                                onClick={() => handleDeactivate(user.id)}
                                disabled={actionLoading}
                              >
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(user.id)}
                                disabled={actionLoading}
                              >
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(user.id)}
                              disabled={actionLoading || user.status === -1}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateUserModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        tenantId={tenant.id}
        onSuccess={() => {
          loadUsers()
          setCreateModalOpen(false)
        }}
      />
      {selectedUser && (
        <>
          <EditUserModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            tenantId={tenant.id}
            user={selectedUser}
            onSuccess={() => {
              loadUsers()
              setEditModalOpen(false)
              setSelectedUser(null)
            }}
          />
          <ResetPasswordModal
            open={resetPasswordModalOpen}
            onOpenChange={setResetPasswordModalOpen}
            tenantId={tenant.id}
            userId={selectedUser.id}
            userEmail={selectedUser.email}
            onSuccess={() => {
              setResetPasswordModalOpen(false)
              setSelectedUser(null)
            }}
          />
        </>
      )}
    </div>
  )
}
