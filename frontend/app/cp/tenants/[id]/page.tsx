'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, Tenant } from '@/lib/api/tenants'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft, Loader2, AlertCircle, Edit, Play, Pause, Trash2, Database, Calendar, Hash } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CpTenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const tenantId = params.id as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (tenantId) loadTenant()
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantsApi.getById(tenantId)
      setTenant(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load tenant')
      toast({ title: 'Error', description: e.message || 'Failed to load tenant', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!tenant) return
    setActionLoading('activate')
    try {
      await tenantsApi.activate(tenant.id)
      toast({ title: 'Success', description: 'Tenant activated successfully' })
      loadTenant()
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as { message?: string }).message || 'Failed to activate tenant', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async () => {
    if (!tenant) return
    setActionLoading('suspend')
    try {
      await tenantsApi.suspend(tenant.id)
      toast({ title: 'Success', description: 'Tenant suspended successfully' })
      loadTenant()
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as { message?: string }).message || 'Failed to suspend tenant', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!tenant) return
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return
    setActionLoading('delete')
    try {
      await tenantsApi.delete(tenant.id)
      toast({ title: 'Success', description: 'Tenant deleted successfully' })
      router.push('/cp/tenants')
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as { message?: string }).message || 'Failed to delete tenant', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const colors = { active: 'bg-green-100 text-green-800 border-green-200', suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200', provisioning: 'bg-blue-100 text-blue-800 border-blue-200', deleted: 'bg-red-100 text-red-800 border-red-200' }
    return <Badge variant="outline" className={cn('text-xs font-medium', colors[status])}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout basePath="/cp" title="Tenant Details" icon={<Building2 className="h-5 w-5" />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading tenant...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !tenant) {
    return (
      <DashboardLayout basePath="/cp" title="Tenant Details" icon={<Building2 className="h-5 w-5" />}>
        <div className="px-6 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Tenant not found'}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/cp/tenants">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Back to Tenants</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout basePath="/cp" title="Tenant Details" icon={<Building2 className="h-5 w-5" />}>
      <div className="flex-1 bg-background">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <Link href="/cp/tenants" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Link>
          <div className="flex items-center gap-2">
            {tenant.status === 'suspended' && (
              <Button onClick={handleActivate} disabled={actionLoading !== null} size="sm" variant="outline">
                {actionLoading === 'activate' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                Activate
              </Button>
            )}
            {tenant.status === 'active' && (
              <Button onClick={handleSuspend} disabled={actionLoading !== null} size="sm" variant="outline">
                {actionLoading === 'suspend' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pause className="h-4 w-4 mr-2" />}
                Suspend
              </Button>
            )}
            <Link href={`/cp/tenants/${tenant.id}/edit`}>
              <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-2" />Edit</Button>
            </Link>
            <Button onClick={handleDelete} disabled={actionLoading !== null} size="sm" variant="destructive">
              {actionLoading === 'delete' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
        <div className="px-6 py-6 max-w-4xl">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tenant identification and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm font-medium mt-1">{tenant.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">{getStatusBadge(tenant.status)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Hash className="h-3.5 w-3.5" />Slug</label>
                    <p className="text-sm font-mono mt-1">{tenant.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Hash className="h-3.5 w-3.5" />ID</label>
                    <p className="text-sm font-mono mt-1">{tenant.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Database Information</CardTitle>
                <CardDescription>Tenant database details</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Database className="h-3.5 w-3.5" />Database Name</label>
                  <p className="text-sm font-mono mt-1">{tenant.dbName}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Timestamps</CardTitle>
                <CardDescription>Creation and update information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Created At</label>
                    <p className="text-sm mt-1">{new Date(tenant.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Updated At</label>
                    <p className="text-sm mt-1">{new Date(tenant.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
