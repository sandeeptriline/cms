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
import { contentEntriesApi } from '@/lib/api/content-entries'
import { useToast } from '@/lib/hooks/use-toast'
import { useProject } from '@/contexts/project-context'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import Link from 'next/link'
import { DynamicFormBuilder } from '@/components/data-model-manager/dynamic-form-builder'

export default function CreateEntryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = params?.projectId as string
  const contentTypeId = params?.contentTypeId as string
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading && contentTypeId) {
      loadContentType()
    } else if (!projectLoading && (!currentProject || currentProject.id !== projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, contentTypeId, projectLoading])

  const loadContentType = async () => {
    if (!contentTypeId) return

    try {
      setLoading(true)
      const data = await contentTypesApi.getById(contentTypeId)
      setContentType(data)
      
      // Check if it's a singleton - redirect if so
      if (data.singleton) {
        toast({
          title: 'Error',
          description: 'Cannot create entry for singleton content type',
          variant: 'destructive',
        })
        router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentTypeId}`)
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load content type')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content type',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEntryFormSubmit = async (values: Record<string, any>) => {
    if (!contentType || !projectId) {
      return
    }

    setSaving(true)
    try {
      const normalizedValues = { ...values }
      const fields = contentType.fields || []
      fields.forEach((field) => {
        if (field.type === 'boolean') {
          const raw = values[field.field]
          if (typeof raw === 'boolean') {
            normalizedValues[field.field] = raw
          } else if (typeof raw === 'string') {
            normalizedValues[field.field] = raw.toLowerCase() === 'true'
          } else if (raw === '1' || raw === 1) {
            normalizedValues[field.field] = true
          } else if (raw === '0' || raw === 0) {
            normalizedValues[field.field] = false
          }
        } else if (field.type === 'dynamic_zone' || field.type === 'component') {
          if (normalizedValues[field.field] === undefined || normalizedValues[field.field] === null || normalizedValues[field.field] === '') {
            normalizedValues[field.field] = []
          }
        }
      })
      await contentEntriesApi.create(projectId, {
        contentTypeId: contentType.id,
        data: normalizedValues,
      })
      toast({
        title: 'Entry saved',
        description: 'Your entry has been saved successfully.',
      })
      router.push(`/dashboard/settings/projects/${projectId}/data-model-manager/${contentType.id}`)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Failed to save',
        description: e.message || 'Unable to create entry right now.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProjectRouteGuard>
      <DashboardLayout
        basePath="/dashboard"
        title={`Create Entry - ${contentType?.name || 'Loading...'}`}
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="flex-1 bg-[#f6f6fb]">
          <div className="mx-auto  px-6 py-10 space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading content type...</span>
              </div>
            ) : contentType ? (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Link
                      href={`/dashboard/settings/projects/${projectId}/data-model-manager`}
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Link>
                    <div>
                      <h1 className="text-3xl font-semibold">Create an entry</h1>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#eceff5] bg-white p-6 shadow-sm">
                    <DynamicFormBuilder
                      fields={contentType.fields || []}
                      defaultValues={{}}
                      columns={2}
                      onSubmit={handleEntryFormSubmit}
                      submitLabel={saving ? 'Saving…' : 'Save entry'}
                      disabled={saving}
                    />
                </div>
              </section>
            ) : (
              <div className="border rounded-lg p-12 text-center">
                <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Content type unavailable</h3>
                <p className="text-sm text-muted-foreground">
                  Please re-open the modal after selecting a content type in the Data Model section.
                </p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProjectRouteGuard>
  )
}
