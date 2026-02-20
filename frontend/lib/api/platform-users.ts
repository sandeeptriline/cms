import { apiClient } from './client'

export interface PlatformUser {
  id: string
  email: string
  name?: string | null
  status: number // 1 = active, 0 = inactive
  avatar?: string | null
  roles: string[]
  lastLoginAt?: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface PlatformRole {
  id: string
  name: string
  description?: string | null
  is_system?: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

/** Normalize backend response to frontend format */
function normalizePlatformUser(raw: Record<string, unknown>): PlatformUser {
  return {
    id: String(raw.id || ''),
    email: String(raw.email || ''),
    name: raw.name ? String(raw.name) : null,
    status: typeof raw.status === 'number' ? raw.status : 1,
    avatar: raw.avatar ? String(raw.avatar) : null,
    roles: Array.isArray(raw.roles) ? raw.roles.map(String) : [],
    lastLoginAt: raw.lastLoginAt ? (raw.lastLoginAt as string) : null,
    createdAt: (raw.createdAt ?? raw.created_at) as string,
    updatedAt: (raw.updatedAt ?? raw.updated_at) as string,
  }
}

export interface CreatePlatformUserDto {
  email: string
  password: string
  name?: string
  status?: number // 1 = active, 0 = inactive
  roleIds?: string[]
}

export interface UpdatePlatformUserDto {
  email?: string
  name?: string
  status?: number // 1 = active, 0 = inactive
  roleIds?: string[]
}

export interface ChangePasswordDto {
  currentPassword?: string
  newPassword: string
}

export const platformUsersApi = {
  /**
   * Get all platform users
   */
  async getAll(): Promise<PlatformUser[]> {
    const response = await apiClient.get<PlatformUser[]>('/platform-users')
    return response.data.map((u) => normalizePlatformUser(u as unknown as Record<string, unknown>))
  },

  /**
   * Get platform user by ID
   */
  async getById(id: string): Promise<PlatformUser> {
    const response = await apiClient.get<PlatformUser>(`/platform-users/${id}`)
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Get all platform roles
   */
  async getRoles(): Promise<PlatformRole[]> {
    const response = await apiClient.get<PlatformRole[]>('/platform-users/roles')
    return response.data
  },

  /**
   * Create platform user
   */
  async create(data: CreatePlatformUserDto): Promise<PlatformUser> {
    const response = await apiClient.post<PlatformUser>('/platform-users', data)
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Update platform user
   */
  async update(id: string, data: UpdatePlatformUserDto): Promise<PlatformUser> {
    const response = await apiClient.put<PlatformUser>(`/platform-users/${id}`, data)
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Delete platform user (soft delete)
   */
  async delete(id: string): Promise<PlatformUser> {
    const response = await apiClient.delete<PlatformUser>(`/platform-users/${id}`)
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Get current user profile
   */
  async getMe(): Promise<PlatformUser> {
    const response = await apiClient.get<PlatformUser>('/platform-users/me')
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Update current user profile
   */
  async updateMe(data: UpdatePlatformUserDto): Promise<PlatformUser> {
    const response = await apiClient.put<PlatformUser>('/platform-users/me', data)
    return normalizePlatformUser(response.data as unknown as Record<string, unknown>)
  },

  /**
   * Change current user password
   */
  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/platform-users/me/password', data)
    return response.data
  },
}
