import { apiClient } from './client';

export interface Flow {
  id: string;
  project_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  status: string;
  trigger: string | null;
  accountability: string | null;
  options: Record<string, any> | null;
  operation: string | null;
  date_created: string;
  user_created: string | null;
}

export interface CreateFlowDto {
  projectId: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  status?: string;
  trigger?: string;
  accountability?: string;
  options?: Record<string, any>;
  operation?: string;
}

export interface UpdateFlowDto {
  name?: string;
  icon?: string;
  color?: string;
  description?: string;
  status?: string;
  trigger?: string;
  accountability?: string;
  options?: Record<string, any>;
  operation?: string;
}

export const flowsApi = {
  /**
   * Get all flows for a project
   */
  async getAll(projectId: string): Promise<Flow[]> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const response = await apiClient.get<Flow[]>('/flows', {
      params: { projectId },
    });
    return response.data;
  },

  /**
   * Get a flow by ID
   */
  async getById(projectId: string, id: string): Promise<Flow> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const response = await apiClient.get<Flow>(`/flows/${id}`, {
      params: { projectId },
    });
    return response.data;
  },

  /**
   * Create a new flow
   */
  async create(data: CreateFlowDto): Promise<Flow> {
    const response = await apiClient.post<Flow>('/flows', data);
    return response.data;
  },

  /**
   * Update a flow
   */
  async update(projectId: string, id: string, data: UpdateFlowDto): Promise<Flow> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const response = await apiClient.patch<Flow>(`/flows/${id}`, data, {
      params: { projectId },
    });
    return response.data;
  },

  /**
   * Delete a flow
   */
  async delete(projectId: string, id: string): Promise<void> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    await apiClient.delete(`/flows/${id}`, {
      params: { projectId },
    });
  },
};
