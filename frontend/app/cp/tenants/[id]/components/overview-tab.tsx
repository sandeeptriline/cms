'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Building2,
  Users,
  Database,
  Calendar,
  Hash,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Activity,
  HardDrive,
  Zap,
} from 'lucide-react'
import { Tenant } from '@/lib/api/tenants'
import { tenantUsersApi } from '@/lib/api/tenant-users'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/hooks/use-toast'
import { formatDate, formatDateOnly } from '@/lib/utils/date'
import Link from 'next/link'

interface OverviewTabProps {
  tenant: Tenant
  onRefresh: () => void
}

export function OverviewTab({ tenant, onRefresh }: OverviewTabProps) {
  const { toast } = useToast()
  const [usersCount, setUsersCount] = useState<number | null>(null)
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    loadUsersStats()
  }, [tenant.id])

  const loadUsersStats = async () => {
    try {
      setLoadingUsers(true)
      const users = await tenantUsersApi.getByTenant(tenant.id)
      setUsersCount(users.length)
      setActiveUsersCount(users.filter((u) => u.status === 1).length)
    } catch (error) {
      console.error('Failed to load users stats:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({
      title: 'Copied',
      description: `${field} copied to clipboard`,
    })
    setTimeout(() => setCopiedField(null), 2000)
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

  const storageUsed = tenant.storageUsed ? parseFloat(tenant.storageUsed) : 0
  const storageLimit = tenant.storageLimit ? parseFloat(tenant.storageLimit) : 0
  const storagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Tenant Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>Basic tenant details and identification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm font-medium mt-1">{tenant.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">{getStatusBadge(tenant.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" />
                Slug
              </label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-mono">{tenant.slug}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(tenant.slug, 'Slug')}
                >
                  {copiedField === 'Slug' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-3.5 w-3.5" />
                ID
              </label>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-mono">{tenant.id}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(tenant.id, 'ID')}
                >
                  {copiedField === 'ID' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingUsers ? (
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                  ) : (
                    usersCount ?? '-'
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <Link href="#users" className="text-xs text-primary hover:underline mt-2 block">
              View all users →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold mt-1">
                  {loadingUsers ? (
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                  ) : (
                    activeUsersCount ?? '-'
                  )}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Storage</p>
                <p className="text-2xl font-bold mt-1">
                  {storageUsed.toFixed(1)} / {storageLimit > 0 ? storageLimit.toFixed(1) : '∞'} GB
                </p>
                {storageLimit > 0 && (
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        storagePercent > 90
                          ? 'bg-red-500'
                          : storagePercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <HardDrive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">API Calls</p>
                <p className="text-2xl font-bold mt-1">
                  {tenant.apiCallsToday ?? 0} / {tenant.apiCallsLimit ?? '∞'}
                </p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provisioning Status */}
      {tenant.status === 'provisioning' && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Tenant is currently being provisioned. This may take a few minutes.
          </AlertDescription>
        </Alert>
      )}

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle>Database Information</CardTitle>
          <CardDescription>Tenant database connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono">{tenant.dbName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => copyToClipboard(tenant.dbName, 'Database Name')}
            >
              {copiedField === 'Database Name' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          {tenant.dbUser != null && tenant.dbUser !== '' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">User</span>
              <span className="text-sm font-mono">{tenant.dbUser}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => copyToClipboard(tenant.dbUser ?? '', 'Database User')}
              >
                {copiedField === 'Database User' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
          {tenant.dbPassword != null && tenant.dbPassword !== '' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-20">Password</span>
              <span className="text-sm font-mono">••••••••</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto"
                onClick={() => copyToClipboard(tenant.dbPassword ?? '', 'Database Password')}
              >
                {copiedField === 'Database Password' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">View/copy in Configuration tab</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <CardTitle>Timestamps</CardTitle>
          <CardDescription>Creation and update information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Created At
              </label>
              <p className="text-sm mt-1">{formatDate(tenant.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Updated At
              </label>
              <p className="text-sm mt-1">{formatDate(tenant.updatedAt)}</p>
            </div>
            {tenant.provisionedAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Provisioned At
                </label>
                <p className="text-sm mt-1">{formatDate(tenant.provisionedAt)}</p>
              </div>
            )}
            {tenant.lastActivityAt && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Last Activity
                </label>
                <p className="text-sm mt-1">{formatDate(tenant.lastActivityAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
