# Frontend Environment Variables Template

Copy these variables to your `.env.local` file in the frontend directory.

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_GRAPQL=true
NEXT_PUBLIC_ENABLE_SSO=false

# CDN & Assets
NEXT_PUBLIC_CDN_URL=
NEXT_PUBLIC_MEDIA_URL=http://localhost:3001/storage

# Application Settings
NEXT_PUBLIC_APP_NAME=CMS Platform
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,fr,es,de

# Development
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_MOCK_API=false
```
