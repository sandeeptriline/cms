'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle } from 'lucide-react'
import { projectsApi, Project, AffectedCounts } from '@/lib/api/projects'
import { useToast } from '@/lib/hooks/use-toast'

interface DeleteProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  affectedCounts: AffectedCounts | null
  loadingCounts: boolean
  onSuccess: () => void
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  affectedCounts,
  loadingCounts,
  onSuccess,
}: DeleteProjectDialogProps) {
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isConfirmed = confirmText === project.name

  const handleDelete = async () => {
    if (!isConfirmed) {
      setError('Project name does not match')
      return
    }

    try {
      setDeleting(true)
      setError(null)
      await projectsApi.delete(project.id)
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      })
      onOpenChange(false)
      setConfirmText('')
      onSuccess()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to delete project')
      toast({
        title: 'Error',
        description: e.message || 'Failed to delete project',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleClose = () => {
    if (!deleting) {
      setConfirmText('')
      setError(null)
      onOpenChange(false)
    }
  }

  // Calculate total affected records
  const totalAffected = affectedCounts
    ? Object.values(affectedCounts).reduce((sum, count) => sum + count, 0)
    : 0

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Project
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div>
              <p className="font-medium mb-2">
                Are you sure you want to delete &quot;{project.name}&quot;?
              </p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. All project data will be permanently deleted.
              </p>
            </div>

            {loadingCounts ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Calculating affected records...
                </span>
              </div>
            ) : affectedCounts && totalAffected > 0 ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-3">
                  The following records will be deleted:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(affectedCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([table, count]) => (
                      <div key={table} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {table.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{totalAffected} records</span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Type <strong>{project.name}</strong> to confirm:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value)
                  setError(null)
                }}
                placeholder={project.name}
                disabled={deleting}
                className={error ? 'border-destructive' : ''}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmed || deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
