'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { contentTypesApi, ContentType, ContentTypeField } from '@/lib/api/content-types'
import { useToast } from '@/lib/hooks/use-toast'
import { AddFieldModal } from '../../components/add-field-modal'

export default function ContentTypeFieldsPage() {
  const router = useRouter()
  const params = useParams()
  const contentTypeId = params.id as string
  const { toast } = useToast()
  
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addFieldModalOpen, setAddFieldModalOpen] = useState(false)

  useEffect(() => {
    if (contentTypeId) {
      loadContentType()
    }
  }, [contentTypeId])

  const loadContentType = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contentTypesApi.getById(contentTypeId)
      setContentType(data)
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

  const handleAddField = () => {
    setAddFieldModalOpen(true)
  }

  const handleFieldAdded = () => {
    setAddFieldModalOpen(false)
    loadContentType() // Refresh to show new field
  }

  if (loading) {
    return (
      <DashboardLayout
        basePath="/dashboard"
        title="Content Type Fields"
        icon={<Database className="h-5 w-5" />}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading content type...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !contentType) {
    return (
      <DashboardLayout
        basePath="/dashboard"
        title="Content Type Fields"
        icon={<Database className="h-5 w-5" />}
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Content type not found'}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/settings/data-model')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Content Types
        </Button>
      </DashboardLayout>
    )
  }

  const fields = contentType.fields || []

  return (
    <DashboardLayout
      basePath="/dashboard"
      title="Content Type Fields"
      icon={<Database className="h-5 w-5" />}
    >
      <div className="flex-1 bg-background">
        <div className="px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/settings/data-model')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  {contentType.icon && (
                    <span className="text-2xl">{contentType.icon}</span>
                  )}
                  <h2 className="text-2xl font-semibold">{contentType.name}</h2>
                  {contentType.is_system && (
                    <Badge variant="outline">System</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {contentType.collection}
                  </code>
                  {contentType.singleton && (
                    <Badge variant="secondary">Singleton</Badge>
                  )}
                  {contentType.hidden && (
                    <Badge variant="secondary" className="gap-1">
                      <EyeOff className="h-3 w-3" />
                      Hidden
                    </Badge>
                  )}
                </div>
                {contentType.note && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {contentType.note}
                  </p>
                )}
              </div>
            </div>
            <Button onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              Add new field
            </Button>
          </div>

          {/* Fields Table */}
          {fields.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first field to this Collection-Type
              </p>
              <Button onClick={handleAddField}>
                <Plus className="h-4 w-4 mr-2" />
                Add new field
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Interface</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields
                    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                    .map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {field.field}
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {field.interface || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {field.options && typeof field.options === 'object' && (
                              <>
                                {field.options.variant && (
                                  <Badge variant="secondary" className="text-xs">
                                    {field.options.variant}
                                  </Badge>
                                )}
                                {field.options.placeholder && (
                                  <span className="text-xs text-muted-foreground">
                                    Placeholder: {field.options.placeholder}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {field.hidden && (
                              <Badge variant="secondary" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Hidden
                              </Badge>
                            )}
                            {field.readonly && (
                              <Badge variant="secondary" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Readonly
                              </Badge>
                            )}
                            {!field.hidden && !field.readonly && (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement edit field
                                toast({
                                  title: 'Info',
                                  description: 'Edit field functionality coming soon',
                                })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement delete field
                                toast({
                                  title: 'Info',
                                  description: 'Delete field functionality coming soon',
                                })
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add Field Modal (Combined Selection + Configuration) */}
          <AddFieldModal
            open={addFieldModalOpen}
            onOpenChange={setAddFieldModalOpen}
            contentTypeId={contentType.id}
            contentTypeName={contentType.name}
            onSuccess={handleFieldAdded}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
