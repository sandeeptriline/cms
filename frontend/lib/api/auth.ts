import { apiClient } from './client'

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name?: string
    roles?: string[]
    tenantId?: string | null // Can be null for Super Admin
  }
}

export interface User {
  id: string
  email: string
  name?: string
  tenantId: string | null // Can be null for Super Admin
  roles?: string[]
}

export const authApi = {
  /**
   * Platform Admin Login (Super Admin)
   * No tenant ID required
   */
  async platformAdminLogin(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/platform-admin/login', data)
    return response.data
  },

  /**
   * Tenant User Login (Email + Password Only)
   * Automatically finds tenant by searching across tenant databases
   * No tenant ID required
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Tenant User Login with Tenant ID (Legacy)
   * Use login() instead - this is for backward compatibility
   */
  async loginWithTenant(data: LoginDto, tenantId: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login/tenant', data, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    })
    return response.data
  },

  async register(data: RegisterDto, tenantId: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    })
    return response.data
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  /**
   * Refresh Token
   * Supports both Super Admin (tenantId can be null) and tenant users
   */
  async refreshToken(refreshToken: string, tenantId: string | null = null): Promise<AuthResponse> {
    const headers: Record<string, string> = {}
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId
    }
    
    const response = await apiClient.post<AuthResponse>(
      '/auth/refresh',
      { refreshToken },
      { headers }
    )
    return response.data
  },
}
