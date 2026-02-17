import { apiClient } from './client';

export interface ContentEntry {
  id: string;
  contentTypeId: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  title: string | null;
  slug: string | null;
  data: Record<string, any>;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface CreateEntryDto {
  contentTypeId: string;
  data: Record<string, any>;
  status?: 'draft' | 'review';
  title?: string;
  slug?: string;
}

export interface UpdateEntryDto {
  data?: Record<string, any>;
  status?: 'draft' | 'review' | 'approved' | 'published';
  title?: string;
  slug?: string;
}

export interface PublishEntryDto {
  publishAt?: Date | string;
  unpublishAt?: Date | string;
}

export interface QueryEntriesDto {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  fields?: string[];
}

export interface EntriesResponse {
  data: ContentEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ContentVersion {
  id: string;
  versionNumber: number;
  status: string | null;
  name: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ContentVersionWithData extends ContentVersion {
  data: Record<string, any>;
}

export interface BulkDeleteResponse {
  deleted: number;
}

export interface BulkPublishResponse {
  published: number;
}

export interface BulkChangeStatusResponse {
  updated: number;
}

export const contentEntriesApi = {
  /**
   * Get all entries for a content type with filtering
   */
  async getAll(
    projectId: string,
    contentTypeId: string,
    query?: QueryEntriesDto,
  ): Promise<EntriesResponse> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }

    const params: Record<string, any> = {
      projectId,
      contentTypeId,
      ...query,
    };

    // Convert dates to ISO strings if present
    if (query?.page) params.page = query.page.toString();
    if (query?.limit) params.limit = query.limit.toString();
    if (query?.fields && Array.isArray(query.fields)) {
      params.fields = query.fields.join(',');
    }

    const response = await apiClient.get<EntriesResponse>('/content-entries', { params });
    return response.data;
  },

  /**
   * Get a single entry by ID
   */
  async getById(
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.get<ContentEntry>(`/content-entries/${entryId}`, {
      params: { projectId, contentTypeId },
    });
    return response.data;
  },

  /**
   * Create a new entry
   */
  async create(projectId: string, data: CreateEntryDto): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!data.contentTypeId) {
      throw new Error('contentTypeId is required in data');
    }

    const response = await apiClient.post<ContentEntry>('/content-entries', data, {
      params: { projectId },
    });
    return response.data;
  },

  /**
   * Update an entry
   */
  async update(
    projectId: string,
    contentTypeId: string,
    entryId: string,
    data: UpdateEntryDto,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.patch<ContentEntry>(
      `/content-entries/${entryId}`,
      data,
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Delete an entry
   */
  async delete(
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<void> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    await apiClient.delete(`/content-entries/${entryId}`, {
      params: { projectId, contentTypeId },
    });
  },

  /**
   * Publish an entry
   */
  async publish(
    projectId: string,
    contentTypeId: string,
    entryId: string,
    data?: PublishEntryDto,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.post<ContentEntry>(
      `/content-entries/${entryId}/publish`,
      data || {},
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Unpublish an entry
   */
  async unpublish(
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.post<ContentEntry>(
      `/content-entries/${entryId}/unpublish`,
      {},
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Change entry status
   */
  async changeStatus(
    projectId: string,
    contentTypeId: string,
    entryId: string,
    status: 'draft' | 'review' | 'approved' | 'published',
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.post<ContentEntry>(
      `/content-entries/${entryId}/change-status`,
      { status },
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Get all versions for an entry
   */
  async getVersions(
    projectId: string,
    contentTypeId: string,
    entryId: string,
  ): Promise<ContentVersion[]> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }

    const response = await apiClient.get<ContentVersion[]>(
      `/content-entries/${entryId}/versions`,
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Get a specific version
   */
  async getVersion(
    projectId: string,
    contentTypeId: string,
    entryId: string,
    versionId: string,
  ): Promise<ContentVersionWithData> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }
    if (!versionId) {
      throw new Error('versionId is required');
    }

    const response = await apiClient.get<ContentVersionWithData>(
      `/content-entries/${entryId}/versions/${versionId}`,
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Revert entry to a specific version
   */
  async revertToVersion(
    projectId: string,
    contentTypeId: string,
    entryId: string,
    versionId: string,
  ): Promise<ContentEntry> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryId) {
      throw new Error('entryId is required');
    }
    if (!versionId) {
      throw new Error('versionId is required');
    }

    const response = await apiClient.post<ContentEntry>(
      `/content-entries/${entryId}/revert/${versionId}`,
      {},
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Bulk delete entries
   */
  async bulkDelete(
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
  ): Promise<BulkDeleteResponse> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new Error('entryIds array is required and must not be empty');
    }

    const response = await apiClient.post<BulkDeleteResponse>(
      '/content-entries/bulk-delete',
      { entryIds },
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Bulk publish entries
   */
  async bulkPublish(
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
  ): Promise<BulkPublishResponse> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new Error('entryIds array is required and must not be empty');
    }

    const response = await apiClient.post<BulkPublishResponse>(
      '/content-entries/bulk-publish',
      { entryIds },
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },

  /**
   * Bulk change status
   */
  async bulkChangeStatus(
    projectId: string,
    contentTypeId: string,
    entryIds: string[],
    status: 'draft' | 'review' | 'approved' | 'published',
  ): Promise<BulkChangeStatusResponse> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    if (!contentTypeId) {
      throw new Error('contentTypeId is required');
    }
    if (!entryIds || entryIds.length === 0) {
      throw new Error('entryIds array is required and must not be empty');
    }

    const response = await apiClient.post<BulkChangeStatusResponse>(
      '/content-entries/bulk-change-status',
      { entryIds, status },
      {
        params: { projectId, contentTypeId },
      },
    );
    return response.data;
  },
};
