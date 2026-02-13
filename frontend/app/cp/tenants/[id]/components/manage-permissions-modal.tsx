'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useToast } from '@/lib/hooks/use-toast'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { tenantUsersApi, TenantRole } from '@/lib/api/tenant-users'

interface RolePermission {
  id: string
  name: string
  resource: string
  action: string
  category: string
  description: string | null
}

interface ManagePermissionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  tenantId: string
  role: TenantRole | null
}

export function ManagePermissionsModal({
  open,
  onOpenChange,
  onSuccess,
  tenantId,
  role,
}: ManagePermissionsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allPermissions, setAllPermissions] = useState<RolePermission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open && role) {
      loadPermissions()
    } else {
      setAllPermissions([])
      setSelectedPermissionIds(new Set())
      setSearchQuery('')
      setExpandedCategories(new Set())
    }
  }, [open, role, tenantId])

  const loadPermissions = async () => {
    if (!role) return

    try {
      setLoading(true)
      const [allPerms, rolePerms] = await Promise.all([
        tenantUsersApi.getAllPermissions(tenantId),
        tenantUsersApi.getRolePermissions(tenantId, role.id),
      ])

      setAllPermissions(allPerms)
      const selectedIds = new Set(rolePerms.map((p) => p.id))
      setSelectedPermissionIds(selectedIds)

      // Expand all categories by default
      const categories = new Set(allPerms.map((p) => p.category))
      setExpandedCategories(categories)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load permissions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  const handleToggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleSelectAllInCategory = (category: string) => {
    const categoryPerms = allPermissions.filter((p) => p.category === category)
    const allSelected = categoryPerms.every((p) => selectedPermissionIds.has(p.id))

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        // Deselect all in category
        categoryPerms.forEach((p) => next.delete(p.id))
      } else {
        // Select all in category
        categoryPerms.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allSelected = allPermissions.every((p) => selectedPermissionIds.has(p.id))

    setSelectedPermissionIds((prev) => {
      if (allSelected) {
        return new Set()
      } else {
        return new Set(allPermissions.map((p) => p.id))
      }
    })
  }

  const handleSave = async () => {
    if (!role) return

    try {
      setSaving(true)
      await tenantUsersApi.assignPermissions(tenantId, role.id, Array.from(selectedPermissionIds))
      
      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      })
      
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to update permissions',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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

  const filteredPermissions = allPermissions.filter((perm) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      perm.name.toLowerCase().includes(query) ||
      perm.resource.toLowerCase().includes(query) ||
      perm.action.toLowerCase().includes(query) ||
      perm.category.toLowerCase().includes(query) ||
      (perm.description && perm.description.toLowerCase().includes(query))
    )
  })

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, RolePermission[]>)

  const selectedCount = selectedPermissionIds.size
  const totalCount = allPermissions.length

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.name}</DialogTitle>
          <DialogDescription>
            Select the permissions to assign to this role. Changes will be saved when you click "Save".
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Select All */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
            </Button>
            <div className="text-sm text-muted-foreground">
              {selectedCount} / {totalCount} selected
            </div>
          </div>

          {/* Permissions List */}
          <div className="flex-1 overflow-auto border rounded-md p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading permissions...</span>
              </div>
            ) : Object.keys(groupedPermissions).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No permissions found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([category, perms]) => {
                const isExpanded = expandedCategories.has(category)
                const categorySelected = perms.filter((p) => selectedPermissionIds.has(p.id)).length
                const categoryTotal = perms.length
                const allInCategorySelected = categorySelected === categoryTotal && categoryTotal > 0

                return (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div
                      className={cn(
                        'px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between',
                        getPermissionCategoryColor(category)
                      )}
                      onClick={() => handleToggleCategory(category)}
                    >
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleCategory(category)
                          }}
                        >
                          {isExpanded ? (
                            <span className="text-xs">▼</span>
                          ) : (
                            <span className="text-xs">▶</span>
                          )}
                        </Button>
                        <span className="font-semibold capitalize">
                          {category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs opacity-75">
                          ({categorySelected}/{categoryTotal})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectAllInCategory(category)
                        }}
                      >
                        {allInCategorySelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>

                    {/* Category Permissions */}
                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-background">
                        {perms.map((perm) => {
                          const isSelected = selectedPermissionIds.has(perm.id)
                          return (
                            <div
                              key={perm.id}
                              className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50"
                            >
                              <Checkbox
                                id={perm.id}
                                checked={isSelected}
                                onCheckedChange={() => handleTogglePermission(perm.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <Label
                                  htmlFor={perm.id}
                                  className="font-medium cursor-pointer"
                                >
                                  {perm.name}
                                </Label>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {perm.description}
                                  </p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    {perm.resource}
                                  </span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {perm.action}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Permissions ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
