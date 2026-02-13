'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Play, Pause, Trash2, Loader2, MoreVertical, Command, PanelRight } from 'lucide-react'
import { Tenant } from '@/lib/api/tenants'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TenantHeaderProps {
  tenant: Tenant
  onActivate: () => void
  onSuspend: () => void
  onDelete: () => void
  actionLoading: string | null
  onOpenCommandPalette?: () => void
  onToggleContextPanel?: () => void
  contextPanelOpen?: boolean
}

export function TenantHeader({
  tenant,
  onActivate,
  onSuspend,
  onDelete,
  actionLoading,
  onOpenCommandPalette,
  onToggleContextPanel,
  contextPanelOpen,
}: TenantHeaderProps) {
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
        className={cn('text-xs font-medium px-2 py-1', colors[status])}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="px-6 py-4 border-b border-border bg-background">
      <div className="flex items-center justify-between">
        {/* Left: Breadcrumb and Tenant Info */}
        <div className="flex items-center gap-4">
          <Link
            href="/cp/tenants"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tenants
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">{tenant.name}</h1>
            {getStatusBadge(tenant.status)}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {onOpenCommandPalette && (
            <Button
              onClick={onOpenCommandPalette}
              size="sm"
              variant="outline"
              title="Open command palette (⌘K)"
            >
              <Command className="h-4 w-4" />
            </Button>
          )}
          {onToggleContextPanel && (
            <Button
              onClick={onToggleContextPanel}
              size="sm"
              variant={contextPanelOpen ? 'default' : 'outline'}
              title="Toggle context panel"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
          {tenant.status === 'suspended' && (
            <Button
              onClick={onActivate}
              disabled={actionLoading !== null}
              size="sm"
              variant="outline"
            >
              {actionLoading === 'activate' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Activate
            </Button>
          )}
          {tenant.status === 'active' && (
            <Button
              onClick={onSuspend}
              disabled={actionLoading !== null}
              size="sm"
              variant="outline"
            >
              {actionLoading === 'suspend' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Suspend
            </Button>
          )}
          <Link href={`/cp/tenants/${tenant.id}/edit`}>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Tenant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
