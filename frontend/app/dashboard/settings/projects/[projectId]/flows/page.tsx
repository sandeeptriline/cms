'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  GitBranch,
  Plus,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { flowsApi, Flow } from '@/lib/api/flows'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/lib/hooks/use-toast'
import { ProjectRouteGuard } from '@/components/auth/project-route-guard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FlowsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const { toast } = useToast()
  const { currentProject } = useProject()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadFlows()
    }
  }, [projectId])

  const loadFlows = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      setError(null)
      const data = await flowsApi.getAll(projectId)
      setFlows(data)
    } catch (err: any) {
      console.error('Error loading flows:', err)
      setError(err.response?.data?.message || err.message || 'Failed to load flows')
      toast({
        title: 'Error',
        description: 'Failed to load flows',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (flow: Flow) => {
    if (!confirm(`Are you sure you want to delete "${flow.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(flow.id)
      await flowsApi.delete(projectId, flow.id)
      toast({
        title: 'Success',
        description: 'Flow deleted successfully',
      })
      await loadFlows()
    } catch (err: any) {
      console.error('Error deleting flow:', err)
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to delete flow',
        variant: 'destructive',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const getTriggerBadge = (trigger: string | null) => {
    if (!trigger) return <span className="text-muted-foreground">-</span>
    return <Badge variant="outline">{trigger}</Badge>
  }

  return (
    <ProjectRouteGuard>
      <DashboardLayout basePath="/dashboard" title="Flows" subtitle="Settings" icon={<GitBranch className="h-5 w-5" />}>
        <div className="flex-1 bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Flows</h2>
                <p className="text-muted-foreground mt-1">
                  Manage automation workflows and approval processes
                </p>
              </div>
              <Button onClick={() => toast({ title: 'Coming Soon', description: 'Flow creation will be available soon' })}>
                <Plus className="h-4 w-4 mr-2" />
                Create Flow
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading flows...</span>
              </div>
            ) : flows.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <CardTitle className="text-lg mb-2">No flows found</CardTitle>
                  <CardDescription className="text-center mb-4">
                    Get started by creating your first automation workflow
                  </CardDescription>
                  <Button onClick={() => toast({ title: 'Coming Soon', description: 'Flow creation will be available soon' })}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Flow
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Flows</CardTitle>
                  <CardDescription>
                    {flows.length} {flows.length === 1 ? 'flow' : 'flows'} in {currentProject?.name || 'this project'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Trigger</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flows.map((flow) => (
                        <TableRow key={flow.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {flow.icon && <span>{flow.icon}</span>}
                              {flow.name}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(flow.status)}</TableCell>
                          <TableCell>{getTriggerBadge(flow.trigger)}</TableCell>
                          <TableCell>
                            {flow.description ? (
                              <span className="text-sm text-muted-foreground line-clamp-1">
                                {flow.description}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(flow.date_created).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast({ title: 'Coming Soon', description: 'Flow editing will be available soon' })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(flow)}
                                disabled={deletingId === flow.id}
                              >
                                {deletingId === flow.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProjectRouteGuard>
  )
}
