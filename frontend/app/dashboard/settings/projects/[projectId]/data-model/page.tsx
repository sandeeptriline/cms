'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import { DashboardLayout, SecondarySidebarItem } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Database,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import { CreateDataModelModal } from './components/create-data-model-modal'
import { DataModelView } from './components/data-model-view'

export default function DataModelPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = params?.projectId as string
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading) {
      loadContentTypes()
    } else if (!projectLoading && (!currentProject || currentProject.id !== projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, projectLoading])

  // Check if create action is requested from URL
  useEffect(() => {
    if (searchParams?.get('action') === 'create') {
      setCreateModalOpen(true)
    }
  }, [searchParams])

  // Set first data model as selected by default
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
      const data = await contentTypesApi.getAll(projectId)
      setContentTypes(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load data models')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load data models',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSuccess = (newContentType?: ContentType) => {
    loadContentTypes()
    // If a new content type was created, select it
    if (newContentType) {
      setSelectedContentTypeId(newContentType.id)
    }
  }

  const handleSidebarItemClick = (item: SecondarySidebarItem) => {
    if (item.id === 'create-data-model') {
      setCreateModalOpen(true)
    } else if (item.id && item.id !== 'data-model-label' && item.id !== 'divider') {
      // It's a data model item - select it
      setSelectedContentTypeId(item.id)
    }
  }

  const handleRefresh = () => {
    loadContentTypes()
  }

  // Convert content types to sidebar items
  // Structure: "Data Model" label with "+" icon button, then all data models
  const sidebarItems: SecondarySidebarItem[] = [
    {
      id: 'data-model-label',
      name: 'Data Model',
      isLabel: true, // Static label, not clickable
    },
    {
      id: 'create-data-model',
      name: 'Create Data Model',
      icon: 'Plus',
      isIconButton: true, // Render as icon-only button next to label
    },
    ...(contentTypes.length > 0
      ? [
          {
            id: 'divider',
            name: '',
            divider: true,
          } as SecondarySidebarItem,
        ]
      : []),
    ...contentTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      icon: ct.icon || 'FileText', // Use icon from content type or default to FileText
      indent: true, // Indent under label
    })),
  ]

  // Determine active item for sidebar highlighting
  const getActiveItemId = () => {
    if (selectedContentTypeId) {
      return selectedContentTypeId
    }
    return null
  }

  // Update sidebar items with active state
  const sidebarItemsWithActive: SecondarySidebarItem[] = sidebarItems.map((item) => ({
    ...item,
    // Mark as active if it's the selected data model
    ...(item.id === getActiveItemId() && { isActive: true }),
  }))

  return (
    <ProjectRouteGuard>
      {loading ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Data Model"
          icon={<Database className="h-5 w-5" />}
          secondarySidebarItems={[]}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading data models...</span>
          </div>
        </DashboardLayout>
      ) : contentTypes.length === 0 ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Data Model"
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
                <h3 className="text-lg font-semibold mb-2">No data models</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first data model
                </p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Data Model
                </Button>
              </div>
            </div>
          </div>

          {/* Create Modal */}
          <CreateDataModelModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={handleCreateSuccess}
          />
        </DashboardLayout>
      ) : (
        <DashboardLayout
          basePath="/dashboard"
          title="Data Model"
          icon={<Database className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          {selectedContentTypeId ? (
            <DataModelView
              contentTypeId={selectedContentTypeId}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Create Modal */}
          <CreateDataModelModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSuccess={handleCreateSuccess}
          />
        </DashboardLayout>
      )}
    </ProjectRouteGuard>
  )
}
