# Frontend Setup Guide

**Last Updated**: 2026-02-11

---

## Prerequisites

- Node.js 20+ (recommended: use nvm)
- npm or yarn
- Backend API running (see backend setup)

---

## Initial Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=CMS Platform
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: http://localhost:3000

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── lib/                   # Utilities and helpers
│   ├── api/               # API client
│   └── utils/             # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Icons**: Lucide React

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## Next Steps

1. ✅ Setup complete
2. Read [Getting Started Guide](../guides/GETTING_STARTED.md)
3. Check [Development Phases](../development/ADMIN_PANEL_PHASES.md)
4. Review [API Integration](../api/API_CLIENT.md)

---

**See Also**:
- [Environment Configuration](./ENVIRONMENT.md)
- [Development Phases](../development/ADMIN_PANEL_PHASES.md)
