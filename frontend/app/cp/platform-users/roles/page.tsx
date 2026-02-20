'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { platformUsersApi, PlatformRole } from '@/lib/api/platform-users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDateOnly } from '@/lib/utils/date'

function normalizeRole(raw: Record<string, unknown>): PlatformRole {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    description: raw.description != null ? String(raw.description) : null,
    is_system: Boolean(raw.is_system ?? (raw as Record<string, unknown>).is_system ?? false),
    createdAt: (raw.createdAt ?? (raw as Record<string, unknown>).created_at) as string | undefined,
    updatedAt: (raw.updatedAt ?? (raw as Record<string, unknown>).updated_at) as string | undefined,
  }
}

export default function CpPlatformRolesPage() {
  const [roles, setRoles] = useState<PlatformRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await platformUsersApi.getRoles()
        const list = Array.isArray(data) ? data.map((r) => normalizeRole(r as unknown as Record<string, unknown>)) : []
        if (!cancelled) setRoles(list)
      } catch (err: unknown) {
        const e = err as { message?: string }
        if (!cancelled) {
          setError(e.message ?? 'Failed to load platform roles')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout
      basePath="/cp"
      title="Platform Roles"
      subtitle="Roles available for assignment to platform users"
    >
      <div className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">System</TableHead>
                  <TableHead className="text-right text-muted-foreground">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No platform roles found. Run the seed script to create default roles.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description ?? '—'}
                      </TableCell>
                      <TableCell>
                        {role.is_system ? (
                          <Badge variant="secondary">System</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {role.createdAt ? formatDateOnly(role.createdAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
