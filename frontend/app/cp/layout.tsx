'use client'

import { usePathname } from 'next/navigation'
import { PlatformAdminRoute } from '@/components/auth/platform-admin-route'

/**
 * Layout for /cp (Control Panel - Super Admin only).
 * - /cp/login: no guard (login page only).
 * - All other /cp/*: require Super Admin. Each page wraps itself in DashboardLayout with basePath="/cp".
 */
export default function CpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/cp/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return <PlatformAdminRoute>{children}</PlatformAdminRoute>
}
