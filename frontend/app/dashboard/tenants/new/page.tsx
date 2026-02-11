'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PlatformAdminRoute } from '@/components/auth/platform-admin-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, CreateTenantDto } from '@/lib/api/tenants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/hooks/use-toast'
import Link from 'next/link'

const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

type CreateTenantFormData = z.infer<typeof createTenantSchema>

export default function NewTenantPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
  })

  const watchedName = watch('name')

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50)
  }

  const onSubmit = async (data: CreateTenantFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const tenantData: CreateTenantDto = {
        name: data.name,
        slug: data.slug,
      }

      const tenant = await tenantsApi.create(tenantData)
      
      toast({
        title: 'Success',
        description: `Tenant "${tenant.name}" created successfully`,
      })

      router.push(`/dashboard/tenants/${tenant.id}`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create tenant'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <PlatformAdminRoute>
        <DashboardLayout 
        title="Create Tenant" 
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          <div className="px-6 py-4 border-b border-border">
            <Link 
              href="/dashboard/tenants"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </div>

          <div className="px-6 py-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Create New Tenant</CardTitle>
                <CardDescription>
                  Create a new tenant in the platform. The tenant will be provisioned automatically.
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
                    <Label htmlFor="name">
                      Tenant Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Acme Corporation"
                      {...register('name')}
                      disabled={isLoading}
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
                    <Label htmlFor="slug">
                      Slug <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="acme-corporation"
                      {...register('slug', {
                        onChange: (e) => {
                          // Auto-generate slug if name is provided and slug is empty
                          if (watchedName && !e.target.value) {
                            const generatedSlug = generateSlug(watchedName)
                            e.target.value = generatedSlug
                          }
                        },
                      })}
                      disabled={isLoading}
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
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Tenant'
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
