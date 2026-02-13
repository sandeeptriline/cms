'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Building2, Calendar, Database, Hash, Mail, User, KeyRound } from 'lucide-react'
import { Tenant } from '@/lib/api/tenants'
import { TenantUser } from '@/lib/api/tenant-users'
import { cn } from '@/lib/utils'
import { formatDate, formatDateOnly } from '@/lib/utils/date'

interface ContextPanelProps {
  tenant: Tenant
  user?: TenantUser | null
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function ContextPanel({ tenant, user, isOpen, onClose, className }: ContextPanelProps) {
  if (!isOpen) {
    return (
      <div className={cn('w-12 border-l border-border bg-muted/30 flex items-start justify-center pt-2', className)}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title="Open context panel"
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      provisioning: 'bg-blue-100 text-blue-800 border-blue-200',
      deleted: 'bg-red-100 text-red-800 border-red-200',
    }
    return (
      <Badge
        variant="outline"
        className={cn('text-xs font-medium', colors[status])}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className={cn('w-80 border-l border-border bg-background overflow-y-auto', className)}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">{user ? 'User Details' : 'Tenant Info'}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        {user ? (
          <>
            {/* User Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Name</div>
                  <div className="text-sm font-medium">{user.name || user.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                  <div className="text-sm">{user.email}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div>
                    <Badge
                      variant={user.status === 1 ? 'default' : user.status === 0 ? 'secondary' : 'destructive'}
                      className={cn(
                        'text-xs',
                        user.status === 1
                          ? 'bg-green-100 text-green-800'
                          : user.status === 0
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {user.status === 1 ? 'Active' : user.status === 0 ? 'Inactive' : 'Deleted'}
                    </Badge>
                  </div>
                </div>
                {user.roles && user.roles.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Roles</div>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Login</div>
                  <div className="text-xs">
                    {user.lastLoginAt
                      ? formatDate(user.lastLoginAt)
                      : 'Never'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created
                  </div>
                  <div className="text-xs">
                    {formatDateOnly(user.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Name</div>
              <div className="text-sm font-medium">{tenant.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div>{getStatusBadge(tenant.status)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Slug
              </div>
              <div className="text-sm font-mono">{tenant.slug}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">{tenant.dbName}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created
              </div>
              <div className="text-xs">
                {formatDateOnly(tenant.createdAt)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Updated</div>
              <div className="text-xs">
                {formatDateOnly(tenant.updatedAt)}
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  )
}
