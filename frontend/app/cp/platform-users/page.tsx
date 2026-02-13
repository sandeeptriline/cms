'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { platformUsersApi, PlatformUser, PlatformRole } from '@/lib/api/platform-users'
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
import { Input } from '@/components/ui/input'
import { CreatePlatformUserModal } from './components/create-user-modal'
import { EditPlatformUserModal } from './components/edit-user-modal'
import { isSuperAdmin } from '@/lib/utils/roles'

export default function CpPlatformUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [roles, setRoles] = useState<PlatformRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)

  useEffect(() => {
    loadRoles()
    loadUsers()
  }, [])

  useEffect(() => {
    loadUsers()
  }, [statusFilter])

  const loadRoles = async () => {
    try {
      const data = await platformUsersApi.getRoles()
      setRoles(data || [])
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await platformUsersApi.getAll()
      setUsers(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load platform users')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load platform users',
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
    const nonSuperAdminUsers = filteredUsers.filter((user) => !isUserSuperAdmin(user))
    const nonSuperAdminIds = nonSuperAdminUsers.map((user) => user.id)
    const allNonSuperAdminSelected = nonSuperAdminIds.length > 0 && nonSuperAdminIds.every((id) => selectedItems.includes(id))
    
    if (allNonSuperAdminSelected) {
      // Deselect all non-Super Admin users
      setSelectedItems((prev) => prev.filter((id) => !nonSuperAdminIds.includes(id)))
    } else {
      // Select all non-Super Admin users (merge with existing selections)
      setSelectedItems((prev) => {
        const newSelection = [...prev]
        nonSuperAdminIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  // Helper to check if user is Super Admin
  const isUserSuperAdmin = (user: PlatformUser): boolean => {
    return isSuperAdmin(user.roles)
  }

  // Get non-Super Admin selected items for bulk actions
  const getNonSuperAdminSelectedItems = (): string[] => {
    return selectedItems.filter((id) => {
      const user = users.find((u) => u.id === id)
      return user && !isUserSuperAdmin(user)
    })
  }

  const handleDelete = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user && isUserSuperAdmin(user)) {
      toast({ title: 'Error', description: 'Super Admin users cannot be deleted', variant: 'destructive' })
      return
    }
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    try {
      await platformUsersApi.delete(userId)
      toast({ title: 'Success', description: 'User deleted successfully' })
      loadUsers()
      if (selectedUser?.id === userId) {
        setSelectedUser(null)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete user', variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    const nonSuperAdminItems = getNonSuperAdminSelectedItems()
    if (nonSuperAdminItems.length === 0) {
      toast({ title: 'Info', description: 'Super Admin users cannot be deleted', variant: 'default' })
      return
    }
    if (!confirm(`Are you sure you want to delete ${nonSuperAdminItems.length} user(s)? This action cannot be undone.`)) return
    try {
      await Promise.all(nonSuperAdminItems.map((id) => platformUsersApi.delete(id)))
      toast({ title: 'Success', description: `${nonSuperAdminItems.length} user(s) deleted successfully` })
      setSelectedItems([])
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete users', variant: 'destructive' })
    }
  }

  const handleBulkStatusChange = async (newStatus: number) => {
    const nonSuperAdminItems = getNonSuperAdminSelectedItems()
    if (nonSuperAdminItems.length === 0) {
      toast({ title: 'Info', description: 'Super Admin users cannot be deactivated', variant: 'default' })
      return
    }
    // Prevent deactivating Super Admin (status = 0)
    if (newStatus === 0) {
      const superAdminCount = selectedItems.length - nonSuperAdminItems.length
      if (superAdminCount > 0) {
        toast({ title: 'Info', description: `${superAdminCount} Super Admin user(s) cannot be deactivated`, variant: 'default' })
      }
    }
    try {
      await Promise.all(
        nonSuperAdminItems.map((id) => {
          const user = users.find((u) => u.id === id)
          if (user) {
            return platformUsersApi.update(id, { status: newStatus })
          }
        })
      )
      toast({ title: 'Success', description: `${nonSuperAdminItems.length} user(s) updated successfully` })
      setSelectedItems([])
      loadUsers()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to update users', variant: 'destructive' })
    }
  }

  const handleEdit = (user: PlatformUser) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const getStatusBadge = (status: number) => {
    if (status === 1) {
      return (
        <Badge variant="default" className={cn('text-xs font-medium', 'bg-green-100 text-green-800 border-green-200')}>
          Active
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className={cn('text-xs font-medium', 'bg-gray-100 text-gray-800 border-gray-200')}>
          Inactive
        </Badge>
      )
    }
  }

  const filteredUsers = users.filter((user) => {
    // Status filter
    if (statusFilter !== 'all' && user.status !== statusFilter) {
      return false
    }
    
    // Search filter
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(q) ||
      (user.name && user.name.toLowerCase().includes(q))
    )
  })

  return (
    <DashboardLayout basePath="/cp" title="Platform Users" icon={<Users className="h-5 w-5" />}>
      <div className="flex-1 bg-background">
        <div className="px-6 py-4 border-b border-border space-y-4">
          {/* Search and Actions Row */}
          <div className="flex items-center justify-between gap-4">
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
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    {statusFilter === 'all' ? 'All Status' : statusFilter === 1 ? 'Active' : 'Inactive'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter(1)}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter(0)}>Inactive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {selectedItems.length > 0 && (() => {
                const nonSuperAdminCount = getNonSuperAdminSelectedItems().length
                return nonSuperAdminCount > 0 ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange(1)}
                      className="h-9"
                    >
                      Activate ({nonSuperAdminCount})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange(0)}
                      className="h-9"
                    >
                      Deactivate ({nonSuperAdminCount})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-9"
                    >
                      Delete ({nonSuperAdminCount})
                    </Button>
                  </>
                ) : null
              })()}
              <Button onClick={() => setCreateModalOpen(true)} size="sm" className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </div>
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
            <span className="ml-2 text-muted-foreground">Loading platform users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              {searchQuery || statusFilter !== 'all'
                ? 'No users found matching your filters'
                : 'No platform users found'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setCreateModalOpen(true)} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Platform User
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
                        checked={
                          filteredUsers.filter((u) => !isUserSuperAdmin(u)).length > 0 &&
                          filteredUsers.filter((u) => !isUserSuperAdmin(u)).every((u) => selectedItems.includes(u.id))
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">User</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Status</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Roles</TableHead>
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
                        'border-b border-border transition-colors',
                        selectedItems.includes(user.id) && 'bg-muted/30',
                        'hover:bg-muted/50'
                      )}
                    >
                      <TableCell className="h-12 px-4">
                        <Checkbox
                          checked={selectedItems.includes(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                          disabled={isUserSuperAdmin(user)}
                        />
                      </TableCell>
                      <TableCell className="h-12 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {user.name || user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="h-12 px-4">{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="h-12 px-4">
                        {user.roles && user.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.roles.slice(0, 2).map((role, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                            {user.roles.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.roles.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No roles</span>
                        )}
                      </TableCell>
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
                      <TableCell className="h-12 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            {!isUserSuperAdmin(user) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(user.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
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

        {/* Modals */}
        <CreatePlatformUserModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          roles={roles}
          onSuccess={() => {
            loadUsers()
            setCreateModalOpen(false)
          }}
        />
        {selectedUser && (
          <EditPlatformUserModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            user={selectedUser}
            roles={roles}
            onSuccess={() => {
              loadUsers()
              setEditModalOpen(false)
              setSelectedUser(null)
            }}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
