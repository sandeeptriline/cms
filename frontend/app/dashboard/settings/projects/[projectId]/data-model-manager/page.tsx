'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout, SecondarySidebarItem } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'

export default function DataModelManagerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = params?.projectId as string
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading) {
      loadContentTypes()
    } else if (!projectLoading && (!currentProject || currentProject.id !== projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, projectLoading])

  // Set first data model as selected by default and navigate to it
  useEffect(() => {
    if (!loading && contentTypes.length > 0 && !selectedContentTypeId) {
      const firstContentTypeId = contentTypes[0].id
      setSelectedContentTypeId(firstContentTypeId)
      // Navigate to the first content type's entries page
      router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${firstContentTypeId}`)
    }
  }, [loading, contentTypes, selectedContentTypeId, projectId, router])

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

  const handleSidebarItemClick = (item: SecondarySidebarItem) => {
    if (item.id && item.id !== 'data-model-manager-label' && item.id !== 'divider') {
      // It's a data model item - navigate to its entries page
      setSelectedContentTypeId(item.id)
      router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${item.id}`)
    }
  }

  // Convert content types to sidebar items
  // Structure: "Data Model Manager" label, then all data models
  const sidebarItems: SecondarySidebarItem[] = [
    {
      id: 'data-model-manager-label',
      name: 'Data Model Manager',
      isLabel: true, // Static label, not clickable
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
          title="Data Model Manager"
          icon={<FileText className="h-5 w-5" />}
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
          title="Data Model Manager"
          icon={<FileText className="h-5 w-5" />}
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
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data models found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a data model in the Data Model section first, then come back here to manage entries.
                </p>
                <Button
                  onClick={() => router.push(`/dashboard/settings/projects/${projectId}/data-model`)}
                >
                  Go to Data Model
                </Button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      ) : (
        <DashboardLayout
          basePath="/dashboard"
          title="Data Model Manager"
          icon={<FileText className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Redirecting to entries...</span>
          </div>
        </DashboardLayout>
      )}
    </ProjectRouteGuard>
  )
}
