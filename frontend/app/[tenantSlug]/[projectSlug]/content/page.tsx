'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useProject } from '@/contexts/project-context'
import { Folder, Loader2 } from 'lucide-react'

/** Project-scoped content at /[tenantSlug]/[projectSlug]/content */
export default function ProjectContentPage() {
  const { currentProject, loading: projectLoading } = useProject()

  if (!currentProject && !projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout basePath="/dashboard" title="Content" icon={<Folder className="h-5 w-5" />}>
        <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
          Content management for this project — coming soon.
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
