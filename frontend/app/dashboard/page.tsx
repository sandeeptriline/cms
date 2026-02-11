'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { contentApi, ContentType } from '@/lib/api/content'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { GripVertical, CheckCircle2, Loader2, AlertCircle, Database, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()
  const isPlatformAdmin = isSuperAdmin(user?.roles)
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  useEffect(() => {
    // Only load content types for tenant admin users
    if (!isPlatformAdmin) {
      loadContentTypes()
    } else {
      setLoading(false)
    }
  }, [isPlatformAdmin])

  const loadContentTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      // TODO: Backend endpoint GET /api/v1/content-types needs to be implemented
      // For now, this will fail gracefully and show an empty state
      const response = await contentApi.getAll()
      setContentTypes(response.data || [])
    } catch (err: any) {
      // API endpoint not implemented yet - show empty state
      if (err.response?.status === 404) {
        setContentTypes([])
        setError('Content types API endpoint not implemented yet. Please implement GET /api/v1/content-types in the backend.')
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

  // Platform Admin Dashboard
  if (isPlatformAdmin) {
    return (
      <ProtectedRoute>
        <DashboardLayout 
          title="Platform Dashboard" 
          icon={<Database className="h-5 w-5" />}
        >
          <div className="flex-1 bg-background">
            <div className="px-6 py-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Quick Stats Cards */}
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                      <p className="text-2xl font-bold mt-1">-</p>
                    </div>
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                      <p className="text-2xl font-bold mt-1">-</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Provisioning</p>
                      <p className="text-2xl font-bold mt-1">-</p>
                    </div>
                    <Loader2 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Link href="/dashboard/tenants/new">
                    <div className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                      <Building2 className="h-6 w-6 text-primary mb-2" />
                      <h4 className="font-semibold mb-1">Create New Tenant</h4>
                      <p className="text-sm text-muted-foreground">Provision a new tenant in the platform</p>
                    </div>
                  </Link>
                  <Link href="/dashboard/tenants">
                    <div className="rounded-lg border border-border bg-card p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                      <Database className="h-6 w-6 text-primary mb-2" />
                      <h4 className="font-semibold mb-1">Manage Tenants</h4>
                      <p className="text-sm text-muted-foreground">View and manage all tenants</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
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

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading content types...</span>
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
                            {item.fields ?? 0} {item.fields === 1 ? 'Field' : 'Fields'}
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
