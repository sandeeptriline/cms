import { apiClient } from './client';

/** Same shape as ContentType for tenant portal compatibility */
export interface Collection {
  id: string;
  project_id: string;
  dataset_id?: string | null;
  name: string;
  slug: string;
  collection: string;
  config?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  fields?: CollectionField[];
}

export interface CollectionField {
  id: string;
  collection_id: string;
  name: string;
  field: string;
  type: string;
  is_required: boolean;
  config?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionDto {
  projectId: string;
  name: string;
  slug: string;
  datasetId?: string;
  config?: Record<string, any>;
  fields?: CreateCollectionFieldDto[];
}

export interface CreateCollectionFieldDto {
  name: string;
  type: string;
  is_required?: boolean;
  config?: Record<string, any>;
}

export interface UpdateCollectionDto {
  name?: string;
  slug?: string;
  datasetId?: string | null;
  config?: Record<string, any>;
}

export interface UpdateCollectionFieldDto {
  name?: string;
  type?: string;
  is_required?: boolean;
  config?: Record<string, any>;
}

export const collectionsApi = {
  async getAll(projectId: string): Promise<Collection[]> {
    const response = await apiClient.get<Collection[]>(`/collections?projectId=${projectId}`);
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<Collection> {
    const response = await apiClient.get<Collection>(`/collections/${id}`);
    return response.data;
  },

  async create(data: CreateCollectionDto): Promise<Collection> {
    const response = await apiClient.post<Collection>('/collections', data);
    return response.data;
  },

  async update(id: string, data: UpdateCollectionDto): Promise<Collection> {
    const response = await apiClient.put<Collection>(`/collections/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/collections/${id}`);
  },

  async addField(collectionId: string, field: CreateCollectionFieldDto): Promise<Collection> {
    const response = await apiClient.post<Collection>(`/collections/${collectionId}/fields`, field);
    return response.data;
  },

  async updateField(
    collectionId: string,
    fieldId: string,
    field: UpdateCollectionFieldDto
  ): Promise<Collection> {
    const response = await apiClient.put<Collection>(
      `/collections/${collectionId}/fields/${fieldId}`,
      field
    );
    return response.data;
  },

  async deleteField(collectionId: string, fieldId: string): Promise<void> {
    await apiClient.delete(`/collections/${collectionId}/fields/${fieldId}`);
  },

  async updateFieldOrder(
    collectionId: string,
    fieldOrders: Array<{ id: string; sort: number }>
  ): Promise<Collection> {
    const response = await apiClient.put<Collection>(
      `/collections/${collectionId}/fields/order`,
      fieldOrders
    );
    return response.data;
  },
};
