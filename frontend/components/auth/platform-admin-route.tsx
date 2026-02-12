'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { Loader2 } from 'lucide-react'

interface PlatformAdminRouteProps {
  children: React.ReactNode
}

/**
 * Route protection for Platform Admin (Super Admin) only
 * Redirects non-Super Admin users to dashboard
 */
export function PlatformAdminRoute({ children }: PlatformAdminRouteProps) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (!user || !isSuperAdmin(user.roles)) {
        // User is not Super Admin, redirect to tenant dashboard
        router.push('/dashboard')
      }
    } else if (!loading && !isAuthenticated) {
      // Not authenticated, redirect to Control Panel login
      router.push('/cp/login')
    }
  }, [user, loading, isAuthenticated, router])

  // Show loading while checking auth
  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    )
  }

  // Check if user is Super Admin
  if (!user || !isSuperAdmin(user.roles)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You need Super Admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
