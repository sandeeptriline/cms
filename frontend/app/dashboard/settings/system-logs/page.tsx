'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { FileCode, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/utils/roles'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function SystemLogsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const isAdminUser = isAdmin(user?.roles)

  useEffect(() => {
    if (!authLoading && !isAdminUser) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAdminUser, router])

  if (authLoading || !isAdminUser) {
    return (
      <DashboardLayout basePath="/dashboard" title="System Logs" icon={<FileCode className="h-5 w-5" />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout basePath="/dashboard" title="System Logs" subtitle="Settings" icon={<FileCode className="h-5 w-5" />}>
      <div className="flex-1 bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              System Logs feature is coming soon. This will allow you to view system activity and audit trails.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </DashboardLayout>
  )
}
