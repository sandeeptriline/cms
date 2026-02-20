import { apiClient } from './client'

export interface ContentType {
  id: string
  name: string
  collection: string
  icon?: string
  fields?: number
  submissions?: number
  isActive?: boolean
  isSystem: boolean
  singleton: boolean
  hidden: boolean
  note?: string
  createdAt: string
  updatedAt: string
}

export interface ContentTypesResponse {
  data: ContentType[]
  meta?: {
    total: number
    count: number
  }
}

export const contentApi = {
  /**
   * Get all content types for the current tenant
   * TODO: Backend endpoint needs to be implemented at GET /api/content-types
   */
  async getAll(): Promise<ContentTypesResponse> {
    const response = await apiClient.get<ContentTypesResponse>('/content-types')
    return response.data
  },

  /**
   * Get a single content type by ID
   * TODO: Backend endpoint needs to be implemented at GET /api/content-types/:id
   */
  async getById(id: string): Promise<ContentType> {
    const response = await apiClient.get<ContentType>(`/content-types/${id}`)
    return response.data
  },
}
