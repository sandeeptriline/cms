'use client'

import { usePathname } from 'next/navigation'
import { Search, Filter, Plus, Grid, MoreVertical, Archive, RefreshCw, Download, FileText, Star, HelpCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title?: string
  subtitle?: string
  showActions?: boolean
  itemCount?: number
  icon?: React.ReactNode
  onToggleRightSidebar?: () => void
  rightSidebarOpen?: boolean
}

export function Header({ 
  title, 
  subtitle, 
  showActions = true, 
  itemCount, 
  icon,
  onToggleRightSidebar,
  rightSidebarOpen = false
}: HeaderProps) {
  const pathname = usePathname()
  
  // Extract page title from pathname
  const getPageTitle = () => {
    if (title) return title
    const parts = pathname?.split('/').filter(Boolean) || []
    if (parts.length > 1) {
      return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1)
    }
    return 'Dashboard'
  }

  const pageTitle = getPageTitle()
  const pageIcon = icon || <FileText className="h-5 w-5" />

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Breadcrumbs and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Content</span>
            <span className="text-xs text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              {pageIcon}
              <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        {showActions && (
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

            {/* User actions */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
