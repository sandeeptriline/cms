import { apiClient } from './client'

export interface TenantUser {
  id: string
  email: string
  name?: string | null
  status: number // 1 = active, 0 = inactive, -1 = deleted
  avatar?: string | null
  tenantId: string
  tenantName: string
  tenantSlug: string
  roles?: string[]
  lastLoginAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

/** Normalize backend response (snake_case from Prisma) to camelCase */
function normalizeTenantUser(raw: Record<string, unknown>): TenantUser {
  return {
    id: String(raw.id || ''),
    email: String(raw.email || ''),
    name: raw.name ? String(raw.name) : null,
    status: (() => {
      // Handle number
      if (typeof raw.status === 'number') return raw.status
      // Handle string numbers
      if (typeof raw.status === 'string') {
        const numStatus = Number(raw.status)
        if (!isNaN(numStatus)) return numStatus
        // Handle legacy string values
        if (raw.status === 'active') return 1
        if (raw.status === 'inactive') return 0
        return -1
      }
      // Default to inactive if status is missing or invalid
      return 0
    })(),
    avatar: raw.avatar ? String(raw.avatar) : null,
    tenantId: String(raw.tenantId || ''),
    tenantName: String(raw.tenantName || ''),
    tenantSlug: String(raw.tenantSlug || ''),
    roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
    lastLoginAt: raw.lastLoginAt ? new Date(String(raw.lastLoginAt)) : null,
    createdAt: raw.createdAt ? new Date(String(raw.createdAt)) : new Date(),
    updatedAt: raw.updatedAt ? new Date(String(raw.updatedAt)) : new Date(),
  }
}

export interface TenantRole {
  id: string
  name: string
  description: string | null
}

export interface CreateTenantUserDto {
  email: string
  password: string
  name?: string
  status?: number // 1 = active, 0 = inactive, -1 = deleted
  roleIds?: string[]
}

export interface UpdateTenantUserDto {
  email?: string
  password?: string
  name?: string
  status?: number // 1 = active, 0 = inactive, -1 = deleted
  roleIds?: string[]
}

export interface TenantUserFilters {
  tenantId?: string
  email?: string
  status?: number // 1 = active, 0 = inactive, -1 = deleted
  role?: string
  page?: number
  limit?: number
}

export const tenantUsersApi = {
  /**
   * Get all tenant users across all tenants
   * @param filters Optional filters for tenant ID, email, status, role, pagination
   */
  async getAll(filters?: TenantUserFilters): Promise<TenantUser[]> {
    const params = new URLSearchParams()
    if (filters?.tenantId) params.append('tenantId', filters.tenantId)
    if (filters?.email) params.append('email', filters.email)
    if (filters?.status !== undefined) params.append('status', String(filters.status))
    if (filters?.role) params.append('role', filters.role)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const queryString = params.toString()
    const url = `/tenant-users${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get<Record<string, unknown>[]>(url)
    return response.data.map((row) => normalizeTenantUser(row))
  },

  /**
   * Get all users for a specific tenant
   * @param tenantId Tenant ID
   * @param filters Optional filters for email, status, role, pagination
   */
  async getByTenant(tenantId: string, filters?: Omit<TenantUserFilters, 'tenantId'>): Promise<TenantUser[]> {
    const params = new URLSearchParams()
    if (filters?.email) params.append('email', filters.email)
    if (filters?.status !== undefined) params.append('status', String(filters.status))
    if (filters?.role) params.append('role', filters.role)
    if (filters?.page) params.append('page', String(filters.page))
    if (filters?.limit) params.append('limit', String(filters.limit))

    const queryString = params.toString()
    const url = `/tenant-users/tenant/${tenantId}${queryString ? `?${queryString}` : ''}`
    
    const response = await apiClient.get<Record<string, unknown>[]>(url)
    return response.data.map((row) => normalizeTenantUser(row))
  },

  /**
   * Get a specific user by tenant ID and user ID
   * @param tenantId Tenant ID
   * @param userId User ID
   */
  async getById(tenantId: string, userId: string): Promise<TenantUser> {
    const response = await apiClient.get<Record<string, unknown>>(`/tenant-users/tenant/${tenantId}/user/${userId}`)
    return normalizeTenantUser(response.data)
  },

  /**
   * Create a new user in a tenant
   * @param tenantId Tenant ID
   * @param data User data
   */
  async create(tenantId: string, data: CreateTenantUserDto): Promise<TenantUser> {
    const response = await apiClient.post<Record<string, unknown>>(`/tenant-users/tenant/${tenantId}`, data)
    return normalizeTenantUser(response.data)
  },

  /**
   * Update a user in a tenant
   * @param tenantId Tenant ID
   * @param userId User ID
   * @param data User data to update
   */
  async update(tenantId: string, userId: string, data: UpdateTenantUserDto): Promise<TenantUser> {
    const response = await apiClient.put<Record<string, unknown>>(`/tenant-users/tenant/${tenantId}/user/${userId}`, data)
    return normalizeTenantUser(response.data)
  },

  /**
   * Delete a user from a tenant
   * @param tenantId Tenant ID
   * @param userId User ID
   */
  async delete(tenantId: string, userId: string): Promise<void> {
    await apiClient.delete(`/tenant-users/tenant/${tenantId}/user/${userId}`)
  },

  /**
   * Get all roles for a specific tenant
   * @param tenantId Tenant ID
   */
  async getRoles(tenantId: string): Promise<TenantRole[]> {
    const response = await apiClient.get<TenantRole[]>(`/tenant-users/tenant/${tenantId}/roles`)
    return response.data
  },

  /**
   * Get all permissions for a specific role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   */
  async getRolePermissions(tenantId: string, roleId: string): Promise<Array<{
    id: string
    name: string
    resource: string
    action: string
    category: string
    description: string | null
  }>> {
    const response = await apiClient.get<Array<{
      id: string
      name: string
      resource: string
      action: string
      category: string
      description: string | null
    }>>(`/tenant-users/tenant/${tenantId}/roles/${roleId}/permissions`)
    return response.data
  },

  /**
   * Get all available permissions in a tenant
   * @param tenantId Tenant ID
   */
  async getAllPermissions(tenantId: string): Promise<Array<{
    id: string
    name: string
    resource: string
    action: string
    category: string
    description: string | null
  }>> {
    const response = await apiClient.get<Array<{
      id: string
      name: string
      resource: string
      action: string
      category: string
      description: string | null
    }>>(`/tenant-users/tenant/${tenantId}/permissions`)
    return response.data
  },

  /**
   * Create a new role
   * @param tenantId Tenant ID
   * @param data Role data
   */
  async createRole(tenantId: string, data: { name: string; description?: string }): Promise<TenantRole> {
    const response = await apiClient.post<TenantRole>(`/tenant-users/tenant/${tenantId}/roles`, data)
    return response.data
  },

  /**
   * Update a role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @param data Role data to update
   */
  async updateRole(tenantId: string, roleId: string, data: { name?: string; description?: string }): Promise<TenantRole> {
    const response = await apiClient.put<TenantRole>(`/tenant-users/tenant/${tenantId}/roles/${roleId}`, data)
    return response.data
  },

  /**
   * Delete a role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   */
  async deleteRole(tenantId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/tenant-users/tenant/${tenantId}/roles/${roleId}`)
  },

  /**
   * Assign permissions to a role
   * @param tenantId Tenant ID
   * @param roleId Role ID
   * @param permissionIds Array of permission IDs
   */
  async assignPermissions(tenantId: string, roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.post(`/tenant-users/tenant/${tenantId}/roles/${roleId}/permissions`, {
      permissionIds,
    })
  },
}
