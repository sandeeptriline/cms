/**
 * Menu items configuration for different user types
 * 
 * Based on requirements:
 * - Super Admin: Platform-level management
 * - Tenant Users: Role-based access (Admin, Editor, Reviewer, Author, API Consumer)
 */

import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Shield,
  Database,
  GitBranch,
  Lock,
  Palette,
  Bookmark,
  Languages,
  Sparkles,
  Store,
  Puzzle,
  FileCode,
  Bug,
  Lightbulb,
  Info,
  Folder,
  Image,
  Search,
  BarChart2,
  FileText,
} from 'lucide-react'
import { ROLES } from './roles'

export interface MenuItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  requiredRoles?: string[] // Roles that can access this item
  requiredPermissions?: string[] // Permissions required (future)
  divider?: boolean // Add divider before this item
  section?: string // Section grouping (settings, configuration, extensions, system, info)
}

export interface SettingsMenuItem extends MenuItem {
  id: string
}

/**
 * Super Admin Menu Items (Platform Admin)
 * Access: Only Super Admin users
 * Base Path: /cp
 * 
 * Structure:
 * 1. Platform Management: Dashboard, Tenants, Tenant Users (aggregated)
 * 2. Platform Libraries: Templates that tenants clone/use (Schema, Content, Component, Theme)
 * 3. Settings: Platform configuration
 * 
 * IMPORTANT CLARIFICATIONS:
 * 
 * - "Tenant Users" (/cp/tenant-users):
 *   * Shows ALL tenant users across ALL tenants (aggregated view)
 *   * Different from Tenants → [Tenant] → Users tab (which shows users for ONE tenant)
 *   * Use case: "Show me all users with email 'admin' across all tenants"
 * 
 * - "Tenants" → [Tenant Detail] → Users Tab:
 *   * Shows users for ONE specific tenant
 *   * Use case: "Show me all users in Tenant ABC"
 * 
 * - Libraries (Schema, Content, Component, Theme):
 *   * These are PLATFORM-LEVEL TEMPLATES (not tenant-specific)
 *   * Super Admin creates templates here
 *   * Tenants CLONE/USE these templates to create their own instances
 *   * Tenant-specific instances are managed in tenant dashboard (/dashboard/*)
 * 
 * - Super Admin User Management:
 *   * Only one Super Admin user exists (in platform database)
 *   * Management would be in Settings or a separate section
 */
export const superAdminMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/cp',
    icon: LayoutDashboard,
  },
  {
    name: 'Tenants',
    path: '/cp/tenants',
    icon: Building2,
    // Each tenant has a "Users" tab for managing that tenant's users
  },
  {
    name: 'Platform Users',
    path: '/cp/platform-users',
    icon: Users,
    // Platform-level users with role-based access
    // Can create multiple platform users with different roles
  },
  {
    name: 'Settings',
    path: '/cp/settings',
    icon: Settings,
    // Platform settings and Super Admin user management
  },
]

/**
 * Tenant User Menu Items
 * Access: Based on user roles
 * Base Path: /dashboard
 */

// Admin: Full access to all tenant features
// Menu structure matches Directus: Content, Files, Explore, Insights, Documentation, Users, Extensions, Settings
const adminMenuItems: MenuItem[] = [
  {
    name: 'Content',
    path: '/dashboard',
    icon: Folder,
    requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR],
  },
  {
    name: 'File Library',
    path: '/dashboard/files',
    icon: Image,
    requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR],
  },
  {
    name: 'Explore',
    path: '/dashboard/explore',
    icon: Search,
    requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR],
  },
  {
    name: 'Insights',
    path: '/dashboard/insights',
    icon: BarChart2,
    requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER],
  },
  {
    name: 'Documentation',
    path: '/dashboard/documentation',
    icon: FileText,
    requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR],
  },
  {
    name: 'User Directory',
    path: '/dashboard/users',
    icon: Users,
    requiredRoles: [ROLES.ADMIN],
  },
  {
    name: 'Extensions',
    path: '/dashboard/extensions',
    icon: Puzzle,
    requiredRoles: [ROLES.ADMIN],
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Settings,
    requiredRoles: [ROLES.ADMIN],
  },
]

/**
 * Settings Submenu Items (shown in secondary sidebar when on Settings pages)
 * Matches Directus Settings menu structure
 */
