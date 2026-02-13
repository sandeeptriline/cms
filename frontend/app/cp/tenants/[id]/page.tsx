'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, Tenant } from '@/lib/api/tenants'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Loader2, AlertCircle, LayoutDashboard, Users, Settings, Database, BarChart3, Shield } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { TenantHeader } from './components/tenant-header'
import { TenantTabs } from './components/tenant-tabs'
import { OverviewTab } from './components/overview-tab'
import { UsersTab } from './components/users-tab'
import { ConfigurationTab } from './components/configuration-tab'
import { AnalyticsTab } from './components/analytics-tab'
import { RolesPermissionsTab } from './components/roles-permissions-tab'
import { CommandPalette } from './components/command-palette'
import { ContextPanel } from './components/context-panel'
import { TenantUser } from '@/lib/api/tenant-users'

export default function CpTenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const tenantId = params.id as string
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [contextPanelOpen, setContextPanelOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)

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

  const handleCommandAction = (actionId: string) => {
    switch (actionId) {
      case 'create-user':
        setActiveTab('users')
        // The Users tab will handle opening the create modal
        setTimeout(() => {
          const event = new CustomEvent('open-create-user-modal')
          window.dispatchEvent(event)
        }, 100)
        break
      case 'view-users':
        setActiveTab('users')
        break
      case 'view-settings':
        setActiveTab('configuration')
        break
      case 'view-database':
        setActiveTab('configuration')
        break
      case 'view-analytics':
        setActiveTab('analytics')
        break
      case 'activate-tenant':
        handleActivate()
        break
      case 'suspend-tenant':
        handleSuspend()
        break
      default:
        break
    }
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
        </div>
      </DashboardLayout>
    )
  }

  const tabs = [
    {
      value: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      content: <OverviewTab tenant={tenant} onRefresh={loadTenant} />,
    },
    {
      value: 'users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      content: <UsersTab tenant={tenant} onUserSelected={setSelectedUser} />,
    },
    {
      value: 'configuration',
      label: 'Configuration',
      icon: <Settings className="h-4 w-4" />,
      content: <ConfigurationTab tenant={tenant} onRefresh={loadTenant} />,
    },
    {
      value: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      content: <AnalyticsTab tenant={tenant} onRefresh={loadTenant} />,
    },
    {
      value: 'roles-permissions',
      label: 'Roles & Permissions',
      icon: <Shield className="h-4 w-4" />,
      content: <RolesPermissionsTab tenant={tenant} />,
    },
  ]

  return (
    <DashboardLayout basePath="/cp" title={tenant.name} icon={<Building2 className="h-5 w-5" />}>
      <div className="flex-1 bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <TenantHeader
          tenant={tenant}
          onActivate={handleActivate}
          onSuspend={handleSuspend}
          onDelete={handleDelete}
          actionLoading={actionLoading}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleContextPanel={() => setContextPanelOpen(!contextPanelOpen)}
          contextPanelOpen={contextPanelOpen}
        />

        {/* Main Content Area with Tabs */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs and Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <TenantTabs
              tabs={tabs}
              defaultTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Context Panel */}
          <ContextPanel
            tenant={tenant}
            user={selectedUser}
            isOpen={contextPanelOpen}
            onClose={() => setContextPanelOpen(!contextPanelOpen)}
          />
        </div>

        {/* Command Palette */}
        <CommandPalette
          open={commandPaletteOpen}
          onOpenChange={setCommandPaletteOpen}
          tenantId={tenant.id}
          onAction={handleCommandAction}
        />
      </div>
    </DashboardLayout>
  )
}
