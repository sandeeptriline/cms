# Quick Install Guide

## Install Missing Package

The dashboard requires `@radix-ui/react-checkbox`. Install all packages:

```bash
cd frontend
npm install
```

**Note**: The `package.json` includes an `overrides` field to properly resolve `lucide-react` peer dependencies with React 19. This is the correct approach without using `--legacy-peer-deps`.

---

## Verify Installation

After installation, check that the package exists:

```bash
cd frontend
npm list @radix-ui/react-checkbox
```

You should see: `@radix-ui/react-checkbox@1.0.4`

---

## Then Start Dev Server

```bash
cd frontend
npm run dev
```

The dashboard should now work at http://localhost:3000/dashboard

---

**Note**: The checkbox component follows Radix UI patterns from [radix-ui.com](https://www.radix-ui.com/primitives/docs/components/checkbox)
