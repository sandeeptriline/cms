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
  Plus,
  ArrowLeft,
  Filter,
  MoreHorizontal,
} from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { contentEntriesApi, ContentEntry, QueryEntriesDto } from '@/lib/api/content-entries'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function ContentTypeEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = params?.projectId as string
  const contentTypeId = params?.contentTypeId as string
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [entries, setEntries] = useState<ContentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionEntry, setActionEntry] = useState<ContentEntry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [query, setQuery] = useState<QueryEntriesDto>({
    page: 1,
    limit: 25,
    sort: 'created_at',
    order: 'desc',
  })

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading && contentTypeId) {
      loadContentType()
      loadEntries()
    } else if (!projectLoading && (!currentProject || currentProject.id !== projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, contentTypeId, projectLoading, query])

  const visibleFields = contentType?.fields
    ?.filter((field) => !field.hidden)
    .slice(0, 5) || []

  const loadContentType = async () => {
    if (!contentTypeId) return

    try {
      const data = await contentTypesApi.getById(contentTypeId)
      setContentType(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load content type')
    }
  }

  const loadEntries = async () => {
    if (!projectId || !contentTypeId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await contentEntriesApi.getAll(projectId, contentTypeId, query)
      setEntries(response.data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load entries')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load entries',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle singleton content types - redirect to editor directly
  useEffect(() => {
    if (contentType?.singleton && !loading) {
      // For singleton, we'll handle this in the next step
      // For now, just show a message
    }
  }, [contentType, loading])

  // Convert content types to sidebar items (same as main page)
  const [allContentTypes, setAllContentTypes] = useState<ContentType[]>([])
  
  useEffect(() => {
    if (projectId && !projectLoading) {
      contentTypesApi.getAll(projectId).then(setAllContentTypes).catch(() => {})
    }
  }, [projectId, projectLoading])

  const sidebarItems: SecondarySidebarItem[] = [
    {
      id: 'data-model-manager-label',
      name: 'Data Model Manager',
      isLabel: true,
    },
    ...(allContentTypes.length > 0
      ? [
          {
            id: 'divider',
            name: '',
            divider: true,
          } as SecondarySidebarItem,
        ]
      : []),
    ...allContentTypes.map((ct) => ({
      id: ct.id,
      name: ct.name,
      icon: ct.icon || 'FileText',
      indent: true,
      isActive: ct.id === contentTypeId,
    })),
  ]

  const handleSidebarItemClick = (item: SecondarySidebarItem) => {
    if (item.id && item.id !== 'data-model-manager-label' && item.id !== 'divider') {
      router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${item.id}`)
    }
  }

  const openDeleteDialog = (entry: ContentEntry) => {
    setActionEntry(entry)
    setDeleteDialogOpen(true)
  }

  const openPublishDialog = (entry: ContentEntry) => {
    setActionEntry(entry)
    setPublishDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!actionEntry) return
    setActionLoading(true)
    try {
      await contentEntriesApi.delete(projectId, contentTypeId, actionEntry.id)
      toast({ title: 'Entry deleted' })
      loadEntries()
    } catch (err) {
      const e = err as { message?: string }
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  const handlePublish = async () => {
    if (!actionEntry) return
    setActionLoading(true)
    try {
      await contentEntriesApi.publish(projectId, contentTypeId, actionEntry.id, {})
      toast({ title: 'Entry published' })
      loadEntries()
    } catch (err) {
      const e = err as { message?: string }
      toast({ title: 'Publish failed', description: e.message, variant: 'destructive' })
    } finally {
      setActionLoading(false)
      setPublishDialogOpen(false)
    }
  }

  return (
    <ProjectRouteGuard>
      <DashboardLayout
        basePath="/dashboard"
        title={contentType?.name || 'Data Model Manager'}
        icon={<FileText className="h-5 w-5" />}
        secondarySidebarItems={sidebarItems}
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

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading entries...</span>
              </div>
            ) : contentType?.singleton ? (
              // Singleton: Show editor directly (will be implemented in next phase)
              <div className="border rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Singleton Content Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This is a singleton content type. Entry editor will be shown here.
                </p>
                <Button
                  onClick={() => {
                    // Navigate to entry editor (will be created in next phase)
                    router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}/edit`)
                  }}
                >
                  Edit Entry
                </Button>
              </div>
            ) : entries.length === 0 ? (
              // Non-singleton: Show empty state
              <div className="border rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by creating your first entry
                </p>
                <Button
                  onClick={() => {
                    router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}/create`)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Entry
                </Button>
              </div>
            ) : (
              // Non-singleton: Show entries list
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <Link
                        href={`/dashboard/settings/projects/${projectId}/data-model-manager`}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Data Model Manager
                      </Link>
                      <h1 className="text-2xl font-semibold">{contentType?.name}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                      <Button
                        onClick={() => {
                          router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}/create`)
                        }}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Create new entry
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="search"
                    placeholder="Search entries"
                    className="w-full max-w-[250px] rounded-lg border border-input bg-white px-4 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                  <Button variant="ghost" size="sm">
                    Configure the view
                  </Button>
                </div>
                <div className="rounded-3xl border border-[#eceff5] bg-white p-6 shadow-sm">
                  <div className="overflow-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                          {visibleFields.map((field) => (
                            <th key={field.id} className="px-4 py-3 font-medium">
                              {field.field}
                            </th>
                          ))}
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {entries.map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-[#f6f6fb]"
                          >
                            {visibleFields.map((field) => (
                              <td key={`${entry.id}-${field.id}`} className="px-4 py-3">
                                {entry.data?.[field.field] ?? '-'}
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-[#f0f3ff] px-3 py-1 text-xs font-semibold text-primary">
                                {entry.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}/${entry.id}`)}>
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDeleteDialog(entry)}>
                                    Delete
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPublishDialog(entry)}>
                                    Publish
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      toast({
                                        title: 'Duplicate',
                                        description: 'Duplicate entries will be supported soon.',
                                      })
                                    }
                                  >
                                    Duplicate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogTitle>Delete entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <strong>{actionEntry?.title || actionEntry?.id}</strong>?
            </DialogDescription>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogTitle>Publish entry</DialogTitle>
            <DialogDescription>
              Publishing will make this entry live. Continue?
            </DialogDescription>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPublishDialogOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="default" onClick={handlePublish} disabled={actionLoading}>
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProjectRouteGuard>
  )
}
