import { apiClient } from './client';

export interface ProjectDomain {
  id: string;
  project_id: string;
  primary_domain: string;
  api_domain: string;
  is_primary: boolean;
  created_at: string;
}

export interface CreateProjectDomainDto {
  primary_domain: string;
  api_domain: string;
  is_primary?: boolean;
}

export interface UpdateProjectDomainDto {
  primary_domain?: string;
  api_domain?: string;
  is_primary?: boolean;
}

export const projectDomainsApi = {
  async getAll(projectId: string): Promise<ProjectDomain[]> {
    const response = await apiClient.get<ProjectDomain[]>(`/projects/${projectId}/domains`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async create(projectId: string, data: CreateProjectDomainDto): Promise<ProjectDomain> {
    const response = await apiClient.post<ProjectDomain>(`/projects/${projectId}/domains`, data);
    return response.data;
  },

  async update(
    projectId: string,
    domainId: string,
    data: UpdateProjectDomainDto,
  ): Promise<ProjectDomain> {
    const response = await apiClient.patch<ProjectDomain>(
      `/projects/${projectId}/domains/${domainId}`,
      data,
    );
    return response.data;
  },

  async delete(projectId: string, domainId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/domains/${domainId}`);
  },
};
