'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  HardDrive,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Tenant } from '@/lib/api/tenants'
import { tenantUsersApi } from '@/lib/api/tenant-users'
import { cn } from '@/lib/utils'
import { formatDate, formatDateOnly } from '@/lib/utils/date'

interface AnalyticsTabProps {
  tenant: Tenant
  onRefresh: () => void
}

type TimeRange = 'today' | '7d' | '30d' | '90d' | 'custom'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

function MetricCard({ title, value, change, changeLabel, icon, subtitle, trend }: MetricCardProps) {
  const isPositive = trend === 'up'
  const isNegative = trend === 'down'
  const hasChange = change !== undefined && change !== 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{value}</p>
              {hasChange && (
                <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  <span>{Math.abs(change)}%</span>
                </div>
              )}
            </div>
            {changeLabel && (
              <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsTab({ tenant, onRefresh }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [usersCount, setUsersCount] = useState<number | null>(null)
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserStats()
  }, [tenant.id])

  const loadUserStats = async () => {
    try {
      setLoading(true)
      const users = await tenantUsersApi.getByTenant(tenant.id)
      setUsersCount(users.length)
      setActiveUsersCount(users.filter((u) => u.status === 1).length)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const storageUsed = tenant.storageUsed ? parseFloat(tenant.storageUsed) : 0
  const storageLimit = tenant.storageLimit ? parseFloat(tenant.storageLimit) : 0
  const storageUsedGB = storageUsed / (1024 * 1024 * 1024)
  const storageLimitGB = storageLimit / (1024 * 1024 * 1024)
  const storagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0

  const apiCallsToday = tenant.apiCallsToday || 0
  const apiCallsLimit = tenant.apiCallsLimit || 0

  const usersLimit = tenant.usersLimit || 0
  const usersPercent = usersLimit > 0 ? ((usersCount || 0) / usersLimit) * 100 : 0

  // Calculate "change" values (placeholder - would come from historical data)
  // For now, we'll show neutral or calculate based on limits
  const storageChange = storagePercent > 80 ? -5 : storagePercent > 50 ? 2 : 0
  const apiCallsChange = apiCallsLimit > 0 && apiCallsToday > apiCallsLimit * 0.8 ? -3 : 5
  const usersChange = usersPercent > 80 ? -2 : 3

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Analytics & Usage</h3>
          <p className="text-sm text-muted-foreground">Monitor tenant usage and activity</p>
        </div>
        <div className="flex items-center gap-2">
          {timeRangeOptions.map((option) => (
            <Button
              key={option.value}
              variant={timeRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(option.value)}
              disabled={option.value === 'custom'}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Storage Used"
          value={loading ? '—' : `${storageUsedGB.toFixed(2)} GB`}
          change={storageChange}
          changeLabel={storageLimit > 0 ? `of ${storageLimitGB.toFixed(2)} GB` : 'Unlimited'}
          icon={<HardDrive className="h-6 w-6" />}
          subtitle={storageLimit > 0 ? `${storagePercent.toFixed(1)}% of limit` : undefined}
          trend={storageChange > 0 ? 'up' : storageChange < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="API Calls Today"
          value={apiCallsToday.toLocaleString()}
          change={apiCallsChange}
          changeLabel={apiCallsLimit > 0 ? `of ${apiCallsLimit.toLocaleString()} limit` : 'Unlimited'}
          icon={<Zap className="h-6 w-6" />}
          subtitle={apiCallsLimit > 0 ? `${((apiCallsToday / apiCallsLimit) * 100).toFixed(1)}% of limit` : undefined}
          trend={apiCallsChange > 0 ? 'up' : apiCallsChange < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Total Users"
          value={loading ? '—' : usersCount ?? '-'}
          change={usersChange}
          changeLabel={usersLimit > 0 ? `of ${usersLimit} limit` : 'Unlimited'}
          icon={<Users className="h-6 w-6" />}
          subtitle={usersLimit > 0 ? `${usersPercent.toFixed(1)}% of limit` : undefined}
          trend={usersChange > 0 ? 'up' : usersChange < 0 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Active Users"
          value={loading ? '—' : activeUsersCount ?? '-'}
          icon={<Activity className="h-6 w-6" />}
          subtitle={usersCount !== null && usersCount > 0 ? `${((activeUsersCount || 0) / usersCount * 100).toFixed(1)}% of total` : undefined}
        />
      </div>

      {/* Usage Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Storage Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>Storage consumption over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Usage</span>
                <span className="text-sm font-medium">
                  {storageUsedGB.toFixed(2)} / {storageLimit > 0 ? `${storageLimitGB.toFixed(2)} GB` : '∞'}
                </span>
              </div>
              {storageLimit > 0 && (
                <>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={cn(
                        'h-3 rounded-full transition-all',
                        storagePercent > 90
                          ? 'bg-red-500'
                          : storagePercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{storagePercent.toFixed(1)}% used</span>
                    <span>{storageLimitGB - storageUsedGB > 0 ? `${(storageLimitGB - storageUsedGB).toFixed(2)} GB remaining` : 'Limit reached'}</span>
                  </div>
                </>
              )}
              {/* Chart Placeholder */}
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chart visualization</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Calls Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              API Calls
            </CardTitle>
            <CardDescription>API request volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-sm font-medium">
                  {apiCallsToday.toLocaleString()} / {apiCallsLimit > 0 ? apiCallsLimit.toLocaleString() : '∞'}
                </span>
              </div>
              {apiCallsLimit > 0 && (
                <>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={cn(
                        'h-3 rounded-full transition-all',
                        (apiCallsToday / apiCallsLimit) * 100 > 90
                          ? 'bg-red-500'
                          : (apiCallsToday / apiCallsLimit) * 100 > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min((apiCallsToday / apiCallsLimit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{((apiCallsToday / apiCallsLimit) * 100).toFixed(1)}% of daily limit</span>
                    <span>{apiCallsLimit - apiCallsToday > 0 ? `${(apiCallsLimit - apiCallsToday).toLocaleString()} remaining` : 'Limit reached'}</span>
                  </div>
                </>
              )}
              {/* Chart Placeholder */}
              <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Chart visualization</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Recent tenant activity and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenant.lastActivityAt ? (
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Last Activity</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tenant.lastActivityAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tenant was last active {formatDateOnly(tenant.lastActivityAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}

            {/* Activity Items Placeholder */}
            <div className="space-y-2">
              <div className="flex items-start gap-4 p-4 border rounded-lg opacity-50">
                <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Tenant Created</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(tenant.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tenant was created on {formatDateOnly(tenant.createdAt)}
                  </p>
                </div>
              </div>
              {tenant.provisionedAt && (
                <div className="flex items-start gap-4 p-4 border rounded-lg opacity-50">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Tenant Provisioned</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tenant.provisionedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Database was provisioned on {formatDateOnly(tenant.provisionedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Detailed activity log will be available in a future update
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1',
                    tenant.status === 'active'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : tenant.status === 'suspended'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : tenant.status === 'provisioning'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  )}
                >
                  {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                </Badge>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-sm font-medium mt-1">
                  {formatDateOnly(tenant.createdAt)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium mt-1">
                  {formatDateOnly(tenant.updatedAt)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
