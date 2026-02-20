'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { Loader2 } from 'lucide-react'

export default function TenantSlugLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const params = useParams()
  const tenantSlug = params?.tenantSlug as string | undefined
  const { user, loading, tenantSlug: userTenantSlug } = useAuth()

  useEffect(() => {
    if (loading) return
    // Super Admin has no tenant slug, send to control panel
    if (user && isSuperAdmin(user.roles)) {
      router.replace('/cp')
      return
    }
    // Not authenticated
    if (!user) {
      router.replace('/login')
      return
    }
    // Tenant user: URL slug must match their tenant
    if (userTenantSlug && tenantSlug && tenantSlug !== userTenantSlug) {
      router.replace(`/${userTenantSlug}/projects`)
      return
    }
  }, [loading, user, userTenantSlug, tenantSlug, router])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    )
  }

  if (user && isSuperAdmin(user.roles)) {
    return null
  }

  return <>{children}</>
}
