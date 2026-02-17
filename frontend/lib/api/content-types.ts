import { apiClient } from './client';

export interface ContentTypeField {
  id: string;
  field: string;
  type: string;
  interface?: string;
  options?: any;
  validation?: any;
  required: boolean;
  hidden: boolean;
  readonly: boolean;
  sort?: number;
  note?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ContentType {
  id: string;
  project_id: string;
  name: string;
  collection: string;
  icon?: string;
  is_system: boolean;
  singleton: boolean;
  note?: string;
  hidden: boolean;
  fields?: ContentTypeField[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentTypeDto {
  projectId: string;
  name: string;
  collection: string;
  icon?: string;
  singleton?: boolean;
  note?: string;
  hidden?: boolean;
  fields?: CreateFieldDto[];
}

export interface CreateFieldDto {
  field: string;
  type: string;
  interface?: string;
  options?: any;
  validation?: any;
  required?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  sort?: number;
  note?: string;
}

export interface UpdateContentTypeDto {
  name?: string;
  collection?: string;
  icon?: string;
  singleton?: boolean;
  note?: string;
  hidden?: boolean;
}

export interface UpdateFieldDto {
  field?: string;
  type?: string;
  interface?: string;
  options?: any;
  validation?: any;
  required?: boolean;
  hidden?: boolean;
  readonly?: boolean;
  sort?: number;
  note?: string;
}

export const contentTypesApi = {
  /**
   * Get all content types for a project
   */
  async getAll(projectId: string): Promise<ContentType[]> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const response = await apiClient.get<ContentType[]>(`/content-types?projectId=${projectId}`);
    return response.data;
  },

  /**
   * Get a content type by ID
   */
  async getById(id: string): Promise<ContentType> {
    const response = await apiClient.get<ContentType>(`/content-types/${id}`);
    return response.data;
  },

  /**
   * Create a new content type
   */
  async create(data: CreateContentTypeDto): Promise<ContentType> {
    const response = await apiClient.post<ContentType>('/content-types', data);
    return response.data;
  },

  /**
   * Update a content type
   */
  async update(id: string, data: UpdateContentTypeDto): Promise<ContentType> {
    const response = await apiClient.put<ContentType>(`/content-types/${id}`, data);
    return response.data;
  },

  /**
   * Delete a content type
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/content-types/${id}`);
  },

  /**
   * Add a field to a content type
   */
  async addField(contentTypeId: string, field: CreateFieldDto): Promise<ContentTypeField> {
    const response = await apiClient.post<ContentTypeField>(
      `/content-types/${contentTypeId}/fields`,
      field
    );
    return response.data;
  },

  /**
   * Update a field in a content type
   */
  async updateField(
    contentTypeId: string,
    fieldId: string,
    field: UpdateFieldDto
  ): Promise<ContentTypeField> {
    const response = await apiClient.put<ContentTypeField>(
      `/content-types/${contentTypeId}/fields/${fieldId}`,
      field
    );
    return response.data;
  },

  /**
   * Delete a field from a content type
   */
  async deleteField(contentTypeId: string, fieldId: string): Promise<void> {
    await apiClient.delete(`/content-types/${contentTypeId}/fields/${fieldId}`);
  },

  /**
   * Update field order for a content type
   */
  async updateFieldOrder(
    contentTypeId: string,
    fieldOrders: Array<{ id: string; sort: number }>
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(
      `/content-types/${contentTypeId}/fields/order`,
      fieldOrders
    );
    return response.data;
  },
};
