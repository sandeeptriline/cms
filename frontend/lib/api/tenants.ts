import { apiClient } from './client'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'provisioning' | 'active' | 'suspended' | 'deleted'
  dbName: string
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateTenantDto {
  name: string
  slug: string
  parentId?: string
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  status?: 'provisioning' | 'active' | 'suspended' | 'deleted'
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
}

export const tenantsApi = {
  async getAll(): Promise<Tenant[]> {
    const response = await apiClient.get<Tenant[]>('/tenants')
    return response.data
  },

  async getById(id: string): Promise<Tenant> {
    const response = await apiClient.get<Tenant>(`/tenants/${id}`)
    return response.data
  },

  async getBySlug(slug: string): Promise<Tenant> {
    const response = await apiClient.get<Tenant>(`/tenants/slug/${slug}`)
    return response.data
  },

  async create(data: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post<Tenant>('/tenants', data)
    return response.data
  },

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/tenants/${id}`, data)
    return response.data
  },

  async activate(id: string): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/tenants/${id}/activate`)
    return response.data
  },

  async suspend(id: string): Promise<Tenant> {
    const response = await apiClient.patch<Tenant>(`/tenants/${id}/suspend`)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tenants/${id}`)
  },
}
