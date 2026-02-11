# Best Practices

**Last Updated**: 2026-02-11

---

## Code Organization

### File Structure

- Group related files together
- Use clear, descriptive names
- Follow Next.js App Router conventions

### Component Organization

```
components/
├── ui/           # Reusable UI components
├── layout/       # Layout components
├── forms/        # Form components
└── features/     # Feature-specific components
```

---

## TypeScript

### Type Safety

- Always use TypeScript types
- Avoid `any` type
- Use interfaces for props
- Use enums for constants

### Example

```typescript
interface User {
  id: string
  email: string
  name?: string
}

function UserCard({ user }: { user: User }) {
  // Component code
}
```

---

## API Calls

### Error Handling

```typescript
try {
  const data = await api.getData()
} catch (error) {
  // Handle error
  console.error('Error:', error)
}
```

### Loading States

```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function fetchData() {
    setLoading(true)
    try {
      const data = await api.getData()
      setData(data)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

---

## Styling

### Tailwind CSS

- Use utility classes
- Use design tokens from `globals.css`
- Avoid inline styles

### Example

```typescript
<div className="flex items-center justify-between p-4 bg-card rounded-lg">
  {/* Content */}
</div>
```

---

## Performance

### Code Splitting

- Use dynamic imports for large components
- Lazy load routes when possible

### Optimization

- Use React.memo for expensive components
- Optimize re-renders
- Use useMemo and useCallback appropriately

---

## Accessibility

### ARIA Labels

```typescript
<button aria-label="Close dialog">
  <XIcon />
</button>
```

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Provide focus indicators
- Support keyboard shortcuts

---

## Testing

### Component Testing

- Test user interactions
- Test error states
- Test loading states

### API Testing

- Mock API responses
- Test error handling
- Test loading states

---

**See Also**:
- [Getting Started](./GETTING_STARTED.md)
- [Development Phases](../development/ADMIN_PANEL_PHASES.md)
