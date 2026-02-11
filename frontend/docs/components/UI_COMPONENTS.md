# UI Components Documentation

**Last Updated**: 2026-02-11

---

## Overview

Reusable UI components built with Radix UI and Tailwind CSS.

**Location**: `components/ui/`

---

## Component Status

### Planned Components

- [ ] Button
- [ ] Input
- [ ] Label
- [ ] Card
- [ ] Dialog
- [ ] Dropdown Menu
- [ ] Select
- [ ] Toast
- [ ] Tabs
- [ ] Badge
- [ ] Alert

---

## Component Guidelines

### Naming Convention

- PascalCase for component names
- kebab-case for file names
- Example: `Button` component in `button.tsx`

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Follow design system tokens

### Props

- Use TypeScript interfaces for props
- Provide default values where appropriate
- Document props with JSDoc comments

---

## Usage Example

```typescript
import { Button } from '@/components/ui/button'

<Button variant="primary" size="lg">
  Click Me
</Button>
```

---

**Note**: Components will be documented as they are created.
