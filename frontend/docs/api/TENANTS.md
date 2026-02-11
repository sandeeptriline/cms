# Tenants API Integration

**Last Updated**: 2026-02-11

---

## Overview

Tenant management API functions for CRUD operations and tenant status management.

**Location**: `lib/api/tenants.ts`

---

## API Functions

### Get All Tenants

```typescript
import { tenantsApi } from '@/lib/api/tenants'

const tenants = await tenantsApi.getAll()
```

### Get Tenant by ID

```typescript
const tenant = await tenantsApi.getById('tenant-id')
```

### Get Tenant by Slug

```typescript
const tenant = await tenantsApi.getBySlug('tenant-slug')
```

### Create Tenant

```typescript
const newTenant = await tenantsApi.create({
  name: 'My Tenant',
  slug: 'my-tenant',
  config: { theme: 'default' },
  featureFlags: { analytics: true },
  usageLimits: {
    storage: 1000,
    apiCalls: 10000,
    users: 50
  }
})
```

### Update Tenant

```typescript
const updated = await tenantsApi.update('tenant-id', {
  name: 'Updated Name',
  config: { theme: 'dark' }
})
```

### Activate Tenant

```typescript
const activated = await tenantsApi.activate('tenant-id')
```

### Suspend Tenant

```typescript
const suspended = await tenantsApi.suspend('tenant-id')
```

### Delete Tenant

```typescript
await tenantsApi.delete('tenant-id')
```

---

## TypeScript Types

```typescript
export interface Tenant {
  id: string
  name: string
  slug: string
  status: 'provisioning' | 'active' | 'suspended' | 'deleted'
  dbName: string
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
  createdAt: string
  updatedAt: string
}

export interface CreateTenantDto {
  name: string
  slug: string
  parentId?: string
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  status?: 'provisioning' | 'active' | 'suspended' | 'deleted'
  config?: Record<string, any>
  featureFlags?: Record<string, boolean>
  usageLimits?: {
    storage?: number
    apiCalls?: number
    users?: number
  }
}
```

---

## Usage in Components

### Tenant List Example

```typescript
'use client'

import { useEffect, useState } from 'react'
import { tenantsApi, type Tenant } from '@/lib/api/tenants'

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTenants() {
      try {
        const data = await tenantsApi.getAll()
        setTenants(data)
      } catch (error) {
        console.error('Failed to fetch tenants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTenants()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {tenants.map(tenant => (
        <div key={tenant.id}>
          <h3>{tenant.name}</h3>
          <p>Status: {tenant.status}</p>
        </div>
      ))}
    </div>
  )
}
```

### Create Tenant Example

```typescript
async function handleCreateTenant() {
  try {
    const tenant = await tenantsApi.create({
      name: 'New Tenant',
      slug: 'new-tenant'
    })
    
    console.log('Tenant created:', tenant)
    // Refresh list or redirect
  } catch (error) {
    console.error('Failed to create tenant:', error)
  }
}
```

---

## Tenant Status

### Status Values

- `provisioning` - Tenant database is being set up
- `active` - Tenant is ready to use
- `suspended` - Tenant is suspended
- `deleted` - Tenant has been deleted

### Status Management

```typescript
// Activate a suspended tenant
await tenantsApi.activate(tenantId)

// Suspend an active tenant
await tenantsApi.suspend(tenantId)
```

---

## Error Handling

```typescript
try {
  await tenantsApi.create({ name: 'Test', slug: 'test' })
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 409) {
      // Tenant with slug already exists
    } else if (status === 400) {
      // Validation error
    }
  }
}
```

---

**See Also**:
- [API Client Guide](./API_CLIENT.md)
- [Authentication API](./AUTHENTICATION.md)
