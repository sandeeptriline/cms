'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, Users, Settings, Database, BarChart3, Edit, Play, Pause, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface CommandAction {
  id: string
  label: string
  icon: React.ReactNode
  keywords: string[]
  action: () => void
  category: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  onAction?: (actionId: string) => void
}

export function CommandPalette({ open, onOpenChange, tenantId, onAction }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const actions: CommandAction[] = [
    {
      id: 'create-user',
      label: 'Create User',
      icon: <Plus className="h-4 w-4" />,
      keywords: ['create', 'user', 'add', 'new'],
      action: () => {
        onAction?.('create-user')
        onOpenChange(false)
      },
      category: 'Users',
    },
    {
      id: 'view-users',
      label: 'Go to Users Tab',
      icon: <Users className="h-4 w-4" />,
      keywords: ['users', 'view', 'list'],
      action: () => {
        onAction?.('view-users')
        onOpenChange(false)
      },
      category: 'Users',
    },
    {
      id: 'edit-tenant',
      label: 'Edit Tenant',
      icon: <Edit className="h-4 w-4" />,
      keywords: ['edit', 'tenant', 'update', 'modify'],
      action: () => {
        router.push(`/cp/tenants/${tenantId}/edit`)
        onOpenChange(false)
      },
      category: 'Tenant',
    },
    {
      id: 'activate-tenant',
      label: 'Activate Tenant',
      icon: <Play className="h-4 w-4" />,
      keywords: ['activate', 'enable', 'start'],
      action: () => {
        onAction?.('activate-tenant')
        onOpenChange(false)
      },
      category: 'Tenant',
    },
    {
      id: 'suspend-tenant',
      label: 'Suspend Tenant',
      icon: <Pause className="h-4 w-4" />,
      keywords: ['suspend', 'disable', 'pause'],
      action: () => {
        onAction?.('suspend-tenant')
        onOpenChange(false)
      },
      category: 'Tenant',
    },
    {
      id: 'view-settings',
      label: 'Go to Configuration Tab',
      icon: <Settings className="h-4 w-4" />,
      keywords: ['settings', 'config', 'configuration'],
      action: () => {
        onAction?.('view-settings')
        onOpenChange(false)
      },
      category: 'Navigation',
    },
    {
      id: 'view-database',
      label: 'View Database',
      icon: <Database className="h-4 w-4" />,
      keywords: ['database', 'db', 'schema'],
      action: () => {
        onAction?.('view-database')
        onOpenChange(false)
      },
      category: 'Database',
    },
    {
      id: 'view-analytics',
      label: 'Go to Analytics Tab',
      icon: <BarChart3 className="h-4 w-4" />,
      keywords: ['analytics', 'stats', 'metrics', 'usage'],
      action: () => {
        onAction?.('view-analytics')
        onOpenChange(false)
      },
      category: 'Navigation',
    },
  ]

  const filteredActions = search
    ? actions.filter((action) =>
        action.label.toLowerCase().includes(search.toLowerCase()) ||
        action.keywords.some((keyword) => keyword.toLowerCase().includes(search.toLowerCase()))
      )
    : actions

  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, CommandAction[]>)

  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (open) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredActions.length - 1))
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
        }
        if (e.key === 'Enter' && filteredActions[selectedIndex]) {
          e.preventDefault()
          filteredActions[selectedIndex].action()
        }
        if (e.key === 'Escape') {
          onOpenChange(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredActions, selectedIndex, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b px-4">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex h-12 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <div key={category} className="mb-4">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {category}
              </div>
              {categoryActions.map((action, index) => {
                const globalIndex = filteredActions.indexOf(action)
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
                      globalIndex === selectedIndex && 'bg-accent'
                    )}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className="flex h-4 w-4 items-center justify-center text-muted-foreground">
                      {action.icon}
                    </div>
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
          {filteredActions.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          )}
        </div>
        <DialogDescription className="px-4 pb-4 text-xs text-muted-foreground">
          Use arrow keys to navigate, Enter to select, Esc to close
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
