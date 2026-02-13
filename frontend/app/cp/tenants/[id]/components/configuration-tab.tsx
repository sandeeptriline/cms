'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Settings,
  Database,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Copy,
  HardDrive,
  Zap,
  Users,
} from 'lucide-react'
import { Tenant } from '@/lib/api/tenants'
import { tenantsApi, UpdateTenantDto } from '@/lib/api/tenants'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/hooks/use-toast'

interface ConfigurationTabProps {
  tenant: Tenant
  onRefresh: () => void
}

const configurationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name must be less than 255 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100, 'Slug must be less than 100 characters'),
  status: z.enum(['provisioning', 'active', 'suspended', 'deleted']),
  storageLimit: z.number().min(0).optional(),
  apiCallsLimit: z.number().min(0).optional(),
  usersLimit: z.number().min(0).optional(),
})

type ConfigurationFormData = z.infer<typeof configurationSchema>

export function ConfigurationTab({ tenant, onRefresh }: ConfigurationTabProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    featureFlags: true,
    usageLimits: true,
    database: false,
    advanced: false,
  })
  const [showConnectionString, setShowConnectionString] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      storageLimit: tenant.usageLimits?.storage,
      apiCallsLimit: tenant.usageLimits?.apiCalls,
      usersLimit: tenant.usageLimits?.users,
    },
  })

  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(
    tenant.featureFlags || {}
  )

  useEffect(() => {
    reset({
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      storageLimit: tenant.usageLimits?.storage,
      apiCallsLimit: tenant.usageLimits?.apiCalls,
      usersLimit: tenant.usageLimits?.users,
    })
    setFeatureFlags(tenant.featureFlags || {})
  }, [tenant, reset])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleFeatureFlag = (flag: string) => {
    setFeatureFlags((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }))
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast({
      title: 'Copied',
      description: `${field} copied to clipboard`,
    })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const onSubmit = async (data: ConfigurationFormData) => {
    setIsSaving(true)
    setError(null)
    try {
      const updateData: UpdateTenantDto = {
        name: data.name,
        slug: data.slug,
        status: data.status,
        featureFlags: featureFlags,
        usageLimits: {
          storage: data.storageLimit,
          apiCalls: data.apiCallsLimit,
          users: data.usersLimit,
        },
      }

      await tenantsApi.update(tenant.id, updateData)
      toast({ title: 'Success', description: 'Configuration saved successfully' })
      onRefresh()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to save configuration')
      toast({ title: 'Error', description: e.message || 'Failed to save configuration', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const storageUsed = tenant.storageUsed ? parseFloat(tenant.storageUsed) : 0
  const storageLimit = watch('storageLimit') || tenant.usageLimits?.storage || 0
  const storagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0

  const apiCallsToday = tenant.apiCallsToday || 0
  const apiCallsLimit = watch('apiCallsLimit') || tenant.usageLimits?.apiCalls || 0
  const apiCallsPercent = apiCallsLimit > 0 ? (apiCallsToday / apiCallsLimit) * 100 : 0

  const usersCount = tenant.usersCount || 0
  const usersLimit = watch('usersLimit') || tenant.usageLimits?.users || 0
  const usersPercent = usersLimit > 0 ? (usersCount / usersLimit) * 100 : 0

  // Common feature flags
  const commonFeatureFlags = [
    { key: 'analytics', label: 'Analytics', description: 'Enable analytics tracking' },
    { key: 'apiAccess', label: 'API Access', description: 'Allow API access' },
    { key: 'advancedSearch', label: 'Advanced Search', description: 'Enable advanced search features' },
    { key: 'webhooks', label: 'Webhooks', description: 'Enable webhook notifications' },
    { key: 'customThemes', label: 'Custom Themes', description: 'Allow custom theme configuration' },
  ]

  return (
    <div className="px-6 py-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Basic Settings</CardTitle>
                <CardDescription>Tenant identification and status</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleSection('basic')}
              >
                {expandedSections.basic ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.basic && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tenant Name <span className="text-destructive">*</span></Label>
                  <Input id="name" {...register('name')} disabled={isSaving} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                  <Input id="slug" {...register('slug')} disabled={isSaving} className="font-mono" />
                  {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
                  <p className="text-xs text-muted-foreground">URL-friendly identifier</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  {...register('status')}
                  disabled={isSaving}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="provisioning">Provisioning</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Feature Flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>Enable or disable features for this tenant</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleSection('featureFlags')}
              >
                {expandedSections.featureFlags ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.featureFlags && (
            <CardContent>
              <div className="space-y-4">
                {commonFeatureFlags.map((flag) => (
                  <div key={flag.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{flag.label}</div>
                      <div className="text-sm text-muted-foreground">{flag.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFeatureFlag(flag.key)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        featureFlags[flag.key]
                          ? 'bg-primary'
                          : 'bg-muted'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          featureFlags[flag.key] ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Usage Limits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>Set limits for storage, API calls, and users</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleSection('usageLimits')}
              >
                {expandedSections.usageLimits ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.usageLimits && (
            <CardContent className="space-y-6">
              {/* Storage Limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="storageLimit" className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    Storage Limit (GB)
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {storageUsed.toFixed(1)} / {storageLimit > 0 ? storageLimit.toFixed(1) : '∞'} GB
                  </span>
                </div>
                <Input
                  id="storageLimit"
                  type="number"
                  min="0"
                  step="0.1"
                  {...register('storageLimit', { valueAsNumber: true })}
                  disabled={isSaving}
                  placeholder="0 for unlimited"
                />
                {storageLimit > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        storagePercent > 90
                          ? 'bg-red-500'
                          : storagePercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(storagePercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* API Calls Limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiCallsLimit" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    API Calls Limit (per day)
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {apiCallsToday} / {apiCallsLimit > 0 ? apiCallsLimit : '∞'} today
                  </span>
                </div>
                <Input
                  id="apiCallsLimit"
                  type="number"
                  min="0"
                  {...register('apiCallsLimit', { valueAsNumber: true })}
                  disabled={isSaving}
                  placeholder="0 for unlimited"
                />
                {apiCallsLimit > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        apiCallsPercent > 90
                          ? 'bg-red-500'
                          : apiCallsPercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(apiCallsPercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Users Limit */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="usersLimit" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users Limit
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {usersCount} / {usersLimit > 0 ? usersLimit : '∞'} users
                  </span>
                </div>
                <Input
                  id="usersLimit"
                  type="number"
                  min="0"
                  {...register('usersLimit', { valueAsNumber: true })}
                  disabled={isSaving}
                  placeholder="0 for unlimited"
                />
                {usersLimit > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        usersPercent > 90
                          ? 'bg-red-500'
                          : usersPercent > 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(usersPercent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Database Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Database Information</CardTitle>
                <CardDescription>Tenant database connection details</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleSection('database')}
              >
                {expandedSections.database ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.database && (
            <CardContent className="space-y-4">
              <div>
                <Label>Database Name</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={tenant.dbName} readOnly className="font-mono" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(tenant.dbName, 'Database Name')}
                  >
                    {copiedField === 'Database Name' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {tenant.dbHost && (
                <div>
                  <Label>Database Host</Label>
                  <Input value={tenant.dbHost} readOnly className="font-mono mt-1" />
                </div>
              )}
              {tenant.dbConnection && (
                <div>
                  <Label>Connection String</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type={showConnectionString ? 'text' : 'password'}
                      value={tenant.dbConnection}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConnectionString(!showConnectionString)}
                    >
                      {showConnectionString ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(tenant.dbConnection || '', 'Connection String')}
                    >
                      {copiedField === 'Connection String' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Custom configuration (JSON)</CardDescription>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => toggleSection('advanced')}
              >
                {expandedSections.advanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.advanced && (
            <CardContent>
              <div className="space-y-2">
                <Label>Configuration (JSON)</Label>
                <textarea
                  readOnly
                  value={JSON.stringify(tenant.config || {}, null, 2)}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Advanced configuration editing will be available in a future update
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
