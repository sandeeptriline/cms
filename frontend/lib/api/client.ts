import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '')

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for HTTP-only cookies
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor - Add auth token and tenant ID
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get token from localStorage (if using token in header instead of cookies)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null

        console.log('[ApiClient] Request interceptor - token:', token ? 'exists' : 'missing', 'tenantId:', tenantId);

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (tenantId && config.headers) {
          config.headers['X-Tenant-ID'] = tenantId
          console.log('[ApiClient] Added X-Tenant-ID header:', tenantId);
        } else {
          console.warn('[ApiClient] No tenant_id in localStorage - X-Tenant-ID header not added');
        }

        if (config.data instanceof FormData && config.headers) {
          delete config.headers['Content-Type']
        }

        return config
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

        // Handle 401 Unauthorized - Token expired; try refresh (Super Admin has no tenantId)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
          const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null

          if (refreshToken) {
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' }
              if (tenantId) {
                headers['X-Tenant-ID'] = tenantId
              }

              const response = await axios.post(
                `${API_URL}/auth/refresh`,
                { refreshToken },
                { headers, withCredentials: true }
              )

              const { accessToken } = response.data

              if (typeof window !== 'undefined') {
                localStorage.setItem('access_token', accessToken)
              }

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
              }

              return this.client(originalRequest)
            } catch (refreshError) {
              // Refresh failed - clear storage and redirect to login
              if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('tenant_id')
                window.location.href = '/login'
              }
              return Promise.reject(refreshError)
            }
          }
        }

        return Promise.reject(error)
      }
    )
  }

  get instance(): AxiosInstance {
    return this.client
  }
}

export const apiClient = new ApiClient().instance
