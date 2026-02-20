'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProject } from '@/contexts/project-context'
import { ChevronRight, Home, FolderKanban, ChevronsUpDown, Check, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
  isProject?: boolean
  projectId?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

/**
 * Breadcrumb component that automatically generates breadcrumbs from the current pathname
 * For project-scoped routes, it includes the project name
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentProject, projects, setCurrentProject } = useProject()
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const parts = pathname?.split('/').filter(Boolean) || []
    const breadcrumbs: BreadcrumbItem[] = []
    const isCp = pathname?.startsWith('/cp')

    // First segment: Dashboard for /dashboard, Control Panel for /cp
    if (isCp) {
      breadcrumbs.push({ label: 'Control Panel', href: '/cp' })
    } else {
      breadcrumbs.push({ label: 'Dashboard', href: '/dashboard' })
    }

    // Check if we're on the projects list page (no projectId in path)
    const isProjectsListPage = pathname === '/dashboard/settings/projects'
    
    // Process each path segment
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLast = i === parts.length - 1
      const nextPart = parts[i + 1]

      // Skip first segment (dashboard or cp) as we already added it
      if ((part === 'dashboard' && !isCp) || (part === 'cp' && isCp)) continue

      // Handle 'settings'
      if (part === 'settings') {
        breadcrumbs.push({ label: 'Settings', href: isCp ? '/cp/settings' : '/dashboard/settings' })
        continue
      }

      // Handle 'projects'
      if (part === 'projects') {
        // Only add "Projects" if we're not on the projects list page itself
        // OR if there's a projectId after it (project-scoped route)
        if (!isProjectsListPage || nextPart?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          breadcrumbs.push({ label: 'Projects', href: '/dashboard/settings/projects' })
        }
        continue
      }

      // Get previous part for context
      const prevPart = parts[i - 1]
      const prevPrevPart = parts[i - 2]

      // Handle projectId - replace with project name (mark as project for special rendering)
      const isProjectIdSegment =
        prevPart === 'projects' &&
        part.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

      if (isProjectIdSegment) {
        const project = projects.find(p => p.id === part) ||
                        (currentProject?.id === part ? currentProject : null)

        if (project) {
          breadcrumbs.push({
            label: project.name,
            href: `/dashboard/settings/projects/${part}`,
            isProject: true,
            projectId: part
          })
        } else {
          breadcrumbs.push({ label: 'Project', isProject: true, projectId: part })
        }
        continue
      }

      // Handle 'create' route in data-model-manager - show as "Create Entry"
      if (part === 'create' && prevPart?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && 
          prevPrevPart === 'data-model-manager') {
        breadcrumbs.push({ 
          label: 'Create Entry', 
          href: '/' + parts.slice(0, i + 1).join('/')
        })
        continue
      }

      // Check if current part is an entryId in data-model-manager routes
      // Pattern: /dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]/[entryId]
      if (part.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && 
          prevPrevPart === 'data-model-manager' && 
          prevPart?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // This is an entryId - skip it as entry title will be shown in page title
        continue
      }

      // Check if current part is a contentTypeId (UUID) and previous was data-model-manager
      // Pattern: /dashboard/settings/projects/[projectId]/data-model-manager/[contentTypeId]
      if (part.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && 
          prevPart === 'data-model-manager') {
        // This is a contentTypeId - skip it as content type name will be shown in page title
        // In the future, we can load the content type name here and add it to breadcrumb
        continue
      }

      // Handle special segments that need better labels
      if (part === 'data-model') {
        breadcrumbs.push({ 
          label: 'Content Model', 
          href: '/' + parts.slice(0, i + 1).join('/')
        })
        continue
      }

      if (part === 'data-model-manager') {
        breadcrumbs.push({ 
          label: 'Content Model Manager', 
          href: '/' + parts.slice(0, i + 1).join('/')
        })
        continue
      }

      if (part === 'components') {
        breadcrumbs.push({ 
          label: 'Components', 
          href: '/' + parts.slice(0, i + 1).join('/')
        })
        continue
      }

      if (part === 'component-models') {
        breadcrumbs.push({ 
          label: 'Component Models', 
          href: '/' + parts.slice(0, i + 1).join('/')
        })
        continue
      }

      // Build label and href for this segment (including last segment so current page appears in breadcrumb)
      const segmentLabel = part
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      const href = '/' + parts.slice(0, i + 1).join('/')

      breadcrumbs.push({ 
        label: segmentLabel, 
        href: href 
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length === 0) {
    return null
  }

  const homeHref = pathname?.startsWith('/cp') ? '/cp' : '/dashboard'

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5', className)}>
      <Link
        href={homeHref}
        className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-muted/50"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        
        // Special handling for project items - make them clickable with dropdown
        if (item.isProject && item.projectId) {
          const project = projects.find(p => p.id === item.projectId) || currentProject
          
          return (
            <div key={index} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <DropdownMenu open={projectMenuOpen} onOpenChange={setProjectMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-muted/50"
                  >
                    <FolderKanban className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[250px]">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Current Project
                  </DropdownMenuLabel>
                  {project && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => setProjectMenuOpen(false)}
                    >
                      <span className="truncate font-medium">{project.name}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch Project
                  </DropdownMenuLabel>
                  {projects.length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      No projects available
                    </DropdownMenuItem>
                  ) : (
                    projects.map((p) => (
                      <DropdownMenuItem
                        key={p.id}
                        className={cn(
                          'cursor-pointer',
                          p.id === currentProject?.id && 'bg-accent'
                        )}
                        onClick={() => {
                          setCurrentProject(p)
                          setProjectMenuOpen(false)
                          // Keep current route but switch project
                          const currentPath = pathname || ''
                          const newPath = currentPath.replace(/\/projects\/[^/]+/, `/projects/${p.id}`)
                          router.push(newPath || `/dashboard/settings/projects/${p.id}/data-model`)
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {p.id === currentProject?.id ? (
                            <Check className="h-4 w-4 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      setProjectMenuOpen(false)
                      router.push('/dashboard/settings/projects?action=create')
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      setProjectMenuOpen(false)
                      router.push('/dashboard/settings/projects')
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Projects
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        }
        
        // Regular breadcrumb items
        return (
          <div key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {isLast || !item.href ? (
              <span className="text-xs text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-1 py-0.5 hover:bg-muted/50"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
