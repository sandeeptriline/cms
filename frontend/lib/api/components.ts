import { apiClient } from './client'

export interface ComponentField {
  id: string
  component_id: string
  name: string
  type: string
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface Component {
  id: string
  project_id: string
  name: string
  slug: string
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string
  fields: ComponentField[]
}

export interface CreateComponentDto {
  projectId: string
  name: string
  slug: string
  config?: Record<string, unknown>
  fields?: { name: string; type: string; config?: Record<string, unknown> }[]
}

export interface UpdateComponentDto {
  name?: string
  slug?: string
  config?: Record<string, unknown>
}

export interface CreateComponentFieldDto {
  name: string
  type: string
  required?: boolean
  config?: Record<string, unknown>
}

export interface UpdateComponentFieldDto {
  name?: string
  type?: string
  required?: boolean
  config?: Record<string, unknown>
}

export const componentsApi = {
  async getAll(projectId: string): Promise<Component[]> {
    const response = await apiClient.get<Component[]>(`/components?projectId=${projectId}`)
    return response.data
  },

  async getById(id: string): Promise<Component> {
    const response = await apiClient.get<Component>(`/components/${id}`)
    return response.data
  },

  async create(data: CreateComponentDto): Promise<Component> {
    const response = await apiClient.post<Component>('/components', data)
    return response.data
  },

  async update(id: string, data: UpdateComponentDto): Promise<Component> {
    const response = await apiClient.put<Component>(`/components/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/components/${id}`)
  },

  async addField(componentId: string, dto: CreateComponentFieldDto): Promise<Component> {
    const response = await apiClient.post<Component>(`/components/${componentId}/fields`, dto)
    return response.data
  },

  async updateField(
    componentId: string,
    fieldId: string,
    dto: UpdateComponentFieldDto,
  ): Promise<Component> {
    const response = await apiClient.put<Component>(
      `/components/${componentId}/fields/${fieldId}`,
      dto,
    )
    return response.data
  },

  async deleteField(componentId: string, fieldId: string): Promise<Component> {
    const response = await apiClient.delete<Component>(
      `/components/${componentId}/fields/${fieldId}`,
    )
    return response.data
  },

  async updateFieldOrder(
    componentId: string,
    fieldOrders: Array<{ id: string; sort: number }>,
  ): Promise<Component> {
    const response = await apiClient.put<Component>(
      `/components/${componentId}/fields/order`,
      fieldOrders,
    )
    return response.data
  },
}
