import { apiClient } from './client';

export interface ContentNodeEntry {
  id: string;
  projectId: string;
  collectionId: string;
  status: string;
  data: Record<string, any>;
  version: number;
  createdAt: string;
  updatedAt: string;
  title?: string | null;
  slug?: string | null;
}

export interface QueryContentNodesParams {
  projectId: string;
  collectionId: string;
  page?: number;
  limit?: number;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface ContentNodesListResponse {
  data: ContentNodeEntry[];
  meta: { total: number; page: number; limit: number };
}

export const contentNodesApi = {
  async getAll(params: QueryContentNodesParams): Promise<ContentNodesListResponse> {
    const q = new URLSearchParams();
    q.set('projectId', params.projectId);
    q.set('collectionId', params.collectionId);
    if (params.page != null) q.set('page', String(params.page));
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.status) q.set('status', params.status);
    if (params.sort) q.set('sort', params.sort);
    if (params.order) q.set('order', params.order);
    if (params.search) q.set('search', params.search);
    const response = await apiClient.get<ContentNodesListResponse>(`/content-nodes?${q.toString()}`);
    return response.data;
  },

  async getOne(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentNodeEntry> {
    const q = new URLSearchParams({ projectId, collectionId });
    const response = await apiClient.get<ContentNodeEntry>(
      `/content-nodes/${entryId}?${q.toString()}`
    );
    return response.data;
  },

  async create(
    projectId: string,
    collectionId: string,
    body: { data: Record<string, any>; status?: string }
  ): Promise<ContentNodeEntry> {
    const q = new URLSearchParams({ projectId, collectionId });
    const response = await apiClient.post<ContentNodeEntry>(
      `/content-nodes?${q.toString()}`,
      body
    );
    return response.data;
  },

  async update(
    projectId: string,
    collectionId: string,
    entryId: string,
    body: { data?: Record<string, any>; status?: string }
  ): Promise<ContentNodeEntry> {
    const q = new URLSearchParams({ projectId, collectionId });
    const response = await apiClient.put<ContentNodeEntry>(
      `/content-nodes/${entryId}?${q.toString()}`,
      body
    );
    return response.data;
  },

  async delete(projectId: string, collectionId: string, entryId: string): Promise<void> {
    const q = new URLSearchParams({ projectId, collectionId });
    await apiClient.delete(`/content-nodes/${entryId}?${q.toString()}`);
  },

  async publish(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentNodeEntry> {
    const q = new URLSearchParams({ projectId, collectionId });
    const response = await apiClient.post<ContentNodeEntry>(
      `/content-nodes/${entryId}/publish?${q.toString()}`
    );
    return response.data;
  },

  async unpublish(
    projectId: string,
    collectionId: string,
    entryId: string
  ): Promise<ContentNodeEntry> {
    const q = new URLSearchParams({ projectId, collectionId });
    const response = await apiClient.post<ContentNodeEntry>(
      `/content-nodes/${entryId}/unpublish?${q.toString()}`
    );
    return response.data;
  },
};
