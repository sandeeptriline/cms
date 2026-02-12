'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function CpLoginPage() {
  const router = useRouter()
  const { platformAdminLogin, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  if (isAuthenticated && typeof window !== 'undefined') {
    router.push('/cp')
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await platformAdminLogin(data.email, data.password)
      router.push('/cp')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1a2942] via-[#2d3e5f] to-[#4a5d7c]">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div className="h-16 w-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Control Panel</h2>
          <p className="text-white/80 text-center max-w-sm">
            Super Admin access only. Sign in with your platform administrator account.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-base">Control Panel</span>
            </Link>
          </div>

          <div className="mb-8">
            <div className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider mb-3">
              Super Admin
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Control Panel Login
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Use your platform administrator credentials. No tenant context required.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                {...register('email')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                {...register('password')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 px-8 w-full bg-[#6366f1] hover:bg-[#5558e3] text-white font-medium rounded-full"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-[#6366f1] font-medium"
            >
              ← Tenant / user login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
