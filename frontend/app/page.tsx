'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isSuperAdmin } from '@/lib/utils/roles'
import { Loading } from '@/components/ui/loading'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        // Super Admin goes to Control Panel; tenant users to dashboard
        router.push(isSuperAdmin(user?.roles) ? '/cp' : '/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, loading, user?.roles, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </main>
  )
}
