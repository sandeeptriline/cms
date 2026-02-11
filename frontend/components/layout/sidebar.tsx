'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  FileText, 
  Box, 
  Image, 
  Settings,
  Users,
  Search,
  Bell,
  User,
  LogOut,
  Database,
  ChevronLeft,
  ChevronRight,
  FileStack,
  Navigation,
  Globe,
  ArrowLeftRight,
  Sparkles,
  Languages,
  FolderTree,
  Plus,
  Pencil,
  HelpCircle,
  BarChart3,
  Package,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BookOpen, Palette, Layers } from 'lucide-react'

// Platform Admin Navigation (Super Admin only)
const platformAdminNavigation = [
  { name: 'Tenants', href: '/dashboard/tenants', icon: Building2 },
  { name: 'Schema Library', href: '/dashboard/platform/schema-library', icon: Database },
  { name: 'Content Library', href: '/dashboard/platform/content-library', icon: BookOpen },
  { name: 'Component Library', href: '/dashboard/platform/component-library', icon: Layers },
  { name: 'Theme Library', href: '/dashboard/platform/theme-library', icon: Palette },
  { name: 'Settings', href: '/dashboard/platform/settings', icon: Settings },
]

// Tenant Admin Navigation (Regular users)
const tenantAdminNavigation = [
  { name: 'Content Types', href: '/dashboard/content-types', icon: Database },
  { name: 'Pages', href: '/dashboard/pages', icon: FileText },
  { name: 'Blocks', href: '/dashboard/blocks', icon: Box },
  { name: 'Media', href: '/dashboard/media', icon: Image },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Navigation', href: '/dashboard/navigation', icon: Navigation },
  { name: 'Globals', href: '/dashboard/globals', icon: Globe },
  { name: 'Redirects', href: '/dashboard/redirects', icon: ArrowLeftRight },
  { name: 'Languages', href: '/dashboard/languages', icon: Languages },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// Icon-only sidebar navigation (leftmost narrow strip)
const iconSidebarItems = [
  { icon: Plus, href: '/dashboard/new', title: 'Create New' },
  { icon: Package, href: '/dashboard/collections', title: 'Collections' },
  { icon: Pencil, href: '/dashboard/design', title: 'Design' },
  { icon: Users, href: '/dashboard/users', title: 'Users' },
  { icon: FolderTree, href: '/dashboard/files', title: 'Files' },
  { icon: BarChart3, href: '/dashboard/insights', title: 'Insights' },
  { icon: HelpCircle, href: '/dashboard/help', title: 'Help' },
  { icon: Settings, href: '/dashboard/settings', title: 'Settings' },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Determine if user is Super Admin
  const isPlatformAdmin = isSuperAdmin(user?.roles)

  // Select appropriate navigation based on role
  const navigation = isPlatformAdmin ? platformAdminNavigation : tenantAdminNavigation

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="flex h-screen">
      {/* Layer 1: Narrow Icon-Only Sidebar (Leftmost) - Always Visible */}
      <div className="flex flex-col w-14 bg-sidebar-bg border-r border-sidebar-border">
        {/* Logo/Brand Icon */}
        <div className="flex items-center justify-center h-14 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded bg-primary/10 hover:bg-primary/20 transition-colors">
            <span className="text-xs font-bold text-primary">CMS</span>
          </Link>
        </div>

        {/* Icon Navigation */}
        <nav className="flex-1 py-2 space-y-1 overflow-y-auto">
          {iconSidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
                className={cn(
                  'flex items-center justify-center w-10 h-10 mx-auto rounded-md transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section - Toggle Button and User Profile */}
        <div className="border-t border-sidebar-border py-2 space-y-1">
          {/* Toggle Button - Always visible in narrow sidebar */}
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-10 h-10 mx-auto rounded-md text-sidebar-foreground/60 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-colors border border-primary/30 shadow-sm"
                title={user?.name || 'User'}
              >
                <span className="text-[10px] text-white font-semibold">
                  {getUserInitials()}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Layer 2: Main Sidebar (Expandable/Collapsible) */}
      <div
        className={cn(
          'flex h-screen flex-col border-r border-sidebar-border bg-sidebar-bg transition-all duration-300 ease-in-out overflow-hidden',
          isCollapsed ? 'w-0' : 'w-64'
        )}
      >
        {/* Logo/Brand - Directus style */}
        <div className="border-b border-sidebar-border px-4 py-3">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2.5 group"
          >
            <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
              <span className="text-xs font-bold text-primary">CMS</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground leading-tight">CMS Platform</span>
              <span className="text-xs text-sidebar-foreground/60 leading-tight truncate">Multi-tenant CMS</span>
            </div>
          </Link>
        </div>

        {/* Global Search - Directus style */}
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-foreground/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Global Search"
              className="w-full rounded-md border-0 bg-background/50 px-2.5 py-1.5 pl-8 pr-16 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:bg-background transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-sidebar-foreground/30 font-medium">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Navigation - Directus style with Radix UI patterns */}
        <nav className="flex-1 space-y-0.5 py-2 overflow-y-auto overflow-x-hidden px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  'group flex items-center gap-2.5 px-2.5 py-2 mx-1 rounded-md text-sm transition-all duration-150',
                  isActive
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-semibold'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground font-normal'
                )}
              >
                <Icon className={cn(
                  'flex-shrink-0 h-4 w-4 transition-colors',
                  isActive 
                    ? 'text-sidebar-active-text' 
                    : 'text-sidebar-foreground/60 group-hover:text-sidebar-foreground'
                )} />
                <span className={cn(
                  'truncate leading-tight flex-1 text-sm',
                  isActive 
                    ? 'text-sidebar-active-text font-semibold' 
                    : 'text-sidebar-foreground/80 font-normal'
                )}>
                  {item.name}
                </span>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/50 flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>

      </div>
    </div>
  )
}
