'use client'

import { useState, useEffect } from 'react'
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
  Eye,
  Filter,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/utils/date'
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
import { Pagination } from '@/components/ui/pagination'

export default function CpTenantsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<Tenant['status'] | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await tenantsApi.getAll()
      setTenants(data || [])
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to load tenants')
      toast({
        title: 'Error',
        description: e.message || 'Failed to load tenants',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter((t) => {
    // Status filter
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false
    }
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    }
    
    return true
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTenants = filteredTenants.slice(startIndex, endIndex)

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const visibleIds = paginatedTenants.map((item) => item.id)
    const allVisibleSelected = visibleIds.every((id) => selectedItems.includes(id))
    
    if (allVisibleSelected) {
      // Deselect all visible items
      setSelectedItems((prev) => prev.filter((id) => !visibleIds.includes(id)))
    } else {
      // Select all visible items (merge with existing selections)
      setSelectedItems((prev) => {
        const newSelection = [...prev]
        visibleIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id)
          }
        })
        return newSelection
      })
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await tenantsApi.activate(id)
      toast({ title: 'Success', description: 'Tenant activated successfully' })
      loadTenants()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to activate tenant', variant: 'destructive' })
    }
  }

  const handleSuspend = async (id: string) => {
    try {
      await tenantsApi.suspend(id)
      toast({ title: 'Success', description: 'Tenant suspended successfully' })
      loadTenants()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to suspend tenant', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return
    try {
      await tenantsApi.delete(id)
      toast({ title: 'Success', description: 'Tenant deleted successfully' })
      loadTenants()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast({ title: 'Error', description: e.message || 'Failed to delete tenant', variant: 'destructive' })
    }
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const variants = { active: 'default', suspended: 'secondary', provisioning: 'outline', deleted: 'destructive' } as const
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      provisioning: 'bg-blue-100 text-blue-800 border-blue-200',
      deleted: 'bg-red-100 text-red-800 border-red-200',
    }
    return (
      <Badge variant={variants[status] || 'outline'} className={cn('text-xs font-medium', colors[status])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const statusCounts = {
    all: tenants.length,
    active: tenants.filter((t) => t.status === 'active').length,
    suspended: tenants.filter((t) => t.status === 'suspended').length,
    provisioning: tenants.filter((t) => t.status === 'provisioning').length,
    deleted: tenants.filter((t) => t.status === 'deleted').length,
  }

  return (
    <DashboardLayout basePath="/cp" title="Tenants" itemCount={filteredTenants.length} icon={<Building2 className="h-5 w-5" />}>
      <div className="flex-1 bg-background">
        <div className="px-6 py-4 border-b border-border space-y-4">
          {/* Search and Actions Row */}
          <div className="flex items-center justify-between gap-4">
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
            <Button onClick={() => router.push('/cp/tenants/new')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Tenant
            </Button>
          </div>

          {/* Status Filter Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Status:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="h-8"
              >
                All
                {statusCounts.all > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/50 rounded">
                    {statusCounts.all}
                  </span>
                )}
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className="h-8"
              >
                Active
                {statusCounts.active > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/50 rounded">
                    {statusCounts.active}
                  </span>
                )}
              </Button>
              <Button
                variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('suspended')}
                className="h-8"
              >
                Suspended
                {statusCounts.suspended > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/50 rounded">
                    {statusCounts.suspended}
                  </span>
                )}
              </Button>
              <Button
                variant={statusFilter === 'provisioning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('provisioning')}
                className="h-8"
              >
                Provisioning
                {statusCounts.provisioning > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/50 rounded">
                    {statusCounts.provisioning}
                  </span>
                )}
              </Button>
              <Button
                variant={statusFilter === 'deleted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('deleted')}
                className="h-8"
              >
                Deleted
                {statusCounts.deleted > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/50 rounded">
                    {statusCounts.deleted}
                  </span>
                )}
              </Button>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-8"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
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
              <Button onClick={() => router.push('/cp/tenants/new')} variant="outline" className="mt-4">
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
                          paginatedTenants.length > 0 &&
                          paginatedTenants.every((tenant) => selectedItems.includes(tenant.id))
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-12 h-12 px-4" />
                    <TableHead className="h-12 px-4 font-medium text-foreground">Name</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Slug</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Status</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Database</TableHead>
                    <TableHead className="h-12 px-4 font-medium text-foreground">Created</TableHead>
                    <TableHead className="w-12 h-12 px-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTenants.map((tenant) => (
                    <TableRow
                      key={tenant.id}
                      className={cn(
                        'border-b border-border cursor-pointer transition-colors',
                        selectedItems.includes(tenant.id) && 'bg-muted/30',
                        'hover:bg-muted/50'
                      )}
                      onClick={() => router.push(`/cp/tenants/${tenant.id}`)}
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
                      <TableCell className="h-12 px-4">{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell className="h-12 px-4">
                        <span className="text-muted-foreground text-sm font-mono">{tenant.dbName}</span>
                      </TableCell>
                      <TableCell className="h-12 px-4">
                        <span className="text-muted-foreground text-sm">
                          {formatDateOnly(tenant.createdAt)}
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
                            <DropdownMenuItem onClick={() => router.push(`/cp/tenants/${tenant.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/cp/tenants/${tenant.id}/edit`)}>
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
            
            {/* Pagination */}
            {filteredTenants.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredTenants.length}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage)
                  setCurrentPage(1)
                }}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
