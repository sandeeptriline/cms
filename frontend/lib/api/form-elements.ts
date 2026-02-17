import { apiClient } from './client';

export interface FormElement {
  id: string;
  project_id: string | null;
  name: string;
  key: string;
  type: string;
  category: string | null;
  icon: string | null;
  icon_color: string | null;
  description: string | null;
  interface: any;
  variants: any[] | null;
  default_variant: string | null;
  validation_rules: any | null;
  default_settings: any | null;
  available_settings: string[] | null;
  supports_conditions: boolean;
  supports_translations: boolean;
  supports_relations: boolean;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
  usage_count: number;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFormElementDto {
  project_id?: string | null;
  name: string;
  key: string;
  type: string;
  category?: string;
  icon?: string;
  icon_color?: string;
  description?: string;
  interface: any;
  variants?: any[];
  default_variant?: string;
  validation_rules?: any;
  default_settings?: any;
  available_settings?: string[];
  supports_conditions?: boolean;
  supports_translations?: boolean;
  supports_relations?: boolean;
  is_system?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export interface UpdateFormElementDto {
  name?: string;
  category?: string;
  icon?: string;
  icon_color?: string;
  description?: string;
  interface?: any;
  variants?: any[];
  default_variant?: string;
  validation_rules?: any;
  default_settings?: any;
  available_settings?: string[];
  supports_conditions?: boolean;
  supports_translations?: boolean;
  supports_relations?: boolean;
  is_system?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

export const formElementsApi = {
  /**
   * Get all form elements for a project (system + project-specific)
   */
  async getAll(projectId: string): Promise<FormElement[]> {
    if (!projectId) {
      throw new Error('projectId is required');
    }
    const response = await apiClient.get<FormElement[]>(`/form-elements?projectId=${projectId}`);
    return response.data;
  },

  /**
   * Get a form element by ID
   */
  async getById(id: string): Promise<FormElement> {
    const response = await apiClient.get<FormElement>(`/form-elements/${id}`);
    return response.data;
  },

  /**
   * Create a new form element
   */
  async create(data: CreateFormElementDto): Promise<FormElement> {
    const response = await apiClient.post<FormElement>('/form-elements', data);
    return response.data;
  },

  /**
   * Update a form element
   */
  async update(id: string, data: UpdateFormElementDto): Promise<FormElement> {
    const response = await apiClient.put<FormElement>(`/form-elements/${id}`, data);
    return response.data;
  },

  /**
   * Delete a form element
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/form-elements/${id}`);
  },
};
