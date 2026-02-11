/**
 * Role-based access control utilities
 * 
 * Based on requirements.md:
 * - Super Admin: System-wide control, manages all tenants
 * - Admin: Tenant-level administration
 * - Editor, Reviewer, Author: Content management roles
 */

export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
  REVIEWER: 'Reviewer',
  AUTHOR: 'Author',
  API_CONSUMER: 'API Consumer',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

/**
 * Check if user has Super Admin role
 */
export function isSuperAdmin(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false
  return roles.some(role => 
    role.toLowerCase() === ROLES.SUPER_ADMIN.toLowerCase() ||
    role.toLowerCase() === 'superadmin' ||
    role.toLowerCase() === 'super_admin'
  )
}

/**
 * Check if user has Admin role (tenant-level)
 */
export function isAdmin(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false
  return roles.some(role => 
    role.toLowerCase() === ROLES.ADMIN.toLowerCase()
  )
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRoles?: string[], requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false
  return requiredRoles.some(requiredRole => 
    userRoles.some(userRole => 
      userRole.toLowerCase() === requiredRole.toLowerCase()
    )
  )
}

/**
 * Check if user has permission to access platform admin features
 */
export function canAccessPlatformAdmin(roles?: string[]): boolean {
  return isSuperAdmin(roles)
}
