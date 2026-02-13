'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { tenantUsersApi, TenantUser } from '@/lib/api/tenant-users'
import { tenantsApi, Tenant } from '@/lib/api/tenants'
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
import { CreateTenantUserModal } from './components/create-user-modal'
import { EditTenantUserModal } from './components/edit-user-modal'
import { ResetPasswordModal } from './components/reset-password-modal'

export default function TenantUsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<TenantUser[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
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

  const tenantId = user?.tenantId

  useEffect(() => {
    if (tenantId) {
      loadTenant()
      loadUsers()
    } else {
      setError('Tenant ID not found. Please log in again.')
      setLoading(false)
    }
  }, [tenantId, statusFilter])

  const loadTenant = async () => {
    if (!tenantId) return
    try {
      const data = await tenantsApi.getById(tenantId)
      setTenant(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      console.error('Failed to load tenant:', e)
    }
  }

  const loadUsers = async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      setError(null)
      const filters: { status?: number } = {}
      if (statusFilter !== 'all') {
        filters.status = statusFilter
      }
      // When statusFilter is 'all', don't send status filter - backend will return all users
      const data = await tenantUsersApi.getByTenant(tenantId, Object.keys(filters).length > 0 ? filters : undefined)
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

  const toggleSelectAll = () => {
    if (selectedItems.length === users.length && users.length > 0) {
      setSelectedItems([])
    } else {
      setSelectedItems(users.map((user) => user.id))
    }
  }

  const handleDelete = async (userId: string) => {
    if (!tenantId) return
    try {
      setActionLoading(true)
      await tenantUsersApi.delete(tenantId, userId)
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      })
      loadUsers()
      setSelectedItems((prev) => prev.filter((id) => id !== userId))
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!tenantId || selectedItems.length === 0) return
    try {
      setActionLoading(true)
      await Promise.all(selectedItems.map((id) => tenantUsersApi.delete(tenantId, id)))
      toast({
        title: 'Success',
        description: `${selectedItems.length} user(s) deleted successfully`,
      })
      loadUsers()
      setSelectedItems([])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete users',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (userId: string) => {
    if (!tenantId) return
    try {
      setActionLoading(true)
      await tenantUsersApi.update(tenantId, userId, { status: 1 })
      toast({
        title: 'Success',
        description: 'User activated successfully',
      })
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to activate user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!tenantId) return
    try {
      setActionLoading(true)
      await tenantUsersApi.update(tenantId, userId, { status: 0 })
      toast({
        title: 'Success',
        description: 'User deactivated successfully',
      })
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to deactivate user',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkActivate = async () => {
    if (!tenantId || selectedItems.length === 0) return
    try {
      setActionLoading(true)
      await Promise.all(
        selectedItems.map((id) => tenantUsersApi.update(tenantId, id, { status: 1 }))
      )
      toast({
        title: 'Success',
        description: `${selectedItems.length} user(s) activated successfully`,
      })
      loadUsers()
      setSelectedItems([])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to activate users',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkDeactivate = async () => {
    if (!tenantId || selectedItems.length === 0) return
    try {
      setActionLoading(true)
      await Promise.all(
        selectedItems.map((id) => tenantUsersApi.update(tenantId, id, { status: 0 }))
      )
      toast({
        title: 'Success',
        description: `${selectedItems.length} user(s) deactivated successfully`,
      })
      loadUsers()
      setSelectedItems([])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to deactivate users',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
    } else if (status === 0) {
      return <Badge variant="secondary">Inactive</Badge>
    } else {
      return <Badge variant="destructive">Deleted</Badge>
    }
  }

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
      const query = searchQuery.toLowerCase()
      return (
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query))
      )
    })
  }, [users, statusFilter, searchQuery])

  if (!tenantId) {
    return (
      <ProtectedRoute>
        <DashboardLayout basePath="/dashboard" title="Users" icon={<Users className="h-5 w-5" />}>
          <div className="px-6 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Tenant ID not found. Please log in again.</AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!tenant) {
    return (
      <ProtectedRoute>
        <DashboardLayout basePath="/dashboard" title="Users" icon={<Users className="h-5 w-5" />}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        basePath="/dashboard"
        title="Users"
        itemCount={filteredUsers.length}
        icon={<Users className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          {/* Search and Actions Bar */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={selectedItems.length === 0}>
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
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          ) : (
            <div className="px-6 py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLoginAt ? formatDateOnly(user.lastLoginAt) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateOnly(user.createdAt)}
                      </TableCell>
                      <TableCell>
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
          )}
        </div>

        {/* Modals */}
        <CreateTenantUserModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={loadUsers}
          tenantId={tenantId}
        />

        <EditTenantUserModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={loadUsers}
          tenantId={tenantId}
          user={selectedUser}
        />

        <ResetPasswordModal
          open={resetPasswordModalOpen}
          onOpenChange={setResetPasswordModalOpen}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Password reset email sent',
            })
          }}
          tenantId={tenantId}
          user={selectedUser}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
