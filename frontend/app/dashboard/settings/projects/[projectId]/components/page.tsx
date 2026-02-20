'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Puzzle, Plus, Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { componentsApi, Component } from '@/lib/api/components'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/lib/hooks/use-toast'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export default function ComponentsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const { toast } = useToast()
  const { currentProject } = useProject()
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')

  useEffect(() => {
    if (projectId) {
      loadComponents()
    }
  }, [projectId])

  const loadComponents = async () => {
    if (!projectId) return
    try {
      setLoading(true)
      setError(null)
      const data = await componentsApi.getAll(projectId)
      setComponents(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load components')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load components',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOpen = () => {
    setFormName('')
    setFormSlug('')
    setCreateOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!projectId || !formName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' })
      return
    }
    const slug = formSlug.trim() || slugFromName(formName)
    if (!slug) {
      toast({ title: 'Slug is required', variant: 'destructive' })
      return
    }
    try {
      setSaving(true)
      await componentsApi.create({
        projectId,
        name: formName.trim(),
        slug,
      })
      toast({ title: 'Success', description: 'Component created' })
      setCreateOpen(false)
      await loadComponents()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to create component', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleEditOpen = (c: Component) => {
    setEditingComponent(c)
    setFormName(c.name)
    setFormSlug(c.slug)
    setEditOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingComponent || !formName.trim()) return
    const slug = formSlug.trim() || slugFromName(formName)
    try {
      setSaving(true)
      await componentsApi.update(editingComponent.id, { name: formName.trim(), slug })
      toast({ title: 'Success', description: 'Component updated' })
      setEditOpen(false)
      setEditingComponent(null)
      await loadComponents()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to update component', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Component) => {
    if (!confirm(`Delete component "${c.name}"? This cannot be undone.`)) return
    try {
      setDeletingId(c.id)
      await componentsApi.delete(c.id)
      toast({ title: 'Success', description: 'Component deleted' })
      await loadComponents()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete component', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <ProjectRouteGuard>
      <DashboardLayout
        basePath="/dashboard"
        title="Components"
        subtitle="Reusable blocks of fields for content models"
        icon={<Puzzle className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Components</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Create reusable components and reference them in your content models (e.g. SEO block, metadata).
              </p>
            </div>
            <Button onClick={handleCreateOpen}>
              <Plus className="h-4 w-4 mr-2" />
              Create Component
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : components.length === 0 ? (
            <div className="border rounded-lg bg-muted/30 p-12 text-center">
              <Puzzle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No components yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a component to reuse a block of fields across content models.
              </p>
              <Button onClick={handleCreateOpen}>
                <Plus className="h-4 w-4 mr-2" />
                Create Component
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                      <TableCell>{c.fields?.length ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOpen(c)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c)}
                            disabled={deletingId === c.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Create modal */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Component</DialogTitle>
              <DialogDescription>
                Reusable block of fields. You can add fields after creating, or reference this component in a content model.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Name</Label>
                <Input
                  id="create-name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    if (!formSlug) setFormSlug(slugFromName(e.target.value))
                  }}
                  placeholder="e.g. SEO Block"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug</Label>
                <Input
                  id="create-slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. seo_block"
                />
                <p className="text-xs text-muted-foreground">Unique identifier; no spaces.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit modal */}
        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingComponent(null) }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Component</DialogTitle>
              <DialogDescription>Update name and slug.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. SEO Block"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. seo_block"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProjectRouteGuard>
  )
}
