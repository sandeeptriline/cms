'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout, SecondarySidebarItem } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, Plus, Loader2, AlertCircle } from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { collectionsApi, Collection } from '@/lib/api/collections'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { CreateDataModelModal } from '@/app/dashboard/settings/projects/[projectId]/data-model/components/create-data-model-modal'
import { DataModelView } from '@/app/dashboard/settings/projects/[projectId]/data-model/components/data-model-view'

/** Unified type for list items (content type or collection) */
type DataModelItem = ContentType | Collection

/** Project-scoped content-type (data model) at /[tenantSlug]/[projectSlug]/content-type */
export default function ProjectContentTypePage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = currentProject?.id ?? null
  const [contentTypes, setContentTypes] = useState<DataModelItem[]>([])
  const [useV2, setUseV2] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading) {
      loadContentTypes()
    } else if (!projectLoading && (!currentProject || !projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, projectLoading])

  useEffect(() => {
    if (searchParams?.get('action') === 'create') {
      setCreateModalOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && contentTypes.length > 0 && !selectedContentTypeId) {
      setSelectedContentTypeId(contentTypes[0].id)
    }
  }, [loading, contentTypes, selectedContentTypeId])

  const loadContentTypes = async () => {
    if (!projectId) {
      setError('Project ID is required')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      try {
        const data = await collectionsApi.getAll(projectId)
        setContentTypes(data || [])
        setUseV2(true)
      } catch {
        const data = await contentTypesApi.getAll(projectId)
        setContentTypes(data || [])
        setUseV2(false)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load content models')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content models',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = (newItem?: DataModelItem) => {
    loadContentTypes()
    if (newItem) setSelectedContentTypeId(newItem.id)
  }

  const handleSidebarItemClick = (item: SecondarySidebarItem) => {
    if (item.id === 'create-data-model') {
      setCreateModalOpen(true)
    } else if (item.id && item.id !== 'data-model-label' && item.id !== 'divider') {
      setSelectedContentTypeId(item.id)
    }
  }

  const handleRefresh = () => {
    loadContentTypes()
  }

  const sidebarItems: SecondarySidebarItem[] = [
    { id: 'data-model-label', name: 'Content Model', isLabel: true },
    { id: 'create-data-model', name: 'Create Content Model', icon: 'Plus', isIconButton: true },
    ...(contentTypes.length > 0 ? [{ id: 'divider', name: '', divider: true } as SecondarySidebarItem] : []),
    ...contentTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      icon: ('icon' in ct && ct.icon) || 'FileText',
      indent: true,
    })),
  ]

  const sidebarItemsWithActive: SecondarySidebarItem[] = sidebarItems.map((item) => ({
    ...item,
    ...(item.id === selectedContentTypeId && { isActive: true }),
  }))

  if (!currentProject && !projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!projectId) {
    return null
  }

  return (
    <ProtectedRoute>
      {loading ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Content Models"
          icon={<Database className="h-5 w-5" />}
          secondarySidebarItems={[]}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading content models...</span>
          </div>
        </DashboardLayout>
      ) : contentTypes.length === 0 ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Content Models"
          icon={<Database className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex-1 bg-background">
            <div className="px-6 py-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="border rounded-lg p-12 text-center">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content models</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first content model
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content Model
                </Button>
              </div>
            </div>
          </div>
          <CreateDataModelModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={handleCreateSuccess}
            useV2={useV2}
            projectId={projectId}
          />
        </DashboardLayout>
      ) : (
        <DashboardLayout
          basePath="/dashboard"
          title="Content Models"
          icon={<Database className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          {selectedContentTypeId ? (
            <DataModelView
              contentTypeId={selectedContentTypeId}
              onRefresh={handleRefresh}
              useV2={useV2}
              projectId={projectId}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          )}
          <CreateDataModelModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={handleCreateSuccess}
            useV2={useV2}
            projectId={projectId}
          />
        </DashboardLayout>
      )}
    </ProtectedRoute>
  )
}
