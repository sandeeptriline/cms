'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'
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
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  
  // Determine if we're on a section that should show secondary sidebar (Directus behavior)
  // Secondary sidebar should be visible for all main sections
  const shouldShowSecondarySidebar = pathname?.startsWith(basePath) && 
                                     (pathname?.includes('/settings') || 
                                      pathname?.includes('/files') ||
                                      pathname?.includes('/explore') ||
                                      pathname?.includes('/insights') ||
                                      pathname?.includes('/documentation') ||
                                      pathname?.includes('/users') ||
                                      pathname?.includes('/extensions') ||
                                      pathname === basePath ||
                                      pathname?.startsWith(basePath + '/'))
  
  // Auto-expand sidebar by default (Directus behavior - sidebar is always visible)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)

  // Auto-expand sidebar when navigating to any section (Directus behavior)
  useEffect(() => {
    if (shouldShowSecondarySidebar) {
      setLeftSidebarCollapsed(false)
    }
  }, [shouldShowSecondarySidebar, pathname])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Fixed positioning handled inside Sidebar component */}
      <Sidebar 
        isCollapsed={leftSidebarCollapsed}
        onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
        basePath={basePath}
        secondarySidebarItems={secondarySidebarItems}
        showSecondarySidebar={showSecondarySidebar}
      />

      {/* Main Content Area - Adjusted for fixed sidebar */}
      <div className={cn(
        'flex flex-1 flex-col overflow-hidden transition-all duration-300',
        leftSidebarCollapsed ? 'ml-[52px]' : 'ml-[272px]'
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
        />

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
