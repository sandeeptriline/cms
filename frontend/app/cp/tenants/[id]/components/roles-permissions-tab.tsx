'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  Shield,
  ChevronDown,
  ChevronRight,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Settings,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/lib/hooks/use-toast'
import { tenantUsersApi, TenantRole } from '@/lib/api/tenant-users'
import { Tenant } from '@/lib/api/tenants'
import { cn } from '@/lib/utils'
import { CreateRoleModal } from './create-role-modal'
import { EditRoleModal } from './edit-role-modal'
import { ManagePermissionsModal } from './manage-permissions-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog as DeleteDialog,
  DialogContent as DeleteDialogContent,
  DialogDescription as DeleteDialogDescription,
  DialogFooter as DeleteDialogFooter,
  DialogHeader as DeleteDialogHeader,
  DialogTitle as DeleteDialogTitle,
} from '@/components/ui/dialog'
// Using simple state for expand/collapse instead of Collapsible component

interface RolePermission {
  id: string
  name: string
  resource: string
  action: string
  category: string
  description: string | null
}

interface RoleWithPermissions extends TenantRole {
  permissions?: RolePermission[]
  permissionCount?: number
}

interface RolesPermissionsTabProps {
  tenant: Tenant
}

export function RolesPermissionsTab({ tenant }: RolesPermissionsTabProps) {
  const { toast } = useToast()
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  const [loadingPermissions, setLoadingPermissions] = useState<Set<string>>(new Set())
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<TenantRole | null>(null)
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<TenantRole | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [managePermissionsOpen, setManagePermissionsOpen] = useState(false)
  const [managingRole, setManagingRole] = useState<TenantRole | null>(null)

  useEffect(() => {
    loadRoles()
  }, [tenant.id])

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantUsersApi.getRoles(tenant.id)
      
      // Fetch permission count for each role (just count, not full details)
      const rolesWithCounts = await Promise.all(
        data.map(async (role) => {
          try {
            // Get permissions to count them
            const permissions = await loadRolePermissions(role.id)
            return {
              ...role,
              permissions: [], // Don't load full details until expanded
              permissionCount: permissions.length,
            }
          } catch (err) {
            // If permissions endpoint doesn't exist yet, just return role
            return {
              ...role,
              permissions: [],
              permissionCount: 0,
            }
          }
        })
      )
      
      setRoles(rolesWithCounts)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load roles')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load roles',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRolePermissions = async (roleId: string): Promise<RolePermission[]> => {
    try {
      const permissions = await tenantUsersApi.getRolePermissions(tenant.id, roleId)
      return permissions.map((p) => ({
        id: p.id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        category: p.category,
        description: p.description,
      }))
    } catch (err) {
      console.error('Failed to load role permissions:', err)
      return []
    }
  }

  const toggleRoleExpansion = async (roleId: string) => {
    if (expandedRoles.has(roleId)) {
      // Collapse
      setExpandedRoles((prev) => {
        const next = new Set(prev)
        next.delete(roleId)
        return next
      })
    } else {
      // Expand - load permissions if not already loaded
      setExpandedRoles((prev) => new Set(prev).add(roleId))
      
      const role = roles.find((r) => r.id === roleId)
      if (role && (!role.permissions || role.permissions.length === 0)) {
        setLoadingPermissions((prev) => new Set(prev).add(roleId))
        try {
          const permissions = await loadRolePermissions(roleId)
          setRoles((prev) =>
            prev.map((r) =>
              r.id === roleId
                ? { ...r, permissions, permissionCount: permissions.length }
                : r
            )
          )
        } catch (err) {
          console.error('Failed to load permissions:', err)
        } finally {
          setLoadingPermissions((prev) => {
            const next = new Set(prev)
            next.delete(roleId)
            return next
          })
        }
      }
    }
  }

  const getPermissionCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      content_management: 'bg-blue-100 text-blue-800 border-blue-200',
      user_management: 'bg-purple-100 text-purple-800 border-purple-200',
      media_management: 'bg-green-100 text-green-800 border-green-200',
      role_management: 'bg-orange-100 text-orange-800 border-orange-200',
      workflow_management: 'bg-pink-100 text-pink-800 border-pink-200',
      navigation_management: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      settings: 'bg-gray-100 text-gray-800 border-gray-200',
      api_access: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    }
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const groupPermissionsByCategory = (permissions: RolePermission[]) => {
    const grouped: Record<string, RolePermission[]> = {}
    permissions.forEach((perm) => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = []
      }
      grouped[perm.category].push(perm)
    })
    return grouped
  }

  const isSystemRole = (roleName: string): boolean => {
    const systemRoles = ['Admin', 'Editor', 'Reviewer', 'Author', 'API Consumer']
    return systemRoles.includes(roleName)
  }

  const handleEditRole = (role: TenantRole) => {
    setEditingRole(role)
    setEditRoleOpen(true)
  }

  const handleDeleteRole = (role: TenantRole) => {
    setDeletingRole(role)
    setDeleteRoleOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingRole) return

    try {
      setDeleting(true)
      await tenantUsersApi.deleteRole(tenant.id, deletingRole.id)
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      })
      setDeleteRoleOpen(false)
      setDeletingRole(null)
      loadRoles()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete role',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleManagePermissions = (role: TenantRole) => {
    setManagingRole(role)
    setManagePermissionsOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading roles and permissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-6 pt-4">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Roles & Permissions</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage roles and their permissions for this tenant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadRoles} variant="outline" size="sm">
              Refresh
            </Button>
            <Button onClick={() => setCreateRoleOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No roles found</p>
            <p className="text-sm text-muted-foreground">
              Run the setup script to create default roles and permissions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map((role) => {
              const isExpanded = expandedRoles.has(role.id)
              const isLoadingPerms = loadingPermissions.has(role.id)
              const groupedPermissions = role.permissions
                ? groupPermissionsByCategory(role.permissions)
                : {}

              return (
                <div
                  key={role.id}
                  className="border border-border rounded-lg bg-background overflow-hidden"
                >
                  {/* Role Header */}
                  <div
                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => toggleRoleExpansion(role.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRoleExpansion(role.id)
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground">
                                {role.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {role.permissionCount !== undefined ? (
                            <>
                              <span className="font-medium">{role.permissionCount}</span> permissions
                            </>
                          ) : (
                            'Loading...'
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRole(role)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleManagePermissions(role)
                              }}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteRole(role)
                              }}
                              className="text-destructive"
                              disabled={isSystemRole(role.name)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Content */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-4 bg-muted/30">
                      {isLoadingPerms ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">
                            Loading permissions...
                          </span>
                        </div>
                      ) : role.permissions && role.permissions.length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(groupedPermissions).map(([category, perms]) => (
                            <div key={category}>
                              <h4 className="text-sm font-semibold mb-2 capitalize">
                                {category.replace(/_/g, ' ')}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {perms.map((perm) => (
                                  <div
                                    key={perm.id}
                                    className={cn(
                                      'flex items-center gap-2 p-2 rounded-md border text-sm',
                                      getPermissionCategoryColor(perm.category)
                                    )}
                                  >
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{perm.name}</div>
                                      {perm.description && (
                                        <div className="text-xs opacity-75 truncate">
                                          {perm.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <XCircle className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No permissions assigned to this role
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Run the setup script to assign permissions to roles.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <CreateRoleModal
        open={createRoleOpen}
        onOpenChange={setCreateRoleOpen}
        onSuccess={loadRoles}
        tenantId={tenant.id}
      />

      {/* Edit Role Modal */}
      <EditRoleModal
        open={editRoleOpen}
        onOpenChange={setEditRoleOpen}
        onSuccess={loadRoles}
        tenantId={tenant.id}
        role={editingRole}
      />

      {/* Manage Permissions Modal */}
      <ManagePermissionsModal
        open={managePermissionsOpen}
        onOpenChange={setManagePermissionsOpen}
        onSuccess={() => {
          loadRoles()
          // Reload permissions for the role if it's expanded
          if (managingRole && expandedRoles.has(managingRole.id)) {
            const role = roles.find((r) => r.id === managingRole.id)
            if (role) {
              loadRolePermissions(role.id).then((permissions) => {
                setRoles((prev) =>
                  prev.map((r) =>
                    r.id === role.id
                      ? { ...r, permissions, permissionCount: permissions.length }
                      : r
                  )
                )
              })
            }
          }
        }}
        tenantId={tenant.id}
        role={managingRole}
      />

      {/* Delete Role Confirmation */}
      <DeleteDialog open={deleteRoleOpen} onOpenChange={setDeleteRoleOpen}>
        <DeleteDialogContent>
          <DeleteDialogHeader>
            <DeleteDialogTitle>Delete Role</DeleteDialogTitle>
            <DeleteDialogDescription>
              Are you sure you want to delete the role "{deletingRole?.name}"? This action cannot be undone.
              {deletingRole && isSystemRole(deletingRole.name) && (
                <span className="block mt-2 text-destructive font-medium">
                  System roles cannot be deleted.
                </span>
              )}
            </DeleteDialogDescription>
          </DeleteDialogHeader>
          <DeleteDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteRoleOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleting || (deletingRole ? isSystemRole(deletingRole.name) : false)}
              variant="destructive"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DeleteDialogFooter>
        </DeleteDialogContent>
      </DeleteDialog>
    </div>
  )
}
