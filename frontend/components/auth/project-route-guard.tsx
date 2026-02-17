'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useProject } from '@/contexts/project-context'
import { Loading } from '@/components/ui/loading'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProjectRouteGuardProps {
  children: React.ReactNode
}

/**
 * Route guard for project-scoped pages
 * - Validates that projectId exists in URL
 * - Verifies project exists and user has access
 * - Redirects to project selection if project invalid
 * - Auto-selects project from URL if valid
 */
export function ProjectRouteGuard({ children }: ProjectRouteGuardProps) {
  const router = useRouter()
  const params = useParams()
  const { currentProject, projects, loading, setCurrentProject } = useProject()
  const projectId = params?.projectId as string | undefined

  useEffect(() => {
    if (loading) return

    // If no projectId in URL, redirect to projects page
    if (!projectId) {
      router.replace('/dashboard/settings/projects')
      return
    }

    // Find project by ID
    const project = projects.find((p) => p.id === projectId)

    // If project not found, redirect to projects page
    if (!project) {
      router.replace('/dashboard/settings/projects')
      return
    }

    // If current project is different from URL project, update it
    if (currentProject?.id !== projectId) {
      setCurrentProject(project)
    }
  }, [projectId, projects, currentProject, loading, router, setCurrentProject])

  // Show loading while checking
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" text="Loading project..." />
      </div>
    )
  }

  // If no projectId in URL, show error
  if (!projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Project ID is required</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settings/projects')}
            >
              Select Project
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Find project by ID
  const project = projects.find((p) => p.id === projectId)

  // If project not found, show error
  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Project not found</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settings/projects')}
            >
              Select Project
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Project is valid, render children
  return <>{children}</>
}
