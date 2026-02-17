'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { contentEntriesApi, ContentEntry } from '@/lib/api/content-entries'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import Link from 'next/link'
import { DynamicFormBuilder } from '@/components/data-model-manager/dynamic-form-builder'

export default function EditEntryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = params?.projectId as string
  const contentTypeId = params?.contentTypeId as string
  const entryId = params?.entryId as string
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [entry, setEntry] = useState<ContentEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading && contentTypeId && entryId) {
      loadContentType()
      loadEntry()
    } else if (!projectLoading && (!currentProject || currentProject.id !== projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, contentTypeId, entryId, projectLoading])

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

  const loadEntry = async () => {
    if (!projectId || !contentTypeId || !entryId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await contentEntriesApi.getById(projectId, contentTypeId, entryId)
      setEntry(data)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load entry')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load entry',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEntryFormSubmit = async (values: Record<string, any>) => {
    console.log('edit payload', values)
    toast({
      title: 'Entry form saved (stub)',
      description: 'Publishing will be added in Phase 4.',
    })
  }

  const metadata = entry
    ? [
        { label: 'Status', value: entry.status },
        { label: 'Created', value: new Date(entry.createdAt).toLocaleString() },
        { label: 'Updated', value: new Date(entry.updatedAt).toLocaleString() },
        { label: 'Created By', value: entry.createdBy || 'Unknown' },
        { label: 'Slug', value: entry.slug || '—' },
      ]
    : []

  const statusClasses: Record<string, string> = {
    draft: 'bg-blue-100 text-blue-800',
    review: 'bg-orange-100 text-orange-800',
    approved: 'bg-sky-100 text-sky-800',
    published: 'bg-emerald-100 text-emerald-800',
  }

  return (
    <ProjectRouteGuard>
      <DashboardLayout
        basePath="/dashboard"
        title={entry?.title || contentType?.name || 'Edit Entry'}
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          <div className="px-6 py-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading || !contentType ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading entry...</span>
              </div>
            ) : !entry ? (
              <div className="border rounded-lg p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Entry not found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The entry you're looking for doesn't exist or has been deleted.
                </p>
                <Button
                  onClick={() => {
                    router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}`)
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Entries
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <section className="space-y-6">
                  <div className="space-y-3">
                    <Link
                      href={`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}`}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to {contentType.name}
                    </Link>
                    <div className="space-y-1">
                      <h1 className="text-2xl font-semibold">
                        {entry.title || 'Untitled entry'}
                      </h1>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Status: {entry.status}</span>
                        <span>
                          Updated: {new Date(entry.updatedAt).toLocaleDateString()}
                        </span>
                        <span>
                          Created: {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-foreground">Entry fields</p>
                        <p className="text-xs text-muted-foreground">
                          Fields are rendered dynamically from the content type definition.
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold rounded-full px-3 py-1 ${statusClasses[entry.status] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {entry.status.toUpperCase()}
                      </span>
                    </div>
                    <DynamicFormBuilder
                      fields={contentType.fields || []}
                      defaultValues={entry.data || {}}
                      onSubmit={handleEntryFormSubmit}
                      submitLabel="Save entry (stub)"
                    />
                  </div>
                </section>
                <aside className="space-y-4">
                  <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Entry metadata
                    </p>
                    {metadata.map((item) => (
                      <div key={item.label} className="flex justify-between">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground font-medium">{item.value}</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground">
                      Versions and publishing controls will appear here once Phase 4 is done.
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Actions
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="sm" className="justify-start">
                        Save draft
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start">
                        Change status
                      </Button>
                      <Button variant="secondary" size="sm" className="justify-start" disabled>
                        Publish (coming soon)
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProjectRouteGuard>
  )
}
