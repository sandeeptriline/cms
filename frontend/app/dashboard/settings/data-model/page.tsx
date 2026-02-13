'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Database,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import { formElementsApi } from '@/lib/api/form-elements'
import { useToast } from '@/lib/hooks/use-toast'
import { CreateContentTypeModal } from './components/create-content-type-modal'
import { EditContentTypeModal } from './components/edit-content-type-modal'
import { AddFieldModal } from './components/add-field-modal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

export default function DataModelPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contentTypeToDelete, setContentTypeToDelete] = useState<ContentType | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false)
  const [contentTypeForField, setContentTypeForField] = useState<ContentType | null>(null)
  const [activeTab, setActiveTab] = useState<'content-types' | 'form-elements'>('content-types')
  const [formElements, setFormElements] = useState<FormElement[]>([])
  const [formElementsLoading, setFormElementsLoading] = useState(false)

  useEffect(() => {
    loadContentTypes()
    loadFormElements()
  }, [])

  useEffect(() => {
    if (activeTab === 'form-elements') {
      loadFormElements()
    }
  }, [activeTab])

  const loadContentTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contentTypesApi.getAll()
      setContentTypes(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load content types')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load content types',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedContentType(null)
    setCreateModalOpen(true)
  }

  const handleEdit = (contentType: ContentType) => {
    setSelectedContentType(contentType)
    setEditModalOpen(true)
  }

  const handleDeleteClick = (contentType: ContentType) => {
    setContentTypeToDelete(contentType)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contentTypeToDelete) return

    try {
      setDeleting(true)
      await contentTypesApi.delete(contentTypeToDelete.id)
      toast({
        title: 'Success',
        description: 'Content type deleted successfully',
      })
      setDeleteDialogOpen(false)
      setContentTypeToDelete(null)
      loadContentTypes()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete content type',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleViewFields = (contentType: ContentType) => {
    router.push(`/dashboard/settings/data-model/${contentType.id}/fields`)
  }

  const handleAddField = (contentType: ContentType) => {
    setContentTypeForField(contentType)
    setAddFieldModalOpen(true)
  }

  const handleFieldAdded = () => {
    setAddFieldModalOpen(false)
    setContentTypeForField(null)
    loadContentTypes() // Refresh to show new field count
  }

  const loadFormElements = async () => {
    try {
      setFormElementsLoading(true)
      const data = await formElementsApi.getAll()
      setFormElements(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({
        title: 'Error',
        description: e.message || 'Failed to load form elements',
        variant: 'destructive',
      })
    } finally {
      setFormElementsLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        basePath="/dashboard"
        title="Data Model"
        icon={<Database className="h-5 w-5" />}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading content types...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      basePath="/dashboard"
      title="Data Model"
      icon={<Database className="h-5 w-5" />}
    >
      <div className="flex-1 bg-background">
        <div className="px-6 py-6">
          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('content-types')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'content-types'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Content Types
            </button>
            <button
              onClick={() => setActiveTab('form-elements')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'form-elements'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Form Elements Library
            </button>
          </div>

          {/* Content Types Tab */}
          {activeTab === 'content-types' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Content Types</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your content schemas and field definitions
                  </p>
                </div>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content Type
                </Button>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Content Types Table */}
          {contentTypes.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content types</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first content type
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Content Type
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Collection</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentTypes.map((contentType) => (
                    <TableRow key={contentType.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {contentType.icon && (
                            <span className="text-lg">{contentType.icon}</span>
                          )}
                          {contentType.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {contentType.collection}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {contentType.fields?.length || 0} fields
                        </span>
                      </TableCell>
                      <TableCell>
                        {contentType.singleton ? (
                          <Badge variant="secondary">Singleton</Badge>
                        ) : (
                          <Badge variant="outline">Collection</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contentType.hidden ? (
                            <Badge variant="secondary" className="gap-1">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <Eye className="h-3 w-3" />
                              Visible
                            </Badge>
                          )}
                          {contentType.is_system && (
                            <Badge variant="outline">System</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewFields(contentType)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View Fields
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddField(contentType)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add new field
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(contentType)}
                              disabled={contentType.is_system}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(contentType)}
                              disabled={contentType.is_system}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
            </>

          )}

          {/* Form Elements Tab */}
          {activeTab === 'form-elements' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Form Elements Library</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Available field types for creating content types
                  </p>
                </div>
              </div>

              {/* Form Elements Grid */}
              {formElementsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading form elements...</span>
                </div>
              ) : formElements.length === 0 ? (
                <div className="border rounded-lg p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No form elements</h3>
                  <p className="text-sm text-muted-foreground">
                    Form elements will appear here once seeded in the database
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formElements.map((element) => (
                    <div
                      key={element.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {element.icon && (
                            <span
                              className="text-lg"
                              style={{ color: element.icon_color || undefined }}
                            >
                              {element.icon}
                            </span>
                          )}
                          <div>
                            <h3 className="font-semibold">{element.name}</h3>
                            <code className="text-xs text-muted-foreground">{element.key}</code>
                          </div>
                        </div>
                        {element.is_system && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                      {element.description && (
                        <p className="text-sm text-muted-foreground mb-3">{element.description}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        {element.category && (
                          <Badge variant="secondary" className="text-xs">
                            {element.category}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {element.type}
                        </Badge>
                        {element.supports_conditions && (
                          <Badge variant="outline" className="text-xs">Conditions</Badge>
                        )}
                        {element.supports_translations && (
                          <Badge variant="outline" className="text-xs">Translations</Badge>
                        )}
                        {element.supports_relations && (
                          <Badge variant="outline" className="text-xs">Relations</Badge>
                        )}
                      </div>
                      {element.variants && element.variants.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Variants:</p>
                          <div className="flex gap-1 flex-wrap">
                            {element.variants.map((variant: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {variant.name || variant.key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <CreateContentTypeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadContentTypes}
      />

      {/* Edit Modal */}
      {selectedContentType && (
        <EditContentTypeModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          contentType={selectedContentType}
          onSuccess={loadContentTypes}
        />
      )}

      {/* Add Field Modal (Combined Selection + Configuration) */}
      {contentTypeForField && (
        <AddFieldModal
          open={addFieldModalOpen}
          onOpenChange={setAddFieldModalOpen}
          contentTypeId={contentTypeForField.id}
          contentTypeName={contentTypeForField.name}
          onSuccess={handleFieldAdded}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contentTypeToDelete?.name}"? This action cannot be
              undone. Make sure there are no content entries using this content type.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
