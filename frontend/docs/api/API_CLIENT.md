# API Client Guide

**Last Updated**: 2026-02-11

---

## Overview

The API client is built on Axios and provides automatic token management, error handling, and request/response interceptors.

**Location**: `lib/api/client.ts`

---

## Features

- ✅ Automatic token injection
- ✅ Automatic token refresh on 401
- ✅ HTTP-only cookie support
- ✅ Tenant ID header injection
- ✅ Error handling
- ✅ Request/response interceptors

---

## Usage

### Basic Usage

```typescript
import { apiClient } from '@/lib/api/client'

// GET request
const response = await apiClient.get('/tenants')
const tenants = response.data

// POST request
const response = await apiClient.post('/tenants', {
  name: 'My Tenant',
  slug: 'my-tenant'
})
```

### With TypeScript

```typescript
import { apiClient } from '@/lib/api/client'
import type { Tenant } from '@/lib/api/tenants'

const response = await apiClient.get<Tenant[]>('/tenants')
const tenants: Tenant[] = response.data
```

---

## Authentication

### Token Storage

Tokens are stored in `localStorage`:
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `tenantId` - Current tenant ID

### Automatic Token Injection

The client automatically adds the `Authorization` header if a token exists:

```typescript
// Token is automatically added from localStorage
const response = await apiClient.get('/auth/me')
```

### Automatic Token Refresh

If a request returns 401 (Unauthorized), the client automatically:
1. Attempts to refresh the token
2. Retries the original request
3. Redirects to login if refresh fails

---

## Tenant Context

### Setting Tenant ID

```typescript
// Store tenant ID in localStorage
localStorage.setItem('tenantId', 'tenant-uuid-here')

// All subsequent requests will include X-Tenant-ID header
```

### Manual Tenant Header

```typescript
await apiClient.get('/tenants', {
  headers: {
    'X-Tenant-ID': 'tenant-uuid-here'
  }
})
```

---

## Error Handling

### Try-Catch

```typescript
try {
  const response = await apiClient.get('/tenants')
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data)
  }
}
```

### Error Response Structure

```typescript
{
  statusCode: 400,
  message: 'Validation error',
  error: 'Bad Request'
}
```

---

## API Modules

### Auth API

```typescript
import { authApi } from '@/lib/api/auth'

await authApi.login({ email, password }, tenantId)
await authApi.register({ email, password, name }, tenantId)
await authApi.getMe()
await authApi.logout()
```

**See**: [Authentication API](./AUTHENTICATION.md)

### Tenants API

```typescript
import { tenantsApi } from '@/lib/api/tenants'

await tenantsApi.getAll()
await tenantsApi.getById(id)
await tenantsApi.create(data)
await tenantsApi.update(id, data)
```

**See**: [Tenants API](./TENANTS.md)

---

## Configuration

### Base URL

Set via environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Credentials

The client is configured with `withCredentials: true` to support HTTP-only cookies.

---

## Best Practices

1. **Use API modules**: Use `authApi`, `tenantsApi` instead of direct `apiClient` calls
2. **Handle errors**: Always wrap API calls in try-catch
3. **Type safety**: Use TypeScript types for request/response data
4. **Loading states**: Show loading indicators during API calls

---

## Examples

### Complete Example

```typescript
import { authApi } from '@/lib/api/auth'
import { tenantsApi } from '@/lib/api/tenants'

async function loginAndGetTenants() {
  try {
    // Login
    const authResponse = await authApi.login(
      { email: 'user@example.com', password: 'password' },
      'tenant-id'
    )
    
    // Store tokens
    localStorage.setItem('accessToken', authResponse.accessToken)
    localStorage.setItem('tenantId', 'tenant-id')
    
    // Get tenants
    const tenants = await tenantsApi.getAll()
    
    return tenants
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
```

---

**See Also**:
- [Authentication API](./AUTHENTICATION.md)
- [Tenants API](./TENANTS.md)
