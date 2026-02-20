'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Filter, Plus, Grid, MoreVertical, Archive, RefreshCw, Download, FileText, FolderKanban, User, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'

interface HeaderProps {
  title?: string
  subtitle?: string
  showActions?: boolean
  itemCount?: number
  icon?: React.ReactNode
  onToggleRightSidebar?: () => void
  rightSidebarOpen?: boolean
  /** Show tenant top nav: Projects, User, Settings */
  showTenantTopNav?: boolean
}

export function Header({ 
  title, 
  subtitle, 
  showActions = true, 
  itemCount, 
  icon,
  onToggleRightSidebar,
  rightSidebarOpen = false,
  showTenantTopNav = false,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, tenantSlug } = useAuth()
  
  // Extract page title from pathname
  const getPageTitle = () => {
    if (title) return title
    const parts = pathname?.split('/').filter(Boolean) || []
    if (parts.length > 1) {
      // Don't show UUIDs in breadcrumb - show a generic label instead
      const lastPart = parts[parts.length - 1]
      // Check if it's a UUID (36 characters with dashes)
      if (lastPart.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return 'Details'
      }
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1)
    }
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()
  const pageIcon = icon || <FileText className="h-5 w-5" />

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          {pageIcon}
          <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          {subtitle && (
            <span className="text-sm text-muted-foreground">/ {subtitle}</span>
          )}
        </div>

        {/* Right: Tenant top menu (Projects, Settings) or actions */}
        {showTenantTopNav ? (
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={tenantSlug ? `/${tenantSlug}/projects` : '#'} className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>
        ) : showActions ? (
          <div className="flex items-center gap-2">
            {itemCount !== undefined && (
              <span className="text-sm text-muted-foreground mr-1">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            )}
            
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Search className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Plus className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
              <Grid className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={onToggleRightSidebar}
                >
                  <span>Layout Options</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto Refresh
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Download className="h-4 w-4 mr-2" />
                  Import / Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </header>
  )
}
