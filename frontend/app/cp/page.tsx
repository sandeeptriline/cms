'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, Tenant } from '@/lib/api/tenants'
import { tenantUsersApi } from '@/lib/api/tenant-users'
import { Database, Building2, CheckCircle2, Loader2, Users, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'

export default function CpDashboardPage() {
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tenantsData, usersData] = await Promise.all([
        tenantsApi.getAll(),
        tenantUsersApi.getAll().catch(() => []), // Ignore errors for users count
      ])
      setTenants(tenantsData || [])
      setTotalUsers(usersData?.length || 0)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load dashboard stats')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load dashboard stats',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const totalTenants = tenants.length
  const activeTenants = tenants.filter((t) => t.status === 'active').length
  const provisioningTenants = tenants.filter((t) => t.status === 'provisioning').length
  const suspendedTenants = tenants.filter((t) => t.status === 'suspended').length

  return (
    <DashboardLayout basePath="/cp" title="Platform Dashboard" icon={<Database className="h-5 w-5" />}>
      <div className="flex-1 bg-background">
        <div className="px-6 py-6">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin inline-block" /> : totalTenants}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin inline-block" /> : activeTenants}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provisioning</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin inline-block" /> : provisioningTenants}
                  </p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold mt-1">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin inline-block" /> : totalUsers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>

          {suspendedTenants > 0 && (
            <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {suspendedTenants} tenant{suspendedTenants !== 1 ? 's' : ''} suspended
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/cp/tenants/new">
                <div className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Building2 className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Create New Tenant</h4>
                  <p className="text-sm text-muted-foreground">Provision a new tenant in the platform</p>
                </div>
              </Link>
              <Link href="/cp/tenants">
                <div className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Database className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Manage Tenants</h4>
                  <p className="text-sm text-muted-foreground">View and manage all tenants</p>
                </div>
              </Link>
              <Link href="/cp/tenant-users">
                <div className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                  <Users className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold mb-1">Manage Tenant Users</h4>
                  <p className="text-sm text-muted-foreground">View and manage users across all tenants</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
