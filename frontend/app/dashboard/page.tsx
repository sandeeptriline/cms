'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/contexts/auth-context'
import { useProject } from '@/contexts/project-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { contentTypesApi, ContentType } from '@/lib/api/content-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, CheckCircle2, Loader2, AlertCircle, Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const isPlatformAdmin = isSuperAdmin(user?.roles)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Super Admin should use Control Panel at /cp
  useEffect(() => {
    if (!authLoading && isPlatformAdmin) {
      router.replace('/cp')
      return
    }
  }, [authLoading, isPlatformAdmin, router])

  const { currentProject, loading: projectLoading } = useProject()

  useEffect(() => {
    if (!isPlatformAdmin && currentProject) {
      loadContentTypes()
    } else if (!isPlatformAdmin && !projectLoading && !currentProject) {
      setLoading(false)
      setContentTypes([])
    } else if (isPlatformAdmin) {
      setLoading(false)
    }
  }, [isPlatformAdmin, currentProject, projectLoading])

  const loadContentTypes = async () => {
    if (!currentProject) return
    try {
      setLoading(true)
      setError(null)
      const data = await contentTypesApi.getAll(currentProject.id)
      setContentTypes(Array.isArray(data) ? data : [])
    } catch (err: any) {
      if (err.response?.status === 404) {
        setContentTypes([])
      } else {
        setError(err.message || 'Failed to load content types')
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedItems.length === contentTypes.length && contentTypes.length > 0) {
      setSelectedItems([])
    } else {
      setSelectedItems(contentTypes.map((item) => item.id))
    }
  }

  // Redirecting Super Admin to /cp (handled in useEffect above)
  if (isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Redirecting to Control Panel...</span>
      </div>
    )
  }

  // Tenant Admin Dashboard (Content Types)
  return (
    <ProtectedRoute>
      <DashboardLayout 
        title="Content Types" 
        itemCount={contentTypes.length}
        icon={<Database className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          {error && (
            <div className="px-6 pt-4">
              <Alert variant="default" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {(loading || (projectLoading && !currentProject)) ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading content types...</span>
            </div>
          ) : !currentProject && !projectLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No project selected</p>
              <p className="text-sm text-muted-foreground">
                Create or select a project in Settings to manage content types
              </p>
            </div>
          ) : contentTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No content types found</p>
              <p className="text-sm text-muted-foreground">
                Create your first content type to get started
              </p>
            </div>
          ) : (
            <div className="px-6 py-4">
              <div className="rounded-md border border-border bg-background overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="w-12 h-12 px-4">
                        <Checkbox
                          checked={
                            contentTypes.length > 0 &&
                            selectedItems.length === contentTypes.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12 h-12 px-4"></TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Name</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Collection</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Fields</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentTypes.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'border-b border-border cursor-pointer transition-colors',
                          selectedItems.includes(item.id) && 'bg-muted/30',
                          'hover:bg-muted/50'
                        )}
                      >
                        <TableCell className="h-12 px-4">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        </TableCell>
                        <TableCell className="h-12 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            {item.icon && (
                              <span className="text-muted-foreground">{item.icon}</span>
                            )}
                            <span className="text-foreground">
                              {item.name || (
                                <span className="text-muted-foreground italic">Untitled</span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <span className="text-muted-foreground text-sm">{item.collection}</span>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <span className="text-muted-foreground text-sm">
                            {Array.isArray(item.fields) ? item.fields.length : 0} {Array.isArray(item.fields) && item.fields.length === 1 ? 'Field' : 'Fields'}
                          </span>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          {!item.hidden ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-foreground">Active</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Hidden</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
