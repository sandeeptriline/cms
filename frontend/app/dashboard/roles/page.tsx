'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Shield, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { RolesPermissionsTab } from '@/app/cp/tenants/[id]/components/roles-permissions-tab'
import { tenantsApi, Tenant } from '@/lib/api/tenants'

export default function TenantRolesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<Tenant | null>(null)

  // Get tenant ID from user context
  const tenantId = user?.tenantId

  useEffect(() => {
    if (tenantId) {
      loadTenant()
    } else {
      setError('Tenant ID not found. Please log in again.')
      setLoading(false)
      toast({
        title: 'Error',
        description: 'Tenant ID not found. Please log in again.',
        variant: 'destructive',
      })
    }
  }, [tenantId, toast])

  const loadTenant = async () => {
    if (!tenantId) return
    try {
      setLoading(true)
      setError(null)
      const data = await tenantsApi.getById(tenantId)
      setTenant(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load tenant')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load tenant',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout basePath="/dashboard" title="Roles & Permissions" icon={<Shield className="h-5 w-5" />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !tenant) {
    return (
      <DashboardLayout basePath="/dashboard" title="Roles & Permissions" icon={<Shield className="h-5 w-5" />}>
        <div className="px-6 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Tenant not found'}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout basePath="/dashboard" title="Roles & Permissions" icon={<Shield className="h-5 w-5" />}>
      <div className="flex-1 bg-background flex flex-col overflow-hidden">
        <RolesPermissionsTab tenant={tenant} />
      </div>
    </DashboardLayout>
  )
}
