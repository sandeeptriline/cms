'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi, Project, CreateProjectDto, UpdateProjectDto } from '@/lib/api/projects';
import { useAuth } from './auth-context';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (data: CreateProjectDto) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectDto) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECT_STORAGE_KEY = 'current_project_id';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, tenantId } = useAuth();
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !tenantId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('[ProjectContext] Loading projects...', { isAuthenticated, tenantId });
      const data = await projectsApi.getAll();
      console.log('[ProjectContext] Projects loaded:', data, 'Type:', typeof data, 'IsArray:', Array.isArray(data), 'Length:', data?.length);
      const projectsArray = Array.isArray(data) ? data : [];
      console.log('[ProjectContext] Setting projects:', projectsArray);
      setProjects(projectsArray);

      // Restore current project from localStorage
      const savedProjectId = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (savedProjectId && projectsArray.length > 0) {
        const project = projectsArray.find((p) => p.id === savedProjectId);
        if (project) {
          setCurrentProjectState(project);
          setLoading(false);
          return;
        }
      }

      // Auto-select first project if none selected
      if (projectsArray.length > 0) {
        setCurrentProjectState(projectsArray[0]);
        localStorage.setItem(PROJECT_STORAGE_KEY, projectsArray[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMessage);
      console.error('[ProjectContext] Failed to load projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tenantId]);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem(PROJECT_STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
  }, []);

  // Create project
  const createProject = useCallback(async (data: CreateProjectDto): Promise<Project> => {
    const project = await projectsApi.create(data);
    await loadProjects();
    setCurrentProject(project);
    return project;
  }, [loadProjects, setCurrentProject]);

  // Update project
  const updateProject = useCallback(async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const project = await projectsApi.update(id, data);
    await loadProjects();
    if (currentProject?.id === id) {
      setCurrentProject(project);
    }
    return project;
  }, [loadProjects, setCurrentProject, currentProject]);

  // Delete project
  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await projectsApi.delete(id);
    await loadProjects();
    if (currentProject?.id === id) {
      // Switch to first available project
      const remaining = projects.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setCurrentProject(remaining[0]);
      } else {
        setCurrentProject(null);
      }
    }
  }, [loadProjects, setCurrentProject, currentProject, projects]);

  // Refresh projects
  const refreshProjects = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  // Load projects when authenticated
  useEffect(() => {
    if (isAuthenticated && tenantId) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProjectState(null);
      setLoading(false);
    }
  }, [isAuthenticated, tenantId, loadProjects]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        error,
        setCurrentProject,
        loadProjects,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
