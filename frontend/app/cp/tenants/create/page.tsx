'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect /cp/tenants/create → /cp/tenants/new (create tenant form lives at /new)
 */
export default function CpTenantsCreateRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/cp/tenants/new')
  }, [router])
  return null
}