export const settingsSubmenuItems: SettingsMenuItem[] = [
  // Settings Section
  { id: 'data_model', name: 'Data Model', path: '/dashboard/settings/data-model', icon: Database, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'flows', name: 'Flows', path: '/dashboard/settings/flows', icon: GitBranch, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'user_roles', name: 'User Roles', path: '/dashboard/roles', icon: Shield, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'access_policies', name: 'Access Policies', path: '/dashboard/settings/access-policies', icon: Lock, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'divider1', name: '', path: '', icon: Settings, divider: true, section: 'divider' },
  // Configuration Section
  { id: 'settings_main', name: 'Settings', path: '/dashboard/settings', icon: Settings, section: 'configuration', requiredRoles: [ROLES.ADMIN] },
  { id: 'appearance', name: 'Appearance', path: '/dashboard/settings/appearance', icon: Palette, section: 'configuration', requiredRoles: [ROLES.ADMIN] },
  { id: 'bookmarks', name: 'Bookmarks', path: '/dashboard/settings/bookmarks', icon: Bookmark, section: 'configuration', requiredRoles: [ROLES.ADMIN] },
  { id: 'translations', name: 'Translations', path: '/dashboard/settings/translations', icon: Languages, section: 'configuration', requiredRoles: [ROLES.ADMIN] },
  { id: 'ai', name: 'AI', path: '/dashboard/settings/ai', icon: Sparkles, section: 'configuration', requiredRoles: [ROLES.ADMIN] },
  { id: 'divider2', name: '', path: '', icon: Settings, divider: true, section: 'divider' },
  // Extensions Section
  { id: 'marketplace', name: 'Marketplace', path: '/dashboard/settings/marketplace', icon: Store, section: 'extensions', requiredRoles: [ROLES.ADMIN] },
  { id: 'extensions', name: 'Extensions', path: '/dashboard/settings/extensions', icon: Puzzle, section: 'extensions', requiredRoles: [ROLES.ADMIN] },
  { id: 'divider3', name: '', path: '', icon: Settings, divider: true, section: 'divider' },
  // System Section
  { id: 'system_logs', name: 'System Logs', path: '/dashboard/settings/system-logs', icon: FileCode, section: 'system', requiredRoles: [ROLES.ADMIN] },
  { id: 'report_bug', name: 'Report Bug', path: '/dashboard/settings/report-bug', icon: Bug, section: 'system', requiredRoles: [ROLES.ADMIN] },
  { id: 'request_feature', name: 'Request Feature', path: '/dashboard/settings/request-feature', icon: Lightbulb, section: 'system', requiredRoles: [ROLES.ADMIN] },
  { id: 'divider4', name: '', path: '', icon: Settings, divider: true, section: 'divider' },
  // Info Section
  { id: 'version', name: 'CMS Platform 1.0.0', path: '', icon: Info, section: 'info', requiredRoles: [ROLES.ADMIN] },
]

// Editor: Content creation and editing, no schema/user management
const editorMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: [ROLES.EDITOR],
  },
]

// Reviewer: Review and approval only
const reviewerMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: [ROLES.REVIEWER],
  },
]

// Author: Create drafts only, no publish
const authorMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: [ROLES.AUTHOR],
  },
]

// API Consumer: Read-only API access
const apiConsumerMenuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    requiredRoles: [ROLES.API_CONSUMER],
  },
]

/**
 * Get menu items for a tenant user based on their roles
 */
export function getTenantUserMenuItems(userRoles?: string[]): MenuItem[] {
  if (!userRoles || userRoles.length === 0) {
    return []
  }

  const allMenuItems: MenuItem[] = [
    ...adminMenuItems,
    ...editorMenuItems,
    ...reviewerMenuItems,
    ...authorMenuItems,
    ...apiConsumerMenuItems,
  ]

  // Filter menu items based on user roles
  const accessibleItems = allMenuItems.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true
    }
    // User must have at least one of the required roles
    return item.requiredRoles.some((requiredRole) =>
      userRoles.some(
        (userRole) => userRole.toLowerCase() === requiredRole.toLowerCase()
      )
    )
  })

  // Remove duplicates (same path) and keep the first occurrence
  const uniqueItems = accessibleItems.reduce((acc, item) => {
    if (!acc.find((existing) => existing.path === item.path)) {
      acc.push(item)
    }
    return acc
  }, [] as MenuItem[])

  // Sort by a predefined order (Dashboard first, then alphabetically)
  return uniqueItems.sort((a, b) => {
    if (a.path === '/dashboard') return -1
    if (b.path === '/dashboard') return 1
    return a.name.localeCompare(b.name)
  })
}

/**
 * Get icon sidebar items based on user context
 */
export interface IconSidebarItem {
  icon: React.ComponentType<{ className?: string }>
  href: string
  title: string
  requiredRoles?: string[]
}

export const superAdminIconItems: IconSidebarItem[] = [
  { icon: LayoutDashboard, href: '/cp', title: 'Dashboard' },
  { icon: Building2, href: '/cp/tenants', title: 'Tenants' },
  { icon: Users, href: '/cp/platform-users', title: 'Platform Users' },
  { icon: Settings, href: '/cp/settings', title: 'Settings' },
]

export function getTenantUserIconItems(userRoles?: string[]): IconSidebarItem[] {
  if (!userRoles || userRoles.length === 0) {
    return []
  }

  // Directus-style icon sidebar: Content, File Library, Explore, Insights, Documentation, User Directory, Extensions, Settings
  const allItems: IconSidebarItem[] = [
    { icon: Folder, href: '/dashboard', title: 'Content', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Image, href: '/dashboard/files', title: 'File Library', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Search, href: '/dashboard/explore', title: 'Explore', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: BarChart2, href: '/dashboard/insights', title: 'Insights', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER] },
    { icon: FileText, href: '/dashboard/documentation', title: 'Documentation', requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Users, href: '/dashboard/users', title: 'User Directory', requiredRoles: [ROLES.ADMIN] },
    { icon: Puzzle, href: '/dashboard/extensions', title: 'Extensions', requiredRoles: [ROLES.ADMIN] },
    { icon: Settings, href: '/dashboard/settings', title: 'Settings', requiredRoles: [ROLES.ADMIN] },
  ]

  return allItems.filter((item) => {
    if (!item.requiredRoles || item.requiredRoles.length === 0) {
      return true
    }
    return item.requiredRoles.some((requiredRole) =>
      userRoles.some(
        (userRole) => userRole.toLowerCase() === requiredRole.toLowerCase()
      )
    )
  })
}
