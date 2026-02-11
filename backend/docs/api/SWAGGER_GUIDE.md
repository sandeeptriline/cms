# Swagger API Documentation Guide

**Status**: ✅ Configured  
**URL**: http://localhost:3001/api/docs

---

## Accessing Swagger UI

Once the server is running, access Swagger documentation at:

```
http://localhost:3001/api/docs
```

---

## Features

### 1. Interactive API Testing
- Test all endpoints directly from the browser
- See request/response schemas
- Try out different parameters

### 2. Authentication Support
- **JWT Bearer Token**: For authenticated requests (Phase 2)
- **Tenant ID Header**: `X-Tenant-ID` for multi-tenant requests
- **Tenant Slug Header**: `X-Tenant-Slug` for multi-tenant requests

### 3. API Documentation
- Complete endpoint descriptions
- Request/response examples
- Error response codes
- Parameter validation rules

---

## Using Swagger UI

### Testing Endpoints

1. **Open Swagger UI**: Navigate to http://localhost:3001/api/docs

2. **Select an Endpoint**: Click on any endpoint to expand it

3. **Click "Try it out"**: Enable editing mode

4. **Fill in Parameters**:
   - Path parameters (e.g., `:id`)
   - Query parameters
   - Request body (for POST/PATCH)

5. **Add Headers** (if needed):
   - Click "Authorize" button at top
   - Add `X-Tenant-ID` or `X-Tenant-Slug` for tenant-scoped requests
   - Add JWT token when authentication is implemented

6. **Execute**: Click "Execute" to send the request

7. **View Response**: See the response body, status code, and headers

---

## Example: Creating a Tenant

1. Navigate to `POST /api/v1/tenants`
2. Click "Try it out"
3. Fill in the request body:
   ```json
   {
     "name": "Test Company",
     "slug": "test-company",
     "config": {
       "theme": "default"
     }
   }
   ```
4. Click "Execute"
5. View the response

---

## API Tags

Endpoints are organized by tags:

- **health**: Health check endpoints
- **tenants**: Tenant management operations

---

## Authentication (Phase 2)

When JWT authentication is implemented:

1. Click the "Authorize" button (🔒 icon) at the top
2. Enter your JWT token in the "Value" field
3. Click "Authorize"
4. All requests will now include the token

---

## Tenant Headers

For multi-tenant endpoints:

1. Click "Authorize" button
2. Select "tenant-id" or "tenant-slug"
3. Enter the tenant identifier
4. Click "Authorize"

---

## Exporting API Spec

You can export the OpenAPI specification:

1. Navigate to: http://localhost:3001/api/docs-json
2. Save the JSON file
3. Import into Postman, Insomnia, or other API tools

---

## Swagger Configuration

Configuration is in `src/main.ts`:

```typescript
const config = new DocumentBuilder()
  .setTitle('CMS Platform API')
  .setDescription('Multi-tenant Headless CMS Platform API Documentation')
  .setVersion('1.0')
  .addTag('tenants', 'Tenant management operations')
  .addBearerAuth() // JWT authentication
  .addApiKey() // Tenant headers
  .build();
```

---

## Troubleshooting

### Swagger UI Not Loading
- Ensure server is running: `npm run start:dev`
- Check port: http://localhost:3001/api/docs
- Check browser console for errors

### Endpoints Not Showing
- Ensure controllers have `@ApiTags()` decorator
- Check that routes are properly registered
- Verify server logs for errors

### Authentication Not Working
- Ensure token is properly formatted
- Check that "Authorize" button was clicked
- Verify token hasn't expired

---

**Last Updated**: 2026
