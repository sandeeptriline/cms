'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, type User, type AuthResponse } from '@/lib/api/auth'
import { useToast } from '@/lib/hooks/use-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, tenantId: string) => Promise<void>
  register: (email: string, password: string, name: string, tenantId: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TENANT_ID_KEY = 'tenant_id'
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Helper to convert API response user to User type
function mapAuthResponseToUser(authUser: any, tenantId: string): User {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    tenantId: tenantId,
    roles: authUser.roles,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (token) {
        try {
          const userData = await authApi.getMe()
          setUser(userData)
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem(REFRESH_TOKEN_KEY)
          localStorage.removeItem(TENANT_ID_KEY)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string, tenantId: string) => {
      try {
        const response: AuthResponse = await authApi.login({ email, password }, tenantId)
        
        // Store tokens and tenant ID
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
        localStorage.setItem(TENANT_ID_KEY, tenantId)

        // Set user (map API response to User type)
        setUser(mapAuthResponseToUser(response.user, tenantId))

        toast({
          title: 'Success',
          description: 'Logged in successfully',
          variant: 'success',
        })
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Login failed'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
        throw error
      }
    },
    [toast]
  )

  const register = useCallback(
    async (email: string, password: string, name: string, tenantId: string) => {
      try {
        const response: AuthResponse = await authApi.register({ email, password, name }, tenantId)
        
        // Store tokens and tenant ID
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
        localStorage.setItem(TENANT_ID_KEY, tenantId)

        // Set user (map API response to User type)
        setUser(mapAuthResponseToUser(response.user, tenantId))

        toast({
          title: 'Success',
          description: 'Account created successfully',
          variant: 'success',
        })
      } catch (error: any) {
        const message = error?.response?.data?.message || 'Registration failed'
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
        throw error
      }
    },
    [toast]
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(TENANT_ID_KEY)
      setUser(null)

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      })
    }
  }, [toast])

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    const tenantId = localStorage.getItem(TENANT_ID_KEY)

    if (!refreshToken || !tenantId) {
      setUser(null)
      return
    }

    try {
      const response: AuthResponse = await authApi.refreshToken(refreshToken, tenantId)
      
      localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken)
      setUser(mapAuthResponseToUser(response.user, tenantId))
    } catch (error) {
      // Refresh failed, logout
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(TENANT_ID_KEY)
      setUser(null)
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
