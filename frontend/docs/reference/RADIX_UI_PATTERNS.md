# Radix UI Patterns Reference

**Last Updated**: 2026-02-11  
**Source**: [Radix UI](https://www.radix-ui.com/) - [GitHub Repository](https://github.com/radix-ui/primitives)

---

## Overview

This document references Radix UI patterns and best practices used in the admin panel. All components follow Radix UI's headless, accessible component patterns.

---

## Component Patterns

### 1. Checkbox Component

**Reference**: [Radix UI Checkbox](https://www.radix-ui.com/primitives/docs/components/checkbox)

**Pattern**:
```tsx
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

<CheckboxPrimitive.Root>
  <CheckboxPrimitive.Indicator>
    {/* Check icon */}
  </CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
```

**Our Implementation**: `components/ui/checkbox.tsx`
- Uses `CheckboxPrimitive.Root` for the checkbox
- Uses `CheckboxPrimitive.Indicator` for the checkmark
- Styled with Tailwind CSS
- Accessible by default (keyboard navigation, screen readers)

---

### 2. Dropdown Menu Component

**Reference**: [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)

**Pattern**:
```tsx
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

<DropdownMenuPrimitive.Root>
  <DropdownMenuPrimitive.Trigger />
  <DropdownMenuPrimitive.Content>
    <DropdownMenuPrimitive.Item />
  </DropdownMenuPrimitive.Content>
</DropdownMenuPrimitive.Root>
```

**Our Implementation**: `components/ui/dropdown-menu.tsx`
- Full dropdown menu implementation
- Accessible keyboard navigation
- Portal-based positioning

---

### 3. Button Component

**Pattern**: Uses Radix UI Slot for composition
```tsx
import { Slot } from '@radix-ui/react-slot'

<Slot asChild={asChild}>
  {/* Button content */}
</Slot>
```

**Our Implementation**: `components/ui/button.tsx`
- Uses `@radix-ui/react-slot` for flexible composition
- Variant-based styling with CVA
- Accessible focus states

---

## Radix UI Principles

### 1. Headless Components
- Radix UI provides unstyled, accessible primitives
- We add styling with Tailwind CSS
- Full control over appearance

### 2. Accessibility First
- Keyboard navigation built-in
- Screen reader support
- ARIA attributes handled automatically
- Focus management

### 3. Composition
- Components are composable
- Use `asChild` prop for flexible rendering
- Slot pattern for polymorphic components

### 4. Uncontrolled by Default
- Components work without state management
- Can be controlled when needed
- Flexible API

---

## Installed Radix UI Packages

```json
{
  "@radix-ui/react-checkbox": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-select": "^2.0.0",
  "@radix-ui/react-slot": "^1.0.2",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-toast": "^1.1.5"
}
```

---

## Component Styling Patterns

### Color System
- Uses CSS variables for theming
- HSL color format for easy manipulation
- Light/dark mode support

### Spacing
- Consistent spacing scale
- Tailwind spacing utilities
- Responsive breakpoints

### Typography
- System font stack
- Font weight: 400 (normal), 500 (medium), 600 (semibold)
- Letter spacing adjustments for headings

---

## Best Practices

1. **Always use forwardRef**: For proper ref forwarding
2. **Display names**: Set `displayName` for better debugging
3. **TypeScript**: Full type safety with Radix UI types
4. **Composition**: Prefer composition over configuration
5. **Accessibility**: Never remove accessibility features

---

## References

- **Radix UI Website**: https://www.radix-ui.com/
- **Radix UI GitHub**: https://github.com/radix-ui/primitives
- **Radix UI Docs**: https://www.radix-ui.com/primitives/docs/overview/introduction

---

**Last Updated**: 2026-02-11
