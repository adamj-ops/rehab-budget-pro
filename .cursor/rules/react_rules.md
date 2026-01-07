# React Development Rules

## Component Patterns

### Functional Components
- Always use functional components (no class components)
- Use TypeScript for all components
- Export components as named exports (prefer over default)

### Component Structure
```typescript
// 1. Imports
import { ... } from '...'

// 2. Types
interface Props {
  // ...
}

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // Component logic
  return <div>...</div>
}
```

### Hooks Usage

#### useState
- Use for local component state
- Prefer specific state over complex objects when possible
- Extract complex state logic to custom hooks

#### useEffect
- Include all dependencies in dependency array
- Clean up subscriptions/event listeners
- Avoid using for state updates (use proper event handlers)

#### Custom Hooks
- Extract reusable logic to custom hooks
- Name hooks with `use` prefix
- Keep hooks focused on single responsibility

### Props

#### Naming
- Use descriptive, clear names
- Boolean props: `isActive`, `hasError`, `shouldShow`
- Event handlers: `onClick`, `onChange`, `onSubmit`

#### Types
- Always type props with TypeScript interfaces
- Mark optional props with `?`
- Provide default values when appropriate

## State Management

### Local State
- Use `useState` for component-specific state
- Keep state as close to where it's used as possible
- Lift state up only when needed

### Global State (Zustand)
- Use for UI state shared across components
- Examples: sidebar open/closed, selected project
- Keep stores small and focused

### Server State (React Query)
- Use React Query for all server state
- Don't duplicate server data in local state
- Use queries for fetching, mutations for updates

## Performance

### Optimization
- Use `React.memo` for expensive components
- Memoize callbacks with `useCallback` when passing to memoized children
- Memoize expensive calculations with `useMemo`
- Avoid premature optimization

### Re-renders
- Understand when components re-render
- Use React DevTools Profiler to identify issues
- Minimize unnecessary re-renders

## Event Handlers

### Naming
- Use `handle` prefix for internal handlers: `handleClick`, `handleSubmit`
- Pass `on` prefixed props for external handlers: `onClick`, `onSubmit`

### Implementation
- Extract complex handlers to separate functions
- Use arrow functions for simple inline handlers
- Avoid creating functions in render (use useCallback when needed)

## Forms

### Controlled Components
- Always use controlled components for forms
- Single source of truth for form state
- Use `value` and `onChange` pattern

### Form Libraries
- Consider React Hook Form for complex forms
- Use native HTML5 validation attributes
- Implement custom validation when needed

## Error Handling

### Error Boundaries
- Implement error boundaries for component trees
- Show user-friendly error messages
- Log errors for debugging

### Async Operations
- Handle loading states
- Handle error states
- Provide fallback UI

## Accessibility

### Semantic HTML
- Use semantic HTML elements
- Proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for buttons, `<a>` for links

### ARIA
- Use ARIA attributes when needed
- Ensure keyboard navigation works
- Test with screen readers

### Focus Management
- Manage focus for modals and dialogs
- Return focus after closing modals
- Skip links for keyboard users

## Code Organization

### File Structure
- One component per file (unless closely related)
- Colocate related files (component + styles + tests)
- Use index files for clean imports

### Import Organization
1. React and Next.js
2. Third-party libraries
3. Internal utilities and hooks
4. Types
5. Styles
6. Relative imports

### Component Size
- Keep components under 300 lines
- Extract sub-components when needed
- Extract logic to custom hooks

## Testing Patterns (When Implemented)

### Component Tests
- Test user interactions
- Test props and state changes
- Test accessibility

### Mocking
- Mock external dependencies
- Mock Supabase clients in tests
- Use MSW for API mocking if needed

