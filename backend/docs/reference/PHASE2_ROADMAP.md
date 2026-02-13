# Phase 2: Authentication & Authorization - Roadmap

**Status**: Ready to Start  
**Duration**: 1-1.5 weeks  
**Priority**: Critical  
**Dependencies**: Phase 1 ✅ Complete

---

## 🎯 Overview

Phase 2 implements user authentication and authorization for the CMS platform. This includes JWT-based authentication, user management, and role-based access control (RBAC).

---

## ✅ Prerequisites (Completed)

- ✅ Phase 1: Multi-Tenant Core
- ✅ Database setup (MySQL 8.0+)
- ✅ Prisma configured
- ✅ Tenant isolation working
- ✅ Swagger documentation setup

---

## 📋 Backend Tasks

### 1. JWT Authentication Setup
- [ ] Install required packages (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`)
- [ ] Configure JWT module
- [ ] Setup JWT secrets in environment variables
- [ ] Create JWT strategy (Passport)
- [ ] Create refresh token strategy

### 2. User Management
- [ ] Create user model (Prisma schema - tenant database)
- [ ] Create user service
- [ ] Implement password hashing (bcrypt)
- [ ] Create user DTOs (CreateUserDto, UpdateUserDto, LoginDto)
- [ ] Create user controller
- [ ] Implement user CRUD APIs

### 3. Authentication Endpoints
- [ ] `POST /api/v1/auth/login` - User login
- [ ] `POST /api/v1/auth/refresh` - Refresh access token
- [ ] `POST /api/v1/auth/logout` - User logout
- [ ] `GET /api/v1/auth/me` - Get current user
- [ ] `POST /api/v1/auth/register` - User registration (optional)

### 4. Authorization (RBAC)
- [ ] Create role model (Prisma schema)
- [ ] Create permission model
- [ ] Create user-role relationship
- [ ] Implement RBAC guards
- [ ] Create decorators (`@Roles()`, `@Permissions()`)
- [ ] Implement field-level permissions

### 5. Security Features
- [ ] HTTP-only cookie handling for tokens
- [ ] Token expiration (7 days default)
- [ ] Refresh token rotation
- [ ] Password reset functionality
- [ ] Email verification (optional for MVP)

### 6. Integration
- [ ] Integrate JWT with tenant isolation
- [ ] Update Swagger with JWT auth
- [ ] Add authentication to protected endpoints
- [ ] Test authentication flow

---

## 🏗️ Architecture

### Authentication Flow
```
1. User submits credentials → Login endpoint
2. Validate credentials → Check password hash
3. Generate JWT tokens → Access token + Refresh token
4. Store tokens → HTTP-only cookies
5. Validate on requests → JWT Guard
6. Extract user → Attach to request
```

### Authorization Flow
```
1. Request arrives → JWT Guard validates token
2. Extract user → From JWT payload
3. Load user roles → From database
4. Check permissions → RBAC Guard
5. Allow/Deny → Based on permissions
```

---

## 📁 Expected File Structure

```
backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── permissions.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       ├── register.dto.ts
│       └── refresh-token.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
└── roles/
    ├── roles.module.ts
    ├── roles.service.ts
    └── permissions.service.ts
```

---

## 🔧 Technical Decisions

### JWT Configuration
- **Access Token Expiration**: 7 days (configurable)
- **Refresh Token Expiration**: 30 days (configurable)
- **Token Storage**: HTTP-only cookies (secure)
- **Algorithm**: HS256

### Password Security
- **Hashing**: bcrypt (10 rounds)
- **Password Policy**: Minimum 8 characters (configurable)

### Token Structure
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "roles": ["admin", "editor"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## 🧪 Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh
- [ ] Access protected endpoint with valid token
- [ ] Access protected endpoint without token
- [ ] Access protected endpoint with expired token
- [ ] Role-based access control
- [ ] Permission-based access control
- [ ] User CRUD operations
- [ ] Password hashing verification

---

## 📚 Dependencies

### Required Packages
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt
```

### Environment Variables
```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d
```

---

## 🚀 Next Steps

1. **Start with JWT Setup**
   - Install packages
   - Configure JWT module
   - Create JWT strategy

2. **Implement User Model**
   - Add user table to tenant database schema
   - Create Prisma model
   - Generate Prisma client

3. **Create Authentication Service**
   - Login logic
   - Token generation
   - Password validation

4. **Build Authorization System**
   - Role model
   - Permission model
   - RBAC guards

5. **Integration & Testing**
   - Integrate with tenant isolation
   - Test authentication flow
   - Update Swagger documentation

---

## 📝 Notes

- Users are stored in **tenant databases** (not platform database)
- Each tenant has its own users, roles, and permissions
- JWT tokens include tenant context
- Authentication works with tenant isolation
- Platform admin users (if needed) can be in platform database

---

**Ready to Start**: Phase 1 is complete, Phase 2 can begin!

**Last Updated**: 2026-02-11
