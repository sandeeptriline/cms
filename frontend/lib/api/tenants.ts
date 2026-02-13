import { apiClient } from './client'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'provisioning' | 'active' | 'suspended' | 'deleted'
  dbName: string
  parentId?: string | null
  dbHost?: string | null
  dbConnection?: string | null
  config?: Record<string, unknown>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
  storageUsed?: string | null
  storageLimit?: string | null
  apiCallsToday?: number | null
  apiCallsLimit?: number | null
  usersCount?: number | null
  usersLimit?: number | null
  lastActivityAt?: string | null
  provisionedAt?: string | null
  createdAt: string
  updatedAt: string
}

/** Normalize backend response (snake_case from Prisma) to camelCase */
function normalizeTenant(raw: Record<string, unknown>): Tenant {
  return {
    id: String(raw.id),
    name: String(raw.name),
    slug: String(raw.slug),
    status: (raw.status as Tenant['status']) ?? 'provisioning',
    dbName: String((raw.dbName ?? raw.db_name) ?? ''),
    parentId: (raw.parentId ?? raw.parent_id) as string | null | undefined,
    dbHost: (raw.dbHost ?? raw.db_host) as string | null | undefined,
    dbConnection: (raw.dbConnection ?? raw.db_connection) as string | null | undefined,
    config: raw.config as Tenant['config'],
    featureFlags: (raw.featureFlags ?? raw.feature_flags) as Tenant['featureFlags'],
    usageLimits: (raw.usageLimits ?? raw.usage_limits) as Tenant['usageLimits'],
    storageUsed: (raw.storageUsed ?? (raw.storage_used != null ? String(raw.storage_used) : null)) as string | null | undefined,
    storageLimit: (raw.storageLimit ?? (raw.storage_limit != null ? String(raw.storage_limit) : null)) as string | null | undefined,
    apiCallsToday: (raw.apiCallsToday ?? raw.api_calls_today) as number | null | undefined,
    apiCallsLimit: (raw.apiCallsLimit ?? raw.api_calls_limit) as number | null | undefined,
    usersCount: (raw.usersCount ?? raw.users_count) as number | null | undefined,
    usersLimit: (raw.usersLimit ?? raw.users_limit) as number | null | undefined,
    lastActivityAt: (raw.lastActivityAt ?? (raw.last_activity_at != null ? (typeof raw.last_activity_at === 'string' ? raw.last_activity_at : new Date(raw.last_activity_at).toISOString()) : null)) as string | null | undefined,
    provisionedAt: (raw.provisionedAt ?? (raw.provisioned_at != null ? (typeof raw.provisioned_at === 'string' ? raw.provisioned_at : new Date(raw.provisioned_at).toISOString()) : null)) as string | null | undefined,
    createdAt: typeof (raw.createdAt ?? raw.created_at) === 'string' 
      ? (raw.createdAt ?? raw.created_at) as string
      : new Date(raw.createdAt ?? raw.created_at).toISOString(),
    updatedAt: typeof (raw.updatedAt ?? raw.updated_at) === 'string'
      ? (raw.updatedAt ?? raw.updated_at) as string
      : new Date(raw.updatedAt ?? raw.updated_at).toISOString(),
  }
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
    const response = await apiClient.get<Record<string, unknown>[]>('/tenants')
    return response.data.map((row) => normalizeTenant(row))
  },

  async getById(id: string): Promise<Tenant> {
    const response = await apiClient.get<Record<string, unknown>>(`/tenants/${id}`)
    return normalizeTenant(response.data)
  },

  async getBySlug(slug: string): Promise<Tenant> {
    const response = await apiClient.get<Record<string, unknown>>(`/tenants/slug/${slug}`)
    return normalizeTenant(response.data)
  },

  async create(data: CreateTenantDto): Promise<Tenant> {
    const response = await apiClient.post<Record<string, unknown>>('/tenants', data)
    return normalizeTenant(response.data)
  },

  async update(id: string, data: UpdateTenantDto): Promise<Tenant> {
    const response = await apiClient.patch<Record<string, unknown>>(`/tenants/${id}`, data)
    return normalizeTenant(response.data)
  },

  async activate(id: string): Promise<Tenant> {
    const response = await apiClient.patch<Record<string, unknown>>(`/tenants/${id}/activate`)
    return normalizeTenant(response.data)
  },

  async suspend(id: string): Promise<Tenant> {
    const response = await apiClient.patch<Record<string, unknown>>(`/tenants/${id}/suspend`)
    return normalizeTenant(response.data)
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tenants/${id}`)
  },
}
