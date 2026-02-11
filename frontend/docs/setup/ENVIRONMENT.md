# Environment Variables Configuration

**Last Updated**: 2026-02-11

---

## Required Environment Variables

### API Configuration

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

**Description**: Base URL for the backend API. Must include the API version prefix.

**Default**: `http://localhost:3001/api/v1`

---

### App Configuration

```env
# Application Name
NEXT_PUBLIC_APP_NAME=CMS Platform
```

**Description**: Application name displayed in the UI.

**Default**: `CMS Platform`

---

## Environment Files

### `.env.local` (Development)

Create this file for local development:

```bash
cp .env.local.example .env.local
```

**Note**: `.env.local` is gitignored and should not be committed.

### `.env.local.example` (Template)

Template file with all required variables. This should be committed to the repository.

---

## Environment Variable Rules

1. **NEXT_PUBLIC_*** prefix**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
2. **No NEXT_PUBLIC_ prefix**: Server-side only variables (not used yet)
3. **Sensitive data**: Never commit sensitive data to version control

---

## Usage in Code

### Client-Side (Browser)

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

### Server-Side

```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

**Note**: In Next.js, both client and server can access `NEXT_PUBLIC_*` variables.

---

## Production Configuration

For production, set environment variables in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Docker**: Use `.env` file or environment variables
- **Other**: Set via hosting platform's environment variable configuration

---

## Example Configuration

### Development

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=CMS Platform (Dev)
```

### Production

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
NEXT_PUBLIC_APP_NAME=CMS Platform
```

---

## Troubleshooting

### Variables Not Working

1. **Restart dev server**: Environment variables are loaded at build time
2. **Check prefix**: Client-side variables must have `NEXT_PUBLIC_` prefix
3. **Check file name**: Must be `.env.local` (not `.env`)

### API Connection Issues

1. **Verify API URL**: Check that `NEXT_PUBLIC_API_URL` is correct
2. **Check CORS**: Ensure backend allows requests from frontend origin
3. **Check network**: Verify backend is running and accessible

---

**See Also**:
- [Setup Guide](./SETUP.md)
- [API Client Guide](../api/API_CLIENT.md)
