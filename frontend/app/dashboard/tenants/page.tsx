'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { PlatformAdminRoute } from '@/components/auth/platform-admin-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { tenantsApi, Tenant } from '@/lib/api/tenants'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GripVertical, 
  Loader2, 
  AlertCircle, 
  Building2,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/lib/hooks/use-toast'
import { Input } from '@/components/ui/input'

export default function TenantsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantsApi.getAll()
      setTenants(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load tenants')
      toast({
        title: 'Error',
        description: err.message || 'Failed to load tenants',
        variant: 'destructive',
      })
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
    if (selectedItems.length === tenants.length && tenants.length > 0) {
      setSelectedItems([])
    } else {
      setSelectedItems(tenants.map((item) => item.id))
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await tenantsApi.activate(id)
      toast({
        title: 'Success',
        description: 'Tenant activated successfully',
      })
      loadTenants()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to activate tenant',
        variant: 'destructive',
      })
    }
  }

  const handleSuspend = async (id: string) => {
    try {
      await tenantsApi.suspend(id)
      toast({
        title: 'Success',
        description: 'Tenant suspended successfully',
      })
      loadTenants()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to suspend tenant',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return
    }
    try {
      await tenantsApi.delete(id)
      toast({
        title: 'Success',
        description: 'Tenant deleted successfully',
      })
      loadTenants()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete tenant',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const variants = {
      active: 'default',
      suspended: 'secondary',
      provisioning: 'outline',
      deleted: 'destructive',
    } as const

    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      provisioning: 'bg-blue-100 text-blue-800 border-blue-200',
      deleted: 'bg-red-100 text-red-800 border-red-200',
    }

    return (
      <Badge 
        variant={variants[status] || 'outline'}
        className={cn('text-xs font-medium', colors[status])}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredTenants = tenants.filter((tenant) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      tenant.name.toLowerCase().includes(query) ||
      tenant.slug.toLowerCase().includes(query) ||
      tenant.id.toLowerCase().includes(query)
    )
  })

  return (
    <ProtectedRoute>
      <PlatformAdminRoute>
        <DashboardLayout 
        title="Tenants" 
        itemCount={filteredTenants.length}
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="flex-1 bg-background">
          {/* Search and Actions Bar */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Button onClick={() => router.push('/dashboard/tenants/new')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </div>

          {error && (
            <div className="px-6 pt-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading tenants...</span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery ? 'No tenants found matching your search' : 'No tenants found'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/dashboard/tenants/new')} 
                  variant="outline"
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Tenant
                </Button>
              )}
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
                            filteredTenants.length > 0 &&
                            selectedItems.length === filteredTenants.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-12 h-12 px-4"></TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Name</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Slug</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Status</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Database</TableHead>
                      <TableHead className="h-12 px-4 font-medium text-foreground">Created</TableHead>
                      <TableHead className="w-12 h-12 px-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow
                        key={tenant.id}
                        className={cn(
                          'border-b border-border cursor-pointer transition-colors',
                          selectedItems.includes(tenant.id) && 'bg-muted/30',
                          'hover:bg-muted/50'
                        )}
                        onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
                      >
                        <TableCell className="h-12 px-4">
                          <Checkbox
                            checked={selectedItems.includes(tenant.id)}
                            onCheckedChange={() => toggleSelect(tenant.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        </TableCell>
                        <TableCell className="h-12 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <span className="text-muted-foreground text-sm font-mono">{tenant.slug}</span>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          {getStatusBadge(tenant.status)}
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <span className="text-muted-foreground text-sm font-mono">{tenant.dbName}</span>
                        </TableCell>
                        <TableCell className="h-12 px-4">
                          <span className="text-muted-foreground text-sm">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="h-12 px-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/tenants/${tenant.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {tenant.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleActivate(tenant.id)}>
                                  <Play className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              ) : tenant.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleSuspend(tenant.id)}>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Suspend
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(tenant.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
            </div>
          )}
        </div>
      </DashboardLayout>
      </PlatformAdminRoute>
    </ProtectedRoute>
  )
}
