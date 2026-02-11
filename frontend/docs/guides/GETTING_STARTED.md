# Getting Started Guide

**Last Updated**: 2026-02-11

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## Next Steps

1. ✅ Setup complete
2. Read [Development Phases](../development/ADMIN_PANEL_PHASES.md)
3. Check [API Integration](../api/API_CLIENT.md)
4. Start building components

---

## Project Structure

```
frontend/
├── app/              # Next.js pages
├── components/       # React components
├── lib/             # Utilities & API
└── docs/            # Documentation
```

---

**See Also**:
- [Setup Guide](../setup/SETUP.md)
- [Development Phases](../development/ADMIN_PANEL_PHASES.md)
