import { apiClient } from './client';

export interface Project {
  id: string;
  name: string;
  slug: string;
  cloned_from_platform_theme_id?: string | null;
  config?: Record<string, any> | null;
  feature_flags?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  slug?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}

export interface UpdateProjectDto {
  name?: string;
  slug?: string;
  config?: Record<string, any>;
  feature_flags?: Record<string, any>;
}

export interface AffectedCounts {
  [key: string]: number;
}

export const projectsApi = {
  /**
   * Get all projects
   */
  async getAll(): Promise<Project[]> {
    try {
      console.log('[projectsApi] Calling GET /projects');
      const response = await apiClient.get<Project[]>('/projects');
      console.log('[projectsApi] Full response object:', response);
      console.log('[projectsApi] Response status:', response.status);
      console.log('[projectsApi] Response data:', response.data);
      console.log('[projectsApi] Response data type:', typeof response.data);
      console.log('[projectsApi] Is Array:', Array.isArray(response.data));
      console.log('[projectsApi] Data length:', response.data?.length);
      
      // Handle case where data might be wrapped
      let data = response.data;
      if (data && !Array.isArray(data) && typeof data === 'object' && 'data' in data) {
        console.log('[projectsApi] Data is wrapped, unwrapping...');
        data = (data as any).data;
      }
      
      const result = Array.isArray(data) ? data : [];
      console.log('[projectsApi] Final result:', result, 'Length:', result.length);
      return result;
    } catch (error: any) {
      console.error('[projectsApi] Error getting projects:', error);
      console.error('[projectsApi] Error response:', error.response);
      console.error('[projectsApi] Error message:', error.message);
      throw error;
    }
  },

  /**
   * Get a project by ID
   */
  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  /**
   * Create a new project
   */
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  /**
   * Update a project
   */
  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${id}`, data);
    return response.data;
  },

  /**
   * Delete a project
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  /**
   * Get affected record counts for project deletion
   */
  async getAffectedCounts(id: string): Promise<AffectedCounts> {
    const response = await apiClient.get<AffectedCounts>(`/projects/${id}/affected-counts`);
    return response.data;
  },
};
