import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Cookie parser for HTTP-only cookies
  app.use(cookieParser());
  
  // Global exception filter for better error logging
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Global interceptor for BigInt serialization
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // Global prefix
  const globalPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(globalPrefix);
  
  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('CMS Platform API')
    .setDescription(
      `Multi-tenant Headless CMS Platform API Documentation

## Features
- **Multi-tenant Architecture**: Each tenant has isolated data and configuration
- **Super Admin Access**: Platform-level administration with full system access
- **Role-Based Access Control (RBAC)**: Granular permissions system
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **HTTP-only Cookies**: Secure cookie-based token storage

## Authentication

### Super Admin (Platform Admin)
- Use \`POST /api/v1/auth/platform-admin/login\` to authenticate as Super Admin
- No tenant context required
- Has access to all platform operations
- Token contains \`tenantId: null\` and \`roles: ["Super Admin"]\`

### Tenant Users
- Use \`POST /api/v1/auth/login\` with tenant context (X-Tenant-ID or X-Tenant-Slug header)
- Tenant-scoped operations
- Token contains tenant ID and user roles

## Authorization

### Security Schemes
- **JWT Bearer Token**: Required for authenticated endpoints
- **X-Tenant-ID**: Tenant ID header (for tenant-scoped operations)
- **X-Tenant-Slug**: Tenant slug header (alternative to X-Tenant-ID)

### Permissions
- Super Admin has all permissions automatically
- Tenant users have permissions assigned via roles
- Use \`@RequirePermission('resource:action')\` decorator to protect routes
`,
    )
    .setVersion('1.0.0')
    .setContact('CMS Platform', 'https://example.com', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('health', 'Health check and API status endpoints')
    .addTag('auth', 'Authentication and authorization endpoints (login, register, refresh, logout)')
    .addTag(
      'tenants',
      'Tenant management operations (create, read, update, delete tenants). Requires Super Admin access.',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description:
          'Enter JWT access token. Get token from login endpoints. Format: Bearer {token}',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-ID',
        in: 'header',
        description:
          'Tenant ID for multi-tenant requests. Required for tenant-scoped operations. Not required for Super Admin operations.',
      },
      'tenant-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Tenant-Slug',
        in: 'header',
        description:
          'Tenant slug for multi-tenant requests. Alternative to X-Tenant-ID. Required for tenant-scoped operations.',
      },
      'tenant-slug',
    )
    .addServer(`http://localhost:${process.env.PORT || 3001}`, 'Local development server')
    .addServer('https://api.example.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    customCss: '.swagger-ui .topbar { display: none }',
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend API is running on: http://localhost:${port}/${globalPrefix}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
