'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useProject } from '@/contexts/project-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Image, Loader2, Upload, Trash2, FileIcon } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { mediaApi, MediaAsset } from '@/lib/api/media'
import { formatDate } from '@/lib/utils/date'

/** Project-scoped media at /[tenantSlug]/[projectSlug]/media */
export default function ProjectMediaPage() {
  const params = useParams()
  const { currentProject, loading: projectLoading } = useProject()
  const { toast } = useToast()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAssets = useCallback(async () => {
    if (!currentProject?.id) return
    setLoading(true)
    try {
      const list = await mediaApi.list(currentProject.id)
      setAssets(list)
    } catch {
      setAssets([])
      toast({ title: 'Error', description: 'Failed to load media.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentProject?.id, toast])

  useEffect(() => {
    if (currentProject?.id) {
      loadAssets()
    }
  }, [currentProject?.id, loadAssets])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentProject?.id) return
    setUploading(true)
    try {
      const created = await mediaApi.upload(currentProject.id, file)
      setAssets((prev) => [created, ...prev])
      toast({ title: 'Uploaded', description: created.filename })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Upload failed'
      toast({ title: 'Error', description: String(msg), variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const onDeleteConfirm = async () => {
    if (!currentProject?.id || !deleteAsset) return
    setDeleting(true)
    try {
      await mediaApi.delete(currentProject.id, deleteAsset.id)
      setAssets((prev) => prev.filter((a) => a.id !== deleteAsset.id))
      toast({ title: 'Deleted', description: deleteAsset.filename })
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteAsset(null)
    }
  }

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const apiBase = process.env.NEXT_PUBLIC_API_URL || ''

  useEffect(() => {
    if (!currentProject?.id) return
    const imageAssets = assets.filter((a) => a.mime_type?.startsWith('image/'))
    let cancelled = false
    imageAssets.forEach((asset) => {
      mediaApi
        .getOne(currentProject.id, asset.id)
        .then((res) => {
          if (cancelled) return
          const isExternalUrl =
            res.url &&
            /^https?:\/\//.test(res.url) &&
            apiBase &&
            !res.url.startsWith(apiBase) &&
            !res.url.includes('/media/serve/')
          if (isExternalUrl) {
            setPreviewUrls((prev) => ({ ...prev, [asset.id]: res.url! }))
            return
          }
          return import('@/lib/api/client').then(({ apiClient }) =>
            apiClient.get(`/projects/${currentProject.id}/media/serve/${asset.id}`, {
              responseType: 'blob',
            }),
          )
        })
        .then((axiosRes) => {
          if (cancelled || !axiosRes?.data) return
          const blob = axiosRes.data as Blob
          const objectUrl = URL.createObjectURL(blob)
          setPreviewUrls((prev) => ({ ...prev, [asset.id]: objectUrl }))
        })
        .catch(() => {})
    })
    return () => {
      cancelled = true
      setPreviewUrls((prev) => {
        Object.values(prev).forEach(URL.revokeObjectURL)
        return {}
      })
    }
  }, [currentProject?.id, assets, apiBase])

  const getPreviewUrl = (asset: MediaAsset): string => previewUrls[asset.id] || ''

  const isImage = (mime: string | null) => mime?.startsWith('image/')

  if (!currentProject && !projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout basePath="/dashboard" title="Media" icon={<Image className="h-5 w-5" />}>
        <div className="flex-1 p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Media library</CardTitle>
                <CardDescription>
                  Upload and manage files for this project. Configure storage in Project Settings.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,text/*"
                  onChange={onFileChange}
                  disabled={uploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No media yet. Upload a file to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative rounded-lg border bg-muted/50 overflow-hidden"
                    >
                      <div className="aspect-square flex items-center justify-center bg-muted">
                        {isImage(asset.mime_type) && getPreviewUrl(asset) ? (
                          <img
                            src={getPreviewUrl(asset)}
                            alt={asset.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : isImage(asset.mime_type) ? (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                          <FileIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={asset.filename}>
                          {asset.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(asset.created_at)}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteAsset(asset)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={!!deleteAsset} onOpenChange={(open) => !open && setDeleteAsset(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this file?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove &quot;{deleteAsset?.filename}&quot; from the media library. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteConfirm}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
