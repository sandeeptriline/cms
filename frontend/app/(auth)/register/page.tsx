'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Github } from 'lucide-react'

const registerSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug: only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  adminName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { registerTenant, isAuthenticated, user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return
    if (user?.tenantSlug) router.push(`/${user.tenantSlug}/projects`)
    else router.push('/dashboard/projects')
  }, [isAuthenticated, user?.tenantSlug, router])

  if (isAuthenticated) {
    return null
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { tenantSlug } = await registerTenant({
        name: data.name,
        slug: data.slug,
        email: data.email,
        password: data.password,
        adminName: data.adminName,
      })
      router.push(tenantSlug ? `/${tenantSlug}/projects` : '/dashboard/projects')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Sign up failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Animated Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1a2942] via-[#2d3e5f] to-[#4a5d7c]">
        {/* Animated Wave Pattern */}
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1e3a5f', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.1 }} />
              </linearGradient>
            </defs>
            <path
              fill="url(#wave-gradient)"
              d="M0,400 C150,450 350,350 600,400 C850,450 1050,350 1440,400 L1440,800 L0,800 Z"
              opacity="0.2"
            >
              <animate
                attributeName="d"
                dur="20s"
                repeatCount="indefinite"
                values="
                  M0,400 C150,450 350,350 600,400 C850,450 1050,350 1440,400 L1440,800 L0,800 Z;
                  M0,350 C150,300 350,450 600,350 C850,300 1050,450 1440,350 L1440,800 L0,800 Z;
                  M0,400 C150,450 350,350 600,400 C850,450 1050,350 1440,400 L1440,800 L0,800 Z
                "
              />
            </path>
            <path
              fill="url(#wave-gradient)"
              d="M0,500 C200,550 400,450 700,500 C1000,550 1200,450 1440,500 L1440,800 L0,800 Z"
              opacity="0.15"
            >
              <animate
                attributeName="d"
                dur="15s"
                repeatCount="indefinite"
                values="
                  M0,500 C200,550 400,450 700,500 C1000,550 1200,450 1440,500 L1440,800 L0,800 Z;
                  M0,450 C200,400 400,550 700,450 C1000,400 1200,550 1440,450 L1440,800 L0,800 Z;
                  M0,500 C200,550 400,450 700,500 C1000,550 1200,450 1440,500 L1440,800 L0,800 Z
                "
              />
            </path>
          </svg>
        </div>
        
        {/* Logo */}
        <div className="absolute top-8 left-8 z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-white font-semibold text-lg">CMS Platform</span>
          </Link>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 py-12 bg-white">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="font-semibold text-base">CMS Platform</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="text-xs font-semibold text-[#6366f1] uppercase tracking-wider mb-3">
              Cloud Dashboard
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Create Your Organization
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sign up for a free workspace. {' '}
              <Link href="/docs" className="text-[#6366f1] hover:underline font-medium">
                Learn More
              </Link>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Input
                id="name"
                type="text"
                placeholder="Organization name"
                {...register('name')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="slug"
                type="text"
                placeholder="URL slug (e.g. my-company)"
                {...register('slug')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
              {errors.slug && (
                <p className="text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                {...register('confirmPassword')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="adminName"
                type="text"
                placeholder="Your name (optional)"
                {...register('adminName')}
                disabled={isLoading}
                className="h-12 border-gray-300 focus:border-[#6366f1] focus:ring-[#6366f1] rounded-lg"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-11 bg-[#6366f1] hover:bg-[#5558e3] text-white font-medium rounded-full"
              >
                {isLoading ? 'Creating Account...' : 'Register for Free'}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500">or</span>
            </div>
          </div>

          {/* Social Registration */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 border-gray-300 hover:bg-gray-50"
              disabled
            >
              <Github className="h-5 w-5 text-gray-600" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 border-gray-300 hover:bg-gray-50"
              disabled
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </Button>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-[#6366f1] font-semibold hover:underline">
              Sign In
            </Link>
          </div>

          {/* Legal Links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-[#6366f1] hover:underline">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[#6366f1] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
