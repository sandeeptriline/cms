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
  FolderKanban,
  Plus,
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

// Tenant left menu when a project is selected: Home, Content, Media, Content Models, Settings
const TENANT_ADMIN = 'Tenant Admin'
const adminMenuItems: MenuItem[] = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard, requiredRoles: [ROLES.ADMIN, TENANT_ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
  { name: 'Content', path: '/dashboard', icon: Folder, requiredRoles: [ROLES.ADMIN, TENANT_ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
  { name: 'Media', path: '/dashboard/files', icon: Image, requiredRoles: [ROLES.ADMIN, TENANT_ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
  { name: 'Content Models', path: '/dashboard/settings/projects', icon: Database, requiredRoles: [ROLES.ADMIN, TENANT_ADMIN] },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings, requiredRoles: [ROLES.ADMIN, TENANT_ADMIN] },
]

/**
 * Settings Submenu Items (shown in secondary sidebar when on Settings pages)
 * Matches Directus Settings menu structure
 * 
 * Note: Project-scoped routes (data-model, flows, access-policies, locales) will be
 * dynamically generated with the current project ID via getSettingsSubmenuItems()
 */
export const settingsSubmenuItems: SettingsMenuItem[] = [
  // Settings Section
  { id: 'projects', name: 'Projects', path: '/dashboard/settings/projects', icon: FolderKanban, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'divider_projects', name: '', path: '', icon: Settings, divider: true, section: 'divider' },
  { id: 'data_model', name: 'Content Model', path: '/dashboard/settings/data-model', icon: Database, section: 'settings', requiredRoles: [ROLES.ADMIN] },
  { id: 'data_model_manager', name: 'Content Model Manager', path: '/dashboard/settings/data-model-manager', icon: FileText, section: 'settings', requiredRoles: [ROLES.ADMIN] },
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

/**
 * Project-scoped Settings submenu (left sidebar when a project is open).
 * Order: Flows, User Roles, Access Policies, Settings, Appearance, Bookmarks, Translations, AI, Marketplace, Extensions, System Logs, Report Bug, Request Feature.
 * When tenantSlug and projectSlug are provided, paths use /[tenantSlug]/[projectSlug]/settings/...; else dashboard paths.
 */
export function getProjectSettingsSubmenuItems(
  projectId: string,
  options?: { tenantSlug?: string | null; projectSlug?: string | null }
): SectionSubmenuItem[] {
  const useBase = options?.tenantSlug && options?.projectSlug
  const base = useBase ? `/${options.tenantSlug}/${options.projectSlug}/settings` : `/dashboard/settings/projects/${projectId}`
  const dashRoot = '/dashboard'
  return [
    { id: 'flows', name: 'Flows', path: `${base}/flows`, icon: GitBranch },
    { id: 'divider_flows', name: '', path: '', icon: Settings, divider: true },
    { id: 'user_roles', name: 'User Roles', path: useBase ? `${base}/roles` : `${dashRoot}/roles`, icon: Shield },
    { id: 'access_policies', name: 'Access Policies', path: useBase ? `${base}/policies` : `${base}/access-policies`, icon: Lock },
    { id: 'divider_policies', name: '', path: '', icon: Settings, divider: true },
    { id: 'settings_project', name: 'Settings', path: useBase ? `${base}/project` : `${dashRoot}/settings`, icon: Settings },
    { id: 'appearance', name: 'Appearance', path: useBase ? `${base}/appearance` : `${dashRoot}/settings/appearance`, icon: Palette },
    { id: 'bookmarks', name: 'Bookmarks', path: useBase ? `${base}/presets` : `${dashRoot}/settings/bookmarks`, icon: Bookmark },
    { id: 'translations', name: 'Translations', path: useBase ? `${base}/translations` : `${base}/locales`, icon: Languages },
    { id: 'ai', name: 'AI', path: useBase ? `${base}/ai` : `${dashRoot}/settings/ai`, icon: Sparkles },
    { id: 'divider_ext', name: '', path: '', icon: Settings, divider: true },
    { id: 'marketplace', name: 'Marketplace', path: useBase ? `${base}/marketplace` : `${dashRoot}/settings/marketplace`, icon: Store },
    { id: 'extensions', name: 'Extensions', path: useBase ? `${base}/extensions` : `${dashRoot}/settings/extensions`, icon: Puzzle },
    { id: 'divider_system', name: '', path: '', icon: Settings, divider: true },
    { id: 'system_logs', name: 'System Logs', path: useBase ? `${base}/system-logs` : `${dashRoot}/settings/system-logs`, icon: FileCode },
    { id: 'report_bug', name: 'Report Bug', path: useBase ? `${base}/report-bug` : `${dashRoot}/settings/report-bug`, icon: Bug },
    { id: 'request_feature', name: 'Request Feature', path: useBase ? `${base}/request-feature` : `${dashRoot}/settings/request-feature`, icon: Lightbulb },
  ]
}

/**
 * Get settings submenu items with project-scoped routes
 * If projectId is provided, project-scoped routes will use the new structure:
 * /dashboard/settings/projects/[projectId]/...
 * Otherwise, project-scoped items link to projects page to select a project first
 */
export function getSettingsSubmenuItems(projectId?: string | null): SettingsMenuItem[] {
  // Return items with project-scoped routes
  return settingsSubmenuItems.map((item) => {
    // Update project-scoped routes
    if (item.id === 'data_model') {
      return { 
        ...item, 
        path: projectId 
          ? `/dashboard/settings/projects/${projectId}/data-model`
          : '/dashboard/settings/projects'
      }
    }
    if (item.id === 'data_model_manager') {
      return { 
        ...item, 
        path: projectId 
          ? `/dashboard/settings/projects/${projectId}/data-model-manager`
          : '/dashboard/settings/projects'
      }
    }
    if (item.id === 'flows') {
      return { 
        ...item, 
        path: projectId 
          ? `/dashboard/settings/projects/${projectId}/flows`
          : '/dashboard/settings/projects'
      }
    }
    if (item.id === 'access_policies') {
      return { 
        ...item, 
        path: projectId 
          ? `/dashboard/settings/projects/${projectId}/access-policies`
          : '/dashboard/settings/projects'
      }
    }
    if (item.id === 'translations') {
      return { 
        ...item, 
        path: projectId 
          ? `/dashboard/settings/projects/${projectId}/locales`
          : '/dashboard/settings/projects'
      }
    }
    return item
  })
}

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

/** Tenant left menu when project selected: Home, Content, Media, Content Models, Settings.
 * When tenantSlug and projectSlug are provided, hrefs use /[tenant-slug]/[project-slug]/dashboard etc. */
export function getTenantUserIconItems(
  userRoles?: string[],
  projectId?: string | null,
  tenantSlug?: string | null,
  projectSlug?: string | null
): IconSidebarItem[] {
  const useProjectSlug = !!(tenantSlug && projectSlug)
  const base = useProjectSlug ? `/${tenantSlug}/${projectSlug}` : ''

  const contentTypeHref = useProjectSlug
    ? `${base}/content-type`
    : projectId
      ? `/dashboard/settings/projects/${projectId}/data-model`
      : '/dashboard/settings/projects'

  const componentModelsHref = useProjectSlug
    ? `${base}/component-models`
    : projectId
      ? `/dashboard/settings/projects/${projectId}/components`
      : '/dashboard/settings/projects'

  const allItems: IconSidebarItem[] = [
    { icon: LayoutDashboard, href: useProjectSlug ? `${base}/dashboard` : '/dashboard', title: 'Home', requiredRoles: [ROLES.ADMIN, 'Tenant Admin', ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Folder, href: useProjectSlug ? `${base}/content` : '/dashboard', title: 'Content', requiredRoles: [ROLES.ADMIN, 'Tenant Admin', ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Image, href: useProjectSlug ? `${base}/media` : '/dashboard/files', title: 'Media', requiredRoles: [ROLES.ADMIN, 'Tenant Admin', ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    { icon: Database, href: contentTypeHref, title: 'Content Models', requiredRoles: [ROLES.ADMIN, 'Tenant Admin'] },
    { icon: Puzzle, href: componentModelsHref, title: 'Component Models', requiredRoles: [ROLES.ADMIN, 'Tenant Admin'] },
    { icon: Settings, href: useProjectSlug ? `${base}/settings` : '/dashboard/settings', title: 'Settings', requiredRoles: [ROLES.ADMIN, 'Tenant Admin'] },
  ]

  // When project is selected, show all items to any tenant user (even if roles not loaded yet)
  if (!userRoles || userRoles.length === 0) {
    return projectId || projectSlug ? allItems : []
  }

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

/** Submenu item shape for the expanded sidebar (matches SecondarySidebarItem) */
export interface SectionSubmenuItem {
  id: string
  name: string
  path?: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
  divider?: boolean
  requiredRoles?: string[]
}

/**
 * Get submenu items for the expanded sidebar based on the active section.
 * Left 52px bar = main sections; expanded sidebar = sub-items for the selected section only.
 */
export function getSubmenuForSection(
  sectionHref: string,
  options: {
    isPlatformAdmin: boolean
    userRoles?: string[]
    projectId?: string | null
    projectSlug?: string | null
    tenantSlug?: string | null
  }
): SectionSubmenuItem[] {
  const { isPlatformAdmin, userRoles = [], projectId, projectSlug, tenantSlug } = options

  const hasRole = (roles: string[]) =>
    roles.length === 0 || roles.some((r) => userRoles.some((ur) => ur.toLowerCase() === r.toLowerCase()))

  if (isPlatformAdmin) {
    // Platform (CP) sections – submenus
    if (sectionHref === '/cp' || sectionHref === '/cp/') {
      return [{ id: 'overview', name: 'Overview', path: '/cp', icon: LayoutDashboard }]
    }
    if (sectionHref === '/cp/tenants') {
      return [
        { id: 'all', name: 'All Tenants', path: '/cp/tenants', icon: Building2 },
        { id: 'create', name: 'Create Tenant', path: '/cp/tenants/new', icon: Plus },
      ]
    }
    if (sectionHref === '/cp/platform-users') {
      return [
        { id: 'users', name: 'Platform Users', path: '/cp/platform-users', icon: Users },
        { id: 'roles', name: 'Roles', path: '/cp/platform-users/roles', icon: Shield },
      ]
    }
    if (sectionHref === '/cp/settings') {
      return [
        { id: 'general', name: 'General', path: '/cp/settings', icon: Settings },
        { id: 'projects', name: 'Projects', path: '/cp/settings/projects', icon: FolderKanban },
      ]
    }
    return [{ id: 'overview', name: 'Overview', path: sectionHref, icon: LayoutDashboard }]
  }

  // Tenant sections – submenus (projects: only [tenantSlug]/projects)
  const projectsPath = tenantSlug ? `/${tenantSlug}/projects` : '#'
  if (sectionHref === '/dashboard/projects' || (tenantSlug && sectionHref === `/${tenantSlug}/projects`)) {
    return [{ id: 'projects', name: 'All projects', path: projectsPath, icon: FolderKanban }]
  }

  // [tenantSlug]/[projectSlug]/... section hrefs (project-scoped nav)
  if (tenantSlug && projectSlug && projectId) {
    const base = `/${tenantSlug}/${projectSlug}`
    if (sectionHref === `${base}/dashboard` || sectionHref?.startsWith(`${base}/dashboard/`)) {
      return [
        { id: 'home', name: 'Home', path: `${base}/dashboard`, icon: LayoutDashboard },
        { id: 'content', name: 'Content', path: `${base}/content`, icon: Folder },
      ]
    }
    if (sectionHref === `${base}/content` || sectionHref?.startsWith(`${base}/content/`)) {
      return [{ id: 'content', name: 'Content', path: `${base}/content`, icon: Folder }]
    }
    if (sectionHref === `${base}/media` || sectionHref?.startsWith(`${base}/media/`)) {
      return [
        { id: 'media', name: 'Media', path: `${base}/media`, icon: Image },
        { id: 'uploads', name: 'Uploads', path: `${base}/media/uploads`, icon: Folder, requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
      ]
    }
    if (sectionHref === `${base}/content-type` || sectionHref?.startsWith(`${base}/content-type/`)) {
      return [{ id: 'content-type', name: 'Content Models', path: `${base}/content-type`, icon: Database }]
    }
    if (sectionHref === `${base}/component-models` || sectionHref?.startsWith(`${base}/component-models/`)) {
      return [{ id: 'component-models', name: 'Component Models', path: `${base}/component-models`, icon: Puzzle }]
    }
    if (sectionHref === `${base}/settings` || sectionHref?.startsWith(`${base}/settings/`)) {
      return getProjectSettingsSubmenuItems(projectId, { tenantSlug, projectSlug })
    }
  }

  if (sectionHref === '/dashboard' || sectionHref === '/dashboard/') {
    return [
      { id: 'home', name: 'Home', path: '/dashboard', icon: LayoutDashboard },
      { id: 'content', name: 'Content', path: '/dashboard', icon: Folder },
    ]
  }
  if (sectionHref === '/dashboard/files') {
    return [
      { id: 'media', name: 'Media', path: '/dashboard/files', icon: Image },
      { id: 'uploads', name: 'Uploads', path: '/dashboard/files/uploads', icon: Folder, requiredRoles: [ROLES.ADMIN, ROLES.EDITOR, ROLES.REVIEWER, ROLES.AUTHOR] },
    ]
  }
  if (projectId && sectionHref === `/dashboard/settings/projects/${projectId}/data-model`) {
    return [
      { id: 'data-model', name: 'Content Model', path: sectionHref, icon: Database },
      { id: 'data-model-manager', name: 'Entries', path: `/dashboard/settings/projects/${projectId}/data-model-manager`, icon: FileText },
    ]
  }
  if (sectionHref?.startsWith('/dashboard/settings/projects/') && sectionHref?.includes('/data-model')) {
    return [{ id: 'content-type', name: 'Content Models', path: sectionHref, icon: Database }]
  }
  if (sectionHref === '/dashboard/settings') {
    // When a project is selected, show project-scoped settings submenu (Flows, User Roles, Access Policies, etc.)
    if (projectId) {
      return getProjectSettingsSubmenuItems(projectId, { tenantSlug: tenantSlug ?? null, projectSlug: projectSlug ?? null })
    }
    const settingsItems = getSettingsSubmenuItems(projectId)
      .filter((item) => item.requiredRoles?.length ? hasRole(item.requiredRoles) : true)
      .map((item) => ({ id: item.id, name: item.name, path: item.path, icon: item.icon, divider: item.divider }))
    return settingsItems
  }

  return [{ id: 'overview', name: 'Overview', path: sectionHref, icon: LayoutDashboard }]
}

/** Resolve which section href is active from pathname (for submenu lookup).
 * When pathnameNormalized is provided (e.g. tenant path /[slug]/dashboard -> /dashboard), matches against both
 * so tenant URLs and dashboard URLs both resolve to the correct section. */
export function getActiveSectionHref(
  pathname: string | null,
  iconItems: { href: string }[],
  pathnameNormalized?: string | null
): string | null {
  if (!pathname && !pathnameNormalized) return null
  const matches = (p: string, href: string) =>
    p === href || (href.length > 0 && p.startsWith(href + '/'))
  // Prefer longest match so /dashboard/settings/projects wins over /dashboard/settings
  const sorted = [...iconItems].sort((a, b) => (b.href.length - a.href.length))
  for (const item of sorted) {
    if (pathname && matches(pathname, item.href)) return item.href
    if (pathnameNormalized && matches(pathnameNormalized, item.href)) return item.href
  }
  return null
}
