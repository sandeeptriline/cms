'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FolderKanban,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { projectsApi, Project, AffectedCounts } from '@/lib/api/projects'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/lib/hooks/use-toast'
import { CreateProjectModal } from './components/create-project-modal'
import { EditProjectModal } from './components/edit-project-modal'
import { DeleteProjectDialog } from './components/delete-project-dialog'

function ProjectsPageContent() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { projects, loading: projectContextLoading, refreshProjects, currentProject, setCurrentProject, error: projectError } = useProject()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [affectedCounts, setAffectedCounts] = useState<AffectedCounts | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(false)

  useEffect(() => {
    if (!projectContextLoading) {
      setLoading(false)
      if (projectError) {
        setError(projectError)
      }
    }
  }, [projectContextLoading, projectError])

  // Check if create action is requested from URL
  useEffect(() => {
    if (searchParams?.get('action') === 'create') {
      setCreateModalOpen(true)
    }
  }, [searchParams])

  const handleCreateSuccess = async (newProject?: Project) => {
    await refreshProjects()
    if (newProject) {
      setCurrentProject(newProject)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    await refreshProjects()
    setEditModalOpen(false)
    setEditingProject(null)
  }

  const handleDeleteClick = async (project: Project) => {
    setDeletingProject(project)
    setLoadingCounts(true)
    try {
      const counts = await projectsApi.getAffectedCounts(project.id)
      setAffectedCounts(counts)
      setDeleteDialogOpen(true)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load affected record counts',
        variant: 'destructive',
      })
    } finally {
      setLoadingCounts(false)
    }
  }

  const handleDeleteSuccess = async () => {
    await refreshProjects()
    setDeleteDialogOpen(false)
    setDeletingProject(null)
    setAffectedCounts(null)
  }

  if (loading || projectContextLoading) {
    return (
      <DashboardLayout
        basePath="/dashboard"
        title="Projects"
        icon={<FolderKanban className="h-5 w-5" />}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading projects...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      basePath="/dashboard"
      title="Projects"
      icon={<FolderKanban className="h-5 w-5" />}
      showActions={true}
      itemCount={projects.length}
    >
      <div className="flex-1 bg-background">
        <div className="px-6 py-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <div className="mt-2 text-xs">
                  Debug: projects.length = {projects.length}, loading = {loading.toString()}, projectContextLoading = {projectContextLoading.toString()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Header with Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Projects</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your projects. Each project contains its own content models, content, and settings.
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>

          {/* Projects List */}
          {(() => {
            console.log('[ProjectsPage] Rendering - projects.length:', projects.length, 'projects:', projects);
            return null;
          })()}
          {projects.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first project
              </p>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const isCurrent = currentProject?.id === project.id
                return (
                  <div
                    key={project.id}
                    className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                      isCurrent ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold truncate">{project.name}</h3>
                          {isCurrent && (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.slug}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(project)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isCurrent) {
                            toast({
                              title: 'Cannot delete',
                              description: 'Cannot delete the currently selected project. Please select another project first.',
                              variant: 'destructive',
                            })
                          } else {
                            handleDeleteClick(project)
                          }
                        }}
                        className="flex-1"
                        disabled={projects.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      {!isCurrent && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setCurrentProject(project)}
                          className="flex-1"
                        >
                          Select
                        </Button>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground">
                          Currently selected project
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      {editingProject && (
        <EditProjectModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open)
            if (!open) {
              setEditingProject(null)
            }
          }}
          project={editingProject}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Dialog */}
      {deletingProject && (
        <DeleteProjectDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) {
              setDeletingProject(null)
              setAffectedCounts(null)
            }
          }}
          project={deletingProject}
          affectedCounts={affectedCounts}
          loadingCounts={loadingCounts}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </DashboardLayout>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout basePath="/dashboard" title="Projects" icon={<FolderKanban className="h-5 w-5" />}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </DashboardLayout>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  )
}
