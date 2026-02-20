'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { FolderKanban, Plus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useProject } from '@/contexts/project-context'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { Project } from '@/lib/api/projects'
import { CreateProjectModal } from '@/app/dashboard/settings/projects/components/create-project-modal'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ProjectsLandingPage() {
  const router = useRouter()
  const { user, loading: authLoading, tenantSlug, tenantId, refreshAuth } = useAuth()
  const isPlatformAdmin = isSuperAdmin(user?.roles)

  // Tenant users: always redirect to [tenantSlug]/projects (never show this URL)
  useEffect(() => {
    if (authLoading) return
    if (isPlatformAdmin) return
    if (tenantSlug) {
      router.replace(`/${tenantSlug}/projects`)
      return
    }
    if (tenantId) {
      refreshAuth().catch(() => {})
      return
    }
  }, [authLoading, isPlatformAdmin, tenantSlug, tenantId, router, refreshAuth])

  const {
    projects,
    loading: projectLoading,
    error: projectError,
    setCurrentProject,
    refreshProjects,
  } = useProject()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && isPlatformAdmin) {
      router.replace('/cp')
      return
    }
  }, [authLoading, isPlatformAdmin, router])

  useEffect(() => {
    if (projectError) setError(projectError)
  }, [projectError])

  const handleCreateSuccess = async (newProject?: Project) => {
    await refreshProjects()
    if (newProject) {
      setCurrentProject(newProject)
    }
    setCreateModalOpen(false)
  }

  const handleSelectProject = (project: Project) => {
    setCurrentProject(project)
    router.push('/dashboard')
  }

  if (authLoading || isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          {isPlatformAdmin ? 'Redirecting...' : 'Loading...'}
        </span>
      </div>
    )
  }

  if (tenantId && !tenantSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Redirecting...</span>
      </div>
    )
  }

  if (tenantSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Redirecting...</span>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        basePath="/dashboard"
        title="Projects"
        icon={<FolderKanban className="h-5 w-5" />}
        showActions={false}
        hideBreadcrumb
      >
        <div className="flex-1 flex flex-col bg-background">
          {error && (
            <div className="px-6 pt-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {projectLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">No projects yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Create your first project to manage content types, entries, and settings.
              </p>
              <Button size="lg" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Create project
              </Button>
            </div>
          ) : (
            <div className="flex-1 px-6 py-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-foreground mb-1">Your projects</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a project to open the dashboard and manage content.
                </p>
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderKanban className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{project.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{project.slug}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSelectProject(project)}
                        className="shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create another project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <CreateProjectModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
