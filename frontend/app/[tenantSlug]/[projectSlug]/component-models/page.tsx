'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout, SecondarySidebarItem } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Puzzle, Plus, Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { componentsApi, Component } from '@/lib/api/components'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/lib/hooks/use-toast'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ComponentModelView } from '@/app/dashboard/settings/projects/[projectId]/components/component-model-view'
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

/** Component models at /[tenantSlug]/[projectSlug]/component-models */
export default function ProjectComponentModelsPage() {
  const { toast } = useToast()
  const { currentProject, loading: projectLoading } = useProject()
  const projectId = currentProject?.id ?? null
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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  useEffect(() => {
    if (currentProject && projectId === currentProject.id && !projectLoading) {
      loadComponents()
    } else if (!projectLoading && (!currentProject || !projectId)) {
      setLoading(false)
      setError('Project not found or not selected.')
    }
  }, [currentProject, projectId, projectLoading])

  useEffect(() => {
    if (!loading && components.length > 0 && !selectedComponentId) {
      setSelectedComponentId(components[0].id)
    }
  }, [loading, components, selectedComponentId])

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
      const created = await componentsApi.create({
        projectId,
        name: formName.trim(),
        slug,
      })
      toast({ title: 'Success', description: 'Component created' })
      setCreateOpen(false)
      await loadComponents()
      setSelectedComponentId(created.id)
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
      if (selectedComponentId === c.id) setSelectedComponentId(components.find((x) => x.id !== c.id)?.id ?? null)
      await loadComponents()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete component', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleSidebarItemClick = (item: SecondarySidebarItem) => {
    if (item.id === 'create-component') {
      setCreateOpen(true)
    } else if (item.id && item.id !== 'component-label' && item.id !== 'divider') {
      setSelectedComponentId(item.id)
    }
  }

  const sidebarItems: SecondarySidebarItem[] = [
    { id: 'component-label', name: 'Component Model', isLabel: true },
    { id: 'create-component', name: 'Create Component', icon: 'Plus', isIconButton: true },
    ...(components.length > 0 ? [{ id: 'divider', name: '', divider: true } as SecondarySidebarItem] : []),
    ...components.map((c) => ({
      id: c.id,
      name: c.name,
      icon: 'Puzzle' as const,
      indent: true,
    })),
  ]

  const sidebarItemsWithActive = sidebarItems.map((item) => ({
    ...item,
    ...(item.id === selectedComponentId && { isActive: true }),
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

  const selectedComponent = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId)
    : null

  return (
    <ProtectedRoute>
      {loading ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Component Models"
          icon={<Puzzle className="h-5 w-5" />}
          secondarySidebarItems={[]}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading…</span>
          </div>
        </DashboardLayout>
      ) : components.length === 0 ? (
        <DashboardLayout
          basePath="/dashboard"
          title="Component Models"
          subtitle="Reusable blocks of fields for content models"
          icon={<Puzzle className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          <div className="flex-1 bg-background">
            <div className="px-6 py-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
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
            </div>
          </div>
        </DashboardLayout>
      ) : (
        <DashboardLayout
          basePath="/dashboard"
          title="Component Models"
          subtitle="Reusable blocks of fields for content models"
          icon={<Puzzle className="h-5 w-5" />}
          secondarySidebarItems={sidebarItemsWithActive}
          onSidebarItemClick={handleSidebarItemClick}
        >
          {selectedComponentId && projectId ? (
            <ComponentModelView
              componentId={selectedComponentId}
              projectId={projectId}
              onRefresh={loadComponents}
              onEditComponent={selectedComponent ? () => handleEditOpen(selectedComponent) : undefined}
              onDeleteComponent={selectedComponent ? () => handleDelete(selectedComponent) : undefined}
            />
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Select a component from the sidebar
            </div>
          )}
        </DashboardLayout>
      )}

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
    </ProtectedRoute>
  )
}
