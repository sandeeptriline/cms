'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useProject } from '@/contexts/project-context'
import { Loader2 } from 'lucide-react'

/**
 * Layout for /[tenantSlug]/[projectSlug]/... routes.
 * Ensures URL project slug matches current project (syncs from URL if needed).
 */
export default function ProjectSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params?.tenantSlug as string | undefined
  const projectSlug = params?.projectSlug as string | undefined
  const { tenantSlug: userTenantSlug } = useAuth()
  const { projects, currentProject, setCurrentProject, loading } = useProject()

  useEffect(() => {
    if (!tenantSlug || !projectSlug || loading) return
    if (userTenantSlug && tenantSlug !== userTenantSlug) return
    // Sync current project from URL: if slug in URL doesn't match current project, find by slug and set
    if (currentProject?.slug === projectSlug) return
    const projectBySlug = projects.find((p) => p.slug === projectSlug)
    if (projectBySlug) {
      setCurrentProject(projectBySlug)
    } else if (projects.length > 0) {
      // Slug not found, redirect to project list
      router.replace(`/${tenantSlug}/projects`)
    }
  }, [tenantSlug, projectSlug, currentProject?.slug, projects, loading, setCurrentProject, userTenantSlug, router])

  if (loading && !currentProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
