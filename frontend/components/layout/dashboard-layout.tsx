'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Breadcrumb } from './breadcrumb'
import { RightSidebar } from './right-sidebar'

export interface SecondarySidebarItem {
  id: string
  name: string
  path?: string
  href?: string
  icon?: string | React.ComponentType<{ className?: string }>
  color?: string
  itemCount?: number
  hasChildren?: boolean
  children?: SecondarySidebarItem[]
  indent?: boolean
  divider?: boolean
  section?: string
  isLabel?: boolean // If true, render as non-clickable label/header
  isIconButton?: boolean // If true, render as icon-only button (for create buttons)
  iconButtonAction?: () => void // Action for icon button
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showActions?: boolean
  itemCount?: number
  icon?: React.ReactNode
  /** Base path for nav (e.g. "/cp" for control panel). Defaults to "/dashboard". */
  basePath?: string
  /** Secondary sidebar items (like Directus MainLayout secondarySidebarItems prop) */
  secondarySidebarItems?: SecondarySidebarItem[]
  /** Show secondary sidebar (default: true) */
  showSecondarySidebar?: boolean
  /** Callback when a sidebar item is clicked (for React state-based routing) */
  onSidebarItemClick?: (item: SecondarySidebarItem) => void
  /** Hide breadcrumb bar (e.g. for project list landing) */
  hideBreadcrumb?: boolean
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  showActions = true,
  itemCount,
  icon,
  basePath = '/dashboard',
  secondarySidebarItems = [],
  showSecondarySidebar = true,
  onSidebarItemClick,
  hideBreadcrumb = false,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)

  // On projects page (e.g. /dashboard/projects or /[tenantSlug]/projects), hide the sub left menu
  const isProjectsPage =
    pathname === '/dashboard/projects' ||
    (typeof pathname === 'string' && /^\/[^/]+\/projects\/?$/.test(pathname))
  const effectiveShowSecondarySidebar = showSecondarySidebar && !isProjectsPage

  // Auto-expand sidebar by default (Directus behavior - sidebar is always visible)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (effectiveShowSecondarySidebar) {
      setLeftSidebarCollapsed(false)
    }
  }, [effectiveShowSecondarySidebar, pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Fixed positioning handled inside Sidebar component */}
      <Sidebar 
        isCollapsed={leftSidebarCollapsed}
        onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        basePath={basePath}
        secondarySidebarItems={secondarySidebarItems}
        showSecondarySidebar={effectiveShowSecondarySidebar}
        onSidebarItemClick={onSidebarItemClick}
      />

      {/* Main Content Area - Adjusted for fixed sidebar (52px when sub menu hidden on projects page) */}
      <div className={cn(
        'flex flex-1 flex-col overflow-hidden transition-all duration-300',
        leftSidebarCollapsed || isProjectsPage ? 'ml-[52px]' : 'ml-[272px]'
      )}>
        {/* Header */}
        <Header 
          title={title} 
          subtitle={subtitle} 
          showActions={showActions} 
          itemCount={itemCount} 
          icon={icon}
          onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
          rightSidebarOpen={rightSidebarOpen}
          showTenantTopNav={basePath === '/dashboard'}
        />

        {/* Breadcrumb - below header */}
        {!hideBreadcrumb && (
          <div className="border-b border-border bg-muted/30 px-6 py-2">
            <Breadcrumb className="text-sm" />
          </div>
        )}

        {/* Main Content with Right Sidebar */}
        <div className="flex flex-1 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto bg-background min-w-0">
            {children}
          </main>

          {/* Right Sidebar - Toggleable */}
          <RightSidebar 
            isOpen={rightSidebarOpen} 
            onClose={() => setRightSidebarOpen(false)} 
          />
        </div>
      </div>
    </div>
  )
}
