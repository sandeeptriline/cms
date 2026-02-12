'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Database, Building2, CheckCircle2, Loader2 } from 'lucide-react'

export default function CpDashboardPage() {
  return (
    <DashboardLayout basePath="/cp" title="Platform Dashboard" icon={<Database className="h-5 w-5" />}>
    <div className="flex-1 bg-background">
      <div className="px-6 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Provisioning</p>
                <p className="text-2xl font-bold mt-1">-</p>
              </div>
              <Loader2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
