'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Search,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Bell,
  Database,
  Folder,
  Image,
  BarChart2,
  BarChart,
  Puzzle,
  FileText,
  GitBranch,
  Lock,
  Palette,
  Bookmark,
  Languages,
  Sparkles,
  Store,
  FileCode,
  Bug,
  Lightbulb,
  Info,
  Users,
  Shield,
  Plus,
} from 'lucide-react'
import { getIconComponent, getDefaultIcon } from '@/lib/utils/icon-library'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  superAdminMenuItems,
  getTenantUserMenuItems,
  superAdminIconItems,
  getTenantUserIconItems,
  settingsSubmenuItems,
  type MenuItem,
  type SettingsMenuItem,
} from '@/lib/utils/menu-items'

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

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  /** Base path (e.g. "/cp" or "/dashboard"). Nav items use this prefix. */
  basePath?: string
  /** Secondary sidebar items (passed from page components, like Directus) */
  secondarySidebarItems?: SecondarySidebarItem[]
  /** Show secondary sidebar */
  showSecondarySidebar?: boolean
  /** Callback when a sidebar item is clicked (for React state-based routing) */
  onSidebarItemClick?: (item: SecondarySidebarItem) => void
}

export function Sidebar({ 
  isCollapsed, 
  onToggle, 
  basePath = '/dashboard',
  secondarySidebarItems = [],
  showSecondarySidebar = true,
  onSidebarItemClick,
}: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Determine if user is Super Admin
  // Super Admin uses /cp routes, tenant users use /dashboard routes
  const isPlatformAdmin = isSuperAdmin(user?.roles) || pathname?.startsWith('/cp')
  
  // Get appropriate menu items based on user type
  let navigation: Array<MenuItem & { href: string }>
  let iconItems: Array<{ icon: React.ComponentType<{ className?: string }>; href: string; title: string }>
  
  if (isPlatformAdmin) {
    // Super Admin menu
    navigation = superAdminMenuItems.map((item) => ({
      ...item,
      href: item.path, // Already includes /cp prefix
    }))
    iconItems = superAdminIconItems
  } else {
    // Tenant user menu (dynamic based on roles)
    const tenantMenuItems = getTenantUserMenuItems(user?.roles)
    navigation = tenantMenuItems.map((item) => ({
      ...item,
      href: item.path, // Already includes /dashboard prefix
    }))
    iconItems = getTenantUserIconItems(user?.roles)
  }

  // Directus pattern: Simple active state check using pathname.startsWith()
  // No complex section detection needed - each icon checks if pathname starts with its path

  // Auto-expand sidebar when any primary icon is active (Directus behavior)
  // Sidebar should be visible when not explicitly collapsed
  const shouldShowSidebar = !isCollapsed

  const handleLogout = async () => {
    try {
      await logout()
      router.push(basePath === '/cp' ? '/cp/login' : '/login')
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
    <TooltipProvider delayDuration={100}>
      <div className="flex h-screen">
        {/* Layer 1: Narrow Icon-Only Sidebar (Directus Style) - Always Visible */}
        <div className="flex flex-col w-[52px] h-screen bg-[#6644FF] fixed left-0 top-0 z-50 shadow-lg">
          {/* Logo/Brand Icon - Directus Style */}
          <div 
            onClick={() => router.push(basePath)}
            className="flex items-center justify-center h-[52px] cursor-pointer hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <Database className="w-5 h-5 text-[#6644FF]" />
            </div>
          </div>

          {/* Icon Navigation - Directus Style */}
          <nav className="flex-1 flex flex-col items-center pt-2 space-y-1">
            {iconItems.map((item) => {
              const Icon = item.icon
              // Determine which section this icon belongs to based on href
              const itemSection = item.href === '/dashboard/settings' || item.href === '/cp/settings' ? 'settings' :
                                 item.href === '/dashboard/files' || item.href === '/cp/files' ? 'files' :
                                 item.href === '/dashboard/explore' || item.href === '/cp/explore' ? 'explore' :
                                 item.href === '/dashboard/insights' || item.href === '/cp/insights' ? 'insights' :
                                 item.href === '/dashboard/documentation' || item.href === '/cp/documentation' ? 'documentation' :
                                 item.href === '/dashboard/users' || item.href === '/cp/users' ? 'users' :
                                 item.href === '/dashboard/extensions' || item.href === '/cp/extensions' ? 'extensions' :
                                 'content'
              
              // Active state for primary icons (Directus behavior):
              // 1. Exact pathname match
              // 2. Pathname starts with item href + '/' (but not if it's a more specific section)
              // 3. Active section matches this item's section
              // Special case: /dashboard should not be active when on /dashboard/settings/*
              let isActive = false
              if (pathname === item.href) {
                isActive = true
              } else if (item.href === '/dashboard' || item.href === '/cp') {
                // Content icon: only active if on exact path or content pages (not settings/files/etc)
                isActive = (pathname === item.href || 
                           (pathname?.startsWith(item.href + '/') && 
                            !pathname?.startsWith(item.href + '/settings') &&
                            !pathname?.startsWith(item.href + '/files') &&
                            !pathname?.startsWith(item.href + '/explore') &&
                            !pathname?.startsWith(item.href + '/insights') &&
                            !pathname?.startsWith(item.href + '/documentation') &&
                            !pathname?.startsWith(item.href + '/users') &&
                            !pathname?.startsWith(item.href + '/extensions')))
              } else {
                // Other icons: active if pathname starts with href
                isActive = pathname?.startsWith(item.href + '/')
              }
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        router.push(item.href)
                        // Auto-expand sidebar when clicking primary icon (Directus behavior)
                        if (isCollapsed) {
                          onToggle()
                        }
                      }}
                      className={cn(
                        'w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#2D3748] text-white border-0 text-xs">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>

          {/* Bottom Navigation - Directus Style */}
          <div className="flex flex-col items-center pb-3 space-y-1">
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Bell className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#2D3748] text-white border-0 text-xs">
                Notifications
              </TooltipContent>
            </Tooltip>

            {/* User Profile */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-[10px] text-white font-semibold">
                          {getUserInitials()}
                        </span>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#2D3748] text-white border-0 text-xs">
                  Profile
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" side="right" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                    {isPlatformAdmin && (
                      <p className="text-xs text-primary font-medium mt-0.5">Super Admin</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isPlatformAdmin ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/cp/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Platform Settings
                      </Link>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
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
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Layer 2: Main Sidebar (Expandable/Collapsible) - Directus Style */}
        {showSecondarySidebar && (
          <div
            className={cn(
              'flex h-screen flex-col border-r border-gray-200 bg-[#F8F9FC] transition-all duration-300 ease-in-out overflow-hidden fixed left-[52px] top-0 z-40',
              shouldShowSidebar ? 'w-[220px]' : 'w-0'
            )}
          >
            {/* Project Header - Directus Style */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[#172940] text-sm truncate">
                  {isPlatformAdmin ? 'Platform Admin' : 'Tenant Dashboard'}
                </h2>
              </div>
              <p className="text-xs text-[#6644FF] truncate">
                {isPlatformAdmin ? 'Multi-tenant CMS' : 'Content Management'}
              </p>
            </div>

            {/* Global Search - Directus Style */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Global Search"
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 pl-9 pr-12 h-8 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#6644FF] focus:border-[#6644FF] transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1 rounded">
                  Ctrl+K
                </span>
              </div>
            </div>

            {/* Navigation - Directus Style: Use secondarySidebarItems from props */}
            <nav className="flex-1 overflow-y-auto px-2 pb-4">
              {secondarySidebarItems.length > 0 ? (
                secondarySidebarItems.map((item, index) => {
                  // Handle dividers - render as separator, not a link
                  if (item.divider) {
                    return <div key={item.id || `divider-${index}`} className="h-px bg-gray-200 my-2 mx-2" />
                  }

                  // Handle labels - render as non-clickable header with optional icon button
                  if (item.isLabel) {
                    // Check if next item is an icon button
                    const nextItem = secondarySidebarItems[index + 1]
                    const hasIconButton = nextItem?.isIconButton
                    
                    return (
                      <div key={item.id || `label-${index}`} className="px-2 py-1.5 mt-2 mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {item.name}
                        </span>
                        {hasIconButton && nextItem && (
                          <button
                            onClick={() => {
                              if (onSidebarItemClick) {
                                onSidebarItemClick(nextItem)
                              } else if (nextItem.iconButtonAction) {
                                nextItem.iconButtonAction()
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                            title={nextItem.name}
                          >
                            {typeof nextItem.icon === 'string' && nextItem.icon === 'Plus' ? (
                              <Plus className="w-4 h-4" strokeWidth={2} />
                            ) : nextItem.icon ? (
                              (() => {
                                const IconComp = typeof nextItem.icon === 'string' 
                                  ? getIconComponent(nextItem.icon) || Plus
                                  : nextItem.icon
                                return IconComp ? <IconComp className="w-4 h-4" strokeWidth={2} /> : null
                              })()
                            ) : null}
                          </button>
                        )}
                      </div>
                    )
                  }

                  // Handle icon-only buttons - skip rendering as they're handled by the label above
                  if (item.isIconButton) {
                    return null // Icon button is rendered as part of the label
                  }

                  // Get icon component (can be string name or React component)
                  let IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }> | null = null
                  if (typeof item.icon === 'string') {
                    // Use common icon library
                    IconComponent = getIconComponent(item.icon) || getDefaultIcon()
                  } else if (item.icon) {
                    IconComponent = item.icon as React.ComponentType<{ className?: string; style?: React.CSSProperties; strokeWidth?: number }>
                  } else {
                    IconComponent = getDefaultIcon() // Default icon for content types
                  }

                  // Determine href (use path or href)
                  const itemHref = item.href || item.path || ''
                  
                  // Directus pattern: Active if pathname includes item.id OR pathname starts with item path
                  // Also check if item has isActive property (for React state-based routing)
                  const isActive = (item as any).isActive || 
                                 pathname?.includes(item.id) || 
                                 (itemHref && pathname?.startsWith(itemHref)) ||
                                 false

                  // Handle items with children (expandable)
                  const hasChildren = item.hasChildren && item.children && item.children.length > 0
                  
                  return (
                    <div key={item.id || `item-${index}`}>
                      <button
                        onClick={() => {
                          // If custom click handler provided, use it (for React state-based routing)
                          if (onSidebarItemClick) {
                            onSidebarItemClick(item)
                            return
                          }
                          
                          // Otherwise, use default Next.js navigation
                          if (hasChildren) {
                            // Toggle expand (would need state management)
                            // For now, just navigate
                            if (itemHref) router.push(itemHref)
                          } else {
                            // Navigate to item path
                            if (itemHref) {
                              router.push(itemHref)
                            } else if (item.id) {
                              // Fallback: navigate to /content/{id} or /dashboard/{id}
                              router.push(`${basePath}/${item.id}`)
                            }
                          }
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-left transition-all duration-150',
                          isActive
                            ? 'bg-[#EDE9FE] text-[#6644FF]'
                            : 'text-gray-700 hover:bg-gray-100',
                          item.indent ? 'ml-4' : ''
                        )}
                      >
                        {hasChildren && (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        )}
                        {IconComponent && (
                          <IconComponent 
                            className="w-4 h-4 flex-shrink-0" 
                            style={{ color: item.color || (isActive ? '#6644FF' : '#9CA3AF') }}
                            strokeWidth={1.5}
                          />
                        )}
                        <span className="text-sm truncate flex-1">{item.name}</span>
                        {item.itemCount !== undefined && item.itemCount > 0 && (
                          <span className="text-xs text-gray-400">{item.itemCount}</span>
                        )}
                      </button>
                      {/* Render children if expanded (would need state) */}
                    </div>
                  )
                })
              ) : (
                // Fallback: Show settings submenu if on settings page and no items provided
                (pathname?.startsWith('/dashboard/settings') || pathname?.startsWith('/cp/settings')) && !isPlatformAdmin ? (
                  settingsSubmenuItems
                    .filter(item => {
                      if (!item.requiredRoles || item.requiredRoles.length === 0) return true
                      return item.requiredRoles.some(role => 
                        user?.roles?.some(userRole => userRole.toLowerCase() === role.toLowerCase())
                      )
                    })
                    .map((item, index) => {
                      if (item.divider) {
                        return <div key={`divider-${index}`} className="h-px bg-gray-200 my-2 mx-2" />
                      }
                      const Icon = item.icon
                      const itemHref = item.path || ''
                      const isActive = pathname === itemHref || pathname?.startsWith(itemHref + '/')
                      
                      if (!itemHref) return null
                      
                      return (
                        <Link
                          key={item.id || item.path || `nav-${index}`}
                          href={itemHref}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-left transition-all duration-150',
                            isActive
                              ? 'bg-[#EDE9FE] text-[#6644FF]'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <Icon 
                            className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#6644FF]" : "text-[#9CA3AF]")}
                          />
                          <span className="text-sm truncate flex-1">{item.name}</span>
                        </Link>
                      )
                    })
                ) : (
                  // Show main navigation as fallback
                  navigation.map((item, index) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    
                    return (
                      <Link
                        key={item.path || `nav-${index}`}
                        href={item.href}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5 text-left transition-all duration-150',
                          isActive
                            ? 'bg-[#EDE9FE] text-[#6644FF]'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Icon 
                          className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-[#6644FF]" : "text-[#9CA3AF]")}
                        />
                        <span className="text-sm truncate flex-1">{item.name}</span>
                      </Link>
                    )
                  })
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
