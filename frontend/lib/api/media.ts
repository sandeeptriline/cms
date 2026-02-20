import { apiClient } from './client';

export interface MediaAsset {
  id: string;
  project_id: string;
  filename: string;
  storage_key: string;
  mime_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface MediaAssetWithUrl extends MediaAsset {
  url: string;
}

export const mediaApi = {
  async list(projectId: string): Promise<MediaAsset[]> {
    const response = await apiClient.get<MediaAsset[]>(`/projects/${projectId}/media`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getOne(projectId: string, assetId: string): Promise<MediaAssetWithUrl> {
    const response = await apiClient.get<MediaAssetWithUrl>(
      `/projects/${projectId}/media/${assetId}`,
    );
    return response.data;
  },

  async upload(projectId: string, file: File): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<MediaAsset>(
      `/projects/${projectId}/media`,
      formData,
    );
    return response.data;
  },

  async delete(projectId: string, assetId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/media/${assetId}`);
  },
};
