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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated } = useAuth()
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
    router.push('/dashboard')
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
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

      {/* Right Side - Login Form */}
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
              Welcome to CMS Platform
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our Cloud dashboard is the fastest and easiest way to get up-and-running with CMS.{' '}
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

            <div className="flex items-center justify-between pt-2">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-11 px-8 bg-[#6366f1] hover:bg-[#5558e3] text-white font-medium rounded-full"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <Link 
                href="/forgot-password" 
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Forgot Password
              </Link>
            </div>
          </form>

          {/* Control Panel (Super Admin) link */}
          <div className="mt-6 text-center text-sm">
            <Link href="/cp/login" className="text-[#6366f1] font-medium hover:underline">
              Platform Admin (Control Panel) →
            </Link>
          </div>

          {/* Registration Link */}
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/register" className="text-[#6366f1] font-semibold hover:underline">
              Register for Free
            </Link>
          </div>

          {/* Legal Links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              By signing in to CMS Platform you agree to our{' '}
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
