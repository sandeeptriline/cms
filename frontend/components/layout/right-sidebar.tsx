'use client'

import { Archive, RefreshCw, Download, Workflow, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RightSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const layoutOptions = [
  { name: 'Archive', icon: Archive },
  { name: 'Auto Refresh', icon: RefreshCw },
  { name: 'Import / Export', icon: Download },
  { name: 'Flows', icon: Workflow },
]

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  if (!isOpen) return null

  return (
    <div className="w-64 border-l border-border bg-background flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Layout Options</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Options List */}
      <nav className="flex-1 overflow-y-auto p-2">
        {layoutOptions.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.name}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-foreground hover:bg-muted transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span>{option.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )
        })}
      </nav>
    </div>
  )
}
