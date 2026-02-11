'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PlatformAdminRoute } from '@/components/auth/platform-admin-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, Tenant, UpdateTenantDto } from '@/lib/api/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

const updateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

type UpdateTenantFormData = z.infer<typeof updateTenantSchema>

export default function EditTenantPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
  })

  useEffect(() => {
    if (tenantId) {
      loadTenant()
    }
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantsApi.getById(tenantId)
      setTenant(data)
      reset({
        name: data.name,
        slug: data.slug,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant')
      toast({
        title: 'Error',
        description: err.message || 'Failed to load tenant',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: UpdateTenantFormData) => {
    setIsSaving(true)
    setError(null)

    try {
      const updateData: UpdateTenantDto = {}
      if (data.name && data.name !== tenant?.name) {
        updateData.name = data.name
      }
      if (data.slug && data.slug !== tenant?.slug) {
        updateData.slug = data.slug
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes to save',
        })
        return
      }

      await tenantsApi.update(tenantId, updateData)
      
      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
      })

      router.push(`/dashboard/tenants/${tenantId}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update tenant'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <PlatformAdminRoute>
          <DashboardLayout title="Edit Tenant" icon={<Building2 className="h-5 w-5" />}>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading tenant...</span>
            </div>
          </DashboardLayout>
        </PlatformAdminRoute>
      </ProtectedRoute>
    )
  }

  if (error || !tenant) {
    return (
      <ProtectedRoute>
        <PlatformAdminRoute>
          <DashboardLayout title="Edit Tenant" icon={<Building2 className="h-5 w-5" />}>
            <div className="px-6 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || 'Tenant not found'}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <Link href="/dashboard/tenants">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tenants
                  </Button>
                </Link>
              </div>
            </div>
          </DashboardLayout>
        </PlatformAdminRoute>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <PlatformAdminRoute>
        <DashboardLayout 
        title="Edit Tenant" 
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          <div className="px-6 py-4 border-b border-border">
            <Link 
              href={`/dashboard/tenants/${tenantId}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenant Details
            </Link>
          </div>

          <div className="px-6 py-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Edit Tenant</CardTitle>
                <CardDescription>
                  Update tenant information. Changes will be saved immediately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tenant Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Acme Corporation"
                      {...register('name')}
                      disabled={isSaving}
                      className="h-11"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      A descriptive name for the tenant
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="acme-corporation"
                      {...register('slug')}
                      disabled={isSaving}
                      className="h-11 font-mono"
                    />
                    {errors.slug && (
                      <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      URL-friendly identifier (lowercase letters, numbers, and hyphens only)
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
      </PlatformAdminRoute>
    </ProtectedRoute>
  )
}
