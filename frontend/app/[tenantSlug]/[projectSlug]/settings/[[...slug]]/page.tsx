'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useProject } from '@/contexts/project-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Settings, Loader2, Copy, Check, Plus, Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import { projectsApi, UpdateProjectDto } from '@/lib/api/projects'
import { projectDomainsApi, ProjectDomain } from '@/lib/api/project-domains'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .refine((val) => /^[a-z0-9-]+$/.test(val), 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

type ProjectFormData = z.infer<typeof projectFormSchema>

const TITLES: Record<string, string> = {
  flows: 'Flows',
  roles: 'User Roles',
  policies: 'Access Policies',
  project: 'Project',
  appearance: 'Appearance',
  presets: 'Bookmarks',
  translations: 'Translations',
  ai: 'AI',
  marketplace: 'Marketplace',
  extensions: 'Extensions',
  'system-logs': 'System Logs',
  'report-bug': 'Report Bug',
  'request-feature': 'Request Feature',
}

export type MediaStorageType = 'local' | 's3'
export type MediaStorageProvider = 'stratus' | 'gcs' | 'azure' | 'wasabi' | 'r2'

export interface MediaStorageConfig {
  type: MediaStorageType
  provider?: MediaStorageProvider
  endpoint?: string
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  basePath?: string
}

const STORAGE_PROVIDERS: { value: MediaStorageProvider; label: string }[] = [
  { value: 'stratus', label: 'Catalyst Stratus' },
  { value: 'gcs', label: 'Google Cloud Storage' },
  { value: 'azure', label: 'Azure Blob Storage' },
  { value: 'wasabi', label: 'Wasabi' },
  { value: 'r2', label: 'Cloudflare R2' },
]

/** Project-scoped settings: /settings (redirects to /settings/flows) and /settings/flows, /settings/project, etc. */
export default function ProjectSettingsSlugPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params?.tenantSlug as string
  const projectSlug = params?.projectSlug as string
  const slug = params?.slug as string[] | undefined
  const { currentProject, loading: projectLoading, setCurrentProject, loadProjects } = useProject()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [domains, setDomains] = useState<ProjectDomain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [domainModalOpen, setDomainModalOpen] = useState(false)
  const [domainEditing, setDomainEditing] = useState<ProjectDomain | null>(null)
  const [domainSaving, setDomainSaving] = useState(false)
  const [domainForm, setDomainForm] = useState({ primary_domain: '', api_domain: '', is_primary: true })
  const [deleteDomain, setDeleteDomain] = useState<ProjectDomain | null>(null)
  const [mediaStorageForm, setMediaStorageForm] = useState<MediaStorageConfig>({
    type: 'local',
  })
  const [mediaStorageSaving, setMediaStorageSaving] = useState(false)
  const segment = slug?.[0] ?? ''
  const title = TITLES[segment] ?? 'Settings'

  const loadDomains = useCallback(async () => {
    if (!currentProject?.id) return
    setDomainsLoading(true)
    try {
      const list = await projectDomainsApi.getAll(currentProject.id)
      setDomains(list)
    } catch {
      setDomains([])
    } finally {
      setDomainsLoading(false)
    }
  }, [currentProject?.id])

  useEffect(() => {
    if (currentProject?.id && segment === 'project') {
      loadDomains()
    }
  }, [currentProject?.id, segment, loadDomains])

  useEffect(() => {
    if (currentProject?.config?.mediaStorage && segment === 'project') {
      const m = currentProject.config.mediaStorage as MediaStorageConfig
      setMediaStorageForm({
        type: m.type ?? 'local',
        provider: m.provider,
        endpoint: m.endpoint ?? '',
        region: m.region ?? '',
        bucket: m.bucket ?? '',
        accessKeyId: m.accessKeyId ?? '',
        secretAccessKey: m.secretAccessKey ?? '',
        basePath: m.basePath ?? '',
      })
    } else if (currentProject && segment === 'project') {
      setMediaStorageForm({ type: 'local' })
    }
  }, [currentProject?.config?.mediaStorage, currentProject, segment])

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setError,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    values: currentProject
      ? { name: currentProject.name, slug: currentProject.slug }
      : undefined,
  })

  useEffect(() => {
    if (tenantSlug && projectSlug && (slug === undefined || slug.length === 0)) {
      router.replace(`/${tenantSlug}/${projectSlug}/settings/flows`)
    }
  }, [tenantSlug, projectSlug, slug, router])

  const redirectingToFlows = tenantSlug && projectSlug && (slug === undefined || slug.length === 0)
  if ((!currentProject && !projectLoading) || redirectingToFlows) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const onProjectSubmit = async (data: ProjectFormData) => {
    if (!currentProject) return
    try {
      setSaving(true)
      const dto: UpdateProjectDto = {
        name: data.name,
        slug: data.slug,
      }
      const updated = await projectsApi.update(currentProject.id, dto)
      setCurrentProject(updated)
      await loadProjects()
      reset(data)
      if (updated.slug !== projectSlug && tenantSlug) {
        router.replace(`/${tenantSlug}/${updated.slug}/settings/project`)
      }
      toast({ title: 'Saved', description: 'Project updated successfully.' })
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { message?: string } } }
      const msg = e.response?.data?.message ?? e.message ?? 'Failed to update project'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      if (String(msg).toLowerCase().includes('slug')) {
        setError('slug', { type: 'manual', message: msg })
      }
    } finally {
      setSaving(false)
    }
  }

  const copyProjectId = () => {
    if (!currentProject?.id) return
    void navigator.clipboard.writeText(String(currentProject.id)).then(() => {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    })
  }

  const isProjectPage = segment === 'project'

  const openDomainModal = (domain?: ProjectDomain) => {
    if (domain) {
      setDomainEditing(domain)
      setDomainForm({
        primary_domain: domain.primary_domain,
        api_domain: domain.api_domain,
        is_primary: domain.is_primary,
      })
    } else {
      setDomainEditing(null)
      setDomainForm({ primary_domain: '', api_domain: '', is_primary: true })
    }
    setDomainModalOpen(true)
  }

  const onDomainModalSave = async () => {
    if (!currentProject?.id) return
    if (!domainForm.primary_domain.trim() || !domainForm.api_domain.trim()) {
      toast({ title: 'Validation', description: 'Primary domain and API domain are required.', variant: 'destructive' })
      return
    }
    setDomainSaving(true)
    try {
      if (domainEditing) {
        await projectDomainsApi.update(currentProject.id, domainEditing.id, {
          primary_domain: domainForm.primary_domain.trim(),
          api_domain: domainForm.api_domain.trim(),
          is_primary: domainForm.is_primary,
        })
        toast({ title: 'Saved', description: 'Domain updated.' })
      } else {
        await projectDomainsApi.create(currentProject.id, {
          primary_domain: domainForm.primary_domain.trim(),
          api_domain: domainForm.api_domain.trim(),
          is_primary: domainForm.is_primary,
        })
        toast({ title: 'Saved', description: 'Domain added.' })
      }
      await loadDomains()
      setDomainModalOpen(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e.response?.data?.message ?? e.message ?? 'Failed to save domain'
      toast({ title: 'Error', description: String(msg), variant: 'destructive' })
    } finally {
      setDomainSaving(false)
    }
  }

  const onDomainDeleteConfirm = async () => {
    if (!currentProject?.id || !deleteDomain) return
    try {
      await projectDomainsApi.delete(currentProject.id, deleteDomain.id)
      toast({ title: 'Deleted', description: 'Domain removed.' })
      await loadDomains()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast({ title: 'Error', description: String(e.response?.data?.message ?? e.message ?? 'Failed to delete'), variant: 'destructive' })
    }
    setDeleteDomain(null)
  }

  const onMediaStorageSave = async () => {
    if (!currentProject) return
    setMediaStorageSaving(true)
    try {
      const config: MediaStorageConfig = {
        type: mediaStorageForm.type,
      }
      if (mediaStorageForm.type === 's3') {
        config.provider = mediaStorageForm.provider
        config.endpoint = mediaStorageForm.endpoint || undefined
        config.region = mediaStorageForm.region || undefined
        config.bucket = mediaStorageForm.bucket || undefined
        config.accessKeyId = mediaStorageForm.accessKeyId || undefined
        config.secretAccessKey = mediaStorageForm.secretAccessKey || undefined
      } else {
        config.basePath = mediaStorageForm.basePath || undefined
      }
      const updated = await projectsApi.update(currentProject.id, {
        config: { ...(currentProject.config || {}), mediaStorage: config },
      })
      setCurrentProject(updated)
      await loadProjects()
      toast({ title: 'Saved', description: 'Media storage settings updated.' })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast({ title: 'Error', description: String(e.response?.data?.message ?? e.message ?? 'Failed to save'), variant: 'destructive' })
    } finally {
      setMediaStorageSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout basePath="/dashboard" title={title} icon={<Settings className="h-5 w-5" />}>
        <div className="flex-1 bg-background">
          {isProjectPage && currentProject ? (
            <div className="px-6 py-6 w-full space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-1">Project settings</h2>
                <p className="text-sm text-muted-foreground">
                  Edit project details.
                </p>
              </div>

              <form onSubmit={handleSubmit(onProjectSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic info</CardTitle>
                    <CardDescription>Name and URL slug. Changing slug may affect links.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-name">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="project-name"
                        placeholder="My Project"
                        {...register('name')}
                        className="max-w-md"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-slug">
                        Slug <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="project-slug"
                        placeholder="my-project"
                        {...register('slug')}
                        className="max-w-md font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        URL-friendly identifier. Used in paths like /{tenantSlug}/{projectSlug}/...
                      </p>
                      {errors.slug && (
                        <p className="text-sm text-destructive">{errors.slug.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                    <CardDescription>Read-only project information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Project ID</span>
                      <code className="flex-1 rounded bg-muted px-2 py-1 font-mono text-xs">
                        {currentProject.id}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={copyProjectId}
                      >
                        {copiedId ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {'created_at' in currentProject && currentProject.created_at && (
                      <div>
                        <span className="text-muted-foreground">Created</span>{' '}
                        {formatDate(currentProject.created_at as string)}
                      </div>
                    )}
                    {'updated_at' in currentProject && currentProject.updated_at && (
                      <div>
                        <span className="text-muted-foreground">Updated</span>{' '}
                        {formatDate(currentProject.updated_at as string)}
                      </div>
                    )}
                    {'cloned_from_platform_theme_id' in currentProject &&
                      currentProject.cloned_from_platform_theme_id != null && (
                        <div>
                          <span className="text-muted-foreground">Cloned from theme</span>{' '}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {String(currentProject.cloned_from_platform_theme_id)}
                          </code>
                        </div>
                      )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Media storage</CardTitle>
                    <CardDescription>
                      Where to store uploaded media for this project. Local uses the platform default; S3-compatible options include Catalyst Stratus, Google Cloud Storage, Azure Blob, Wasabi, and Cloudflare R2.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Storage type</Label>
                      <select
                        className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={mediaStorageForm.type}
                        onChange={(e) =>
                          setMediaStorageForm((f) => ({
                            ...f,
                            type: e.target.value as MediaStorageConfig['type'],
                          }))
                        }
                      >
                        <option value="local">Local (platform default)</option>
                        <option value="s3">S3-compatible (Stratus, GCS, Azure, Wasabi, R2)</option>
                      </select>
                    </div>
                    {mediaStorageForm.type === 's3' && (
                      <>
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <select
                            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={mediaStorageForm.provider ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({
                                ...f,
                                provider: (e.target.value || undefined) as MediaStorageProvider | undefined,
                              }))
                            }
                          >
                            <option value="">— Select —</option>
                            {STORAGE_PROVIDERS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="media-endpoint">Endpoint (optional)</Label>
                          <Input
                            id="media-endpoint"
                            placeholder="https://s3.amazonaws.com or custom endpoint"
                            value={mediaStorageForm.endpoint ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({ ...f, endpoint: e.target.value }))
                            }
                            className="max-w-md"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="media-region">Region</Label>
                          <Input
                            id="media-region"
                            placeholder="us-east-1"
                            value={mediaStorageForm.region ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({ ...f, region: e.target.value }))
                            }
                            className="max-w-md"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="media-bucket">Bucket <span className="text-destructive">*</span></Label>
                          <Input
                            id="media-bucket"
                            placeholder="my-bucket"
                            value={mediaStorageForm.bucket ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({ ...f, bucket: e.target.value }))
                            }
                            className="max-w-md"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="media-access-key">Access key ID</Label>
                          <Input
                            id="media-access-key"
                            type="text"
                            autoComplete="off"
                            placeholder="Access key"
                            value={mediaStorageForm.accessKeyId ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({ ...f, accessKeyId: e.target.value }))
                            }
                            className="max-w-md"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="media-secret-key">Secret access key</Label>
                          <Input
                            id="media-secret-key"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Secret key"
                            value={mediaStorageForm.secretAccessKey ?? ''}
                            onChange={(e) =>
                              setMediaStorageForm((f) => ({ ...f, secretAccessKey: e.target.value }))
                            }
                            className="max-w-md"
                          />
                        </div>
                      </>
                    )}
                    {mediaStorageForm.type === 'local' && (
                      <div className="space-y-2">
                        <Label htmlFor="media-base-path">Base path (optional)</Label>
                        <Input
                          id="media-base-path"
                          placeholder="uploads"
                          value={mediaStorageForm.basePath ?? ''}
                          onChange={(e) =>
                            setMediaStorageForm((f) => ({ ...f, basePath: e.target.value }))
                          }
                          className="max-w-md"
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave empty to use platform default (e.g. uploads).
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      onClick={onMediaStorageSave}
                      disabled={mediaStorageSaving}
                    >
                      {mediaStorageSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save media storage settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>Project domains</CardTitle>
                      <CardDescription>
                        Primary and API domains for this project. Each domain must be unique across the tenant.
                      </CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => openDomainModal()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add domain
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {domainsLoading ? (
                      <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading domains…
                      </div>
                    ) : domains.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No domains configured. Add one to get started.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Primary domain</TableHead>
                            <TableHead>API domain</TableHead>
                            <TableHead className="w-[100px]">Primary</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {domains.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-mono text-sm">{d.primary_domain}</TableCell>
                              <TableCell className="font-mono text-sm">{d.api_domain}</TableCell>
                              <TableCell>
                                {d.is_primary ? (
                                  <Badge variant="secondary">Primary</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openDomainModal(d)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteDomain(d)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Button type="submit" disabled={!isDirty || saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </form>

              <Dialog open={domainModalOpen} onOpenChange={setDomainModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{domainEditing ? 'Edit domain' : 'Add domain'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_domain">Primary domain</Label>
                      <Input
                        id="primary_domain"
                        placeholder="www.example.com"
                        value={domainForm.primary_domain}
                        onChange={(e) => setDomainForm((f) => ({ ...f, primary_domain: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api_domain">API domain</Label>
                      <Input
                        id="api_domain"
                        placeholder="api.example.com"
                        value={domainForm.api_domain}
                        onChange={(e) => setDomainForm((f) => ({ ...f, api_domain: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_primary"
                        checked={domainForm.is_primary}
                        onChange={(e) => setDomainForm((f) => ({ ...f, is_primary: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="is_primary" className="font-normal">Set as primary domain</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDomainModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={onDomainModalSave} disabled={domainSaving}>
                      {domainSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {domainEditing ? 'Update' : 'Add'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog open={!!deleteDomain} onOpenChange={(open) => !open && setDeleteDomain(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete domain?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the domain configuration. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDomainDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              {title} — coming soon.
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
