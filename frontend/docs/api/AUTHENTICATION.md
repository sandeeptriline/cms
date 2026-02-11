# Authentication API Integration

**Last Updated**: 2026-02-11

---

## Overview

Authentication API functions for login, registration, token management, and user profile.

**Location**: `lib/api/auth.ts`

---

## API Functions

### Login

```typescript
import { authApi } from '@/lib/api/auth'

const response = await authApi.login(
  {
    email: 'user@example.com',
    password: 'password123'
  },
  'tenant-id-here'
)

// Response
{
  accessToken: 'jwt-token',
  refreshToken: 'refresh-token',
  user: {
    id: 'user-id',
    email: 'user@example.com',
    name: 'User Name',
    roles: []
  }
}
```

### Register

```typescript
const response = await authApi.register(
  {
    email: 'user@example.com',
    password: 'password123',
    name: 'User Name'
  },
  'tenant-id-here'
)
```

### Get Current User

```typescript
const user = await authApi.getMe()

// Response
{
  id: 'user-id',
  email: 'user@example.com',
  tenantId: 'tenant-id',
  roles: []
}
```

### Logout

```typescript
await authApi.logout()
```

### Refresh Token

```typescript
const response = await authApi.refreshToken(
  'refresh-token',
  'tenant-id'
)
```

---

## Usage in Components

### Login Form Example

```typescript
'use client'

import { useState } from 'react'
import { authApi } from '@/lib/api/auth'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authApi.login(
        { email, password },
        tenantId
      )

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('tenantId', tenantId)

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

---

## TypeScript Types

```typescript
export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    name?: string
    roles?: string[]
  }
}

export interface User {
  id: string
  email: string
  name?: string
  tenantId: string
  roles?: string[]
}
```

---

## Error Handling

```typescript
try {
  await authApi.login({ email, password }, tenantId)
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      // Invalid credentials
    } else if (status === 400) {
      // Validation error
    }
  }
}
```

---

## Token Management

### Storing Tokens

```typescript
// After successful login
localStorage.setItem('accessToken', response.accessToken)
localStorage.setItem('refreshToken', response.refreshToken)
localStorage.setItem('tenantId', tenantId)
```

### Retrieving Tokens

```typescript
const accessToken = localStorage.getItem('accessToken')
const refreshToken = localStorage.getItem('refreshToken')
const tenantId = localStorage.getItem('tenantId')
```

### Clearing Tokens

```typescript
localStorage.removeItem('accessToken')
localStorage.removeItem('refreshToken')
localStorage.removeItem('tenantId')
```

---

## HTTP-Only Cookies

The backend also sets HTTP-only cookies for tokens. The API client automatically includes cookies in requests via `withCredentials: true`.

---

**See Also**:
- [API Client Guide](./API_CLIENT.md)
- [Tenants API](./TENANTS.md)
