'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { RightSidebar } from './right-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showActions?: boolean
  itemCount?: number
  icon?: React.ReactNode
}

export function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  showActions = true,
  itemCount,
  icon
}: DashboardLayoutProps) {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar 
        isCollapsed={leftSidebarCollapsed}
        onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
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
