# Next.js Development Rules

## App Router Patterns

### Server vs Client Components
- Default to Server Components (no 'use client')
- Only use 'use client' when needed for:
  - Interactive features (onClick, useState, useEffect)
  - Browser APIs
  - Context providers
  - React Query hooks

### File Structure
- Use App Router conventions
- Colocate components with pages when specific to that page
- Shared components in `components/` directory
- Use route groups `(group)` for organization if needed

### Data Fetching
- Server Components: Use Supabase server client directly
- Client Components: Use React Query with Supabase client
- Prefer server-side data fetching when possible

### API Routes
- Use Server Actions for mutations when possible
- API routes in `app/api/` for external integrations
- Keep API routes thin (delegate to lib functions)

## TypeScript Patterns

### Type Safety
- All database queries should use TypeScript types from `types/index.ts`
- Use type inference where possible
- Avoid `any` types
- Use type guards for runtime validation

### Import Paths
- Use absolute imports from `src/` when configured
- Consistent import ordering: external → internal → relative

## State Management

### React Query Usage
- Use for all server state (projects, budget items, etc.)
- Implement optimistic updates for mutations
- Set appropriate staleTime and cacheTime
- Use query keys consistently: `['projects'], ['budget-items', projectId]`

### Zustand Stores
- Keep stores small and focused
- Use for UI state only (not server state)
- Avoid duplicating data from React Query

## Component Patterns

### Component Structure
1. Imports (external → internal → relative)
2. Types/interfaces
3. Component definition
4. Helper functions (if needed)
5. Export

### Props Naming
- Use descriptive names
- Prefer explicit props over spreading when unclear
- Document complex prop types

### Error Handling
- Use error boundaries for component trees
- Handle errors at the appropriate level
- Show user-friendly error messages
- Log errors for debugging

## Performance

### Code Splitting
- Use dynamic imports for heavy components
- Lazy load modals, drawers, and non-critical components
- Route-based code splitting handled by Next.js automatically

### Optimization
- Use `React.memo` for expensive components that re-render often
- Use `useMemo` and `useCallback` sparingly (only when needed)
- Avoid premature optimization

## Styling

### Tailwind CSS
- Use utility classes primarily
- Extract complex patterns to components
- Use CSS variables for theme values
- Follow responsive-first approach

### Component Library (shadcn/ui)
- Use existing components from `components/ui/`
- Extend components rather than recreating
- Maintain consistency with design system

## Environment Variables

### Naming
- Client variables: `NEXT_PUBLIC_*` prefix required
- Server-only variables: No prefix (not exposed to client)

### Access
- Server: `process.env.VARIABLE_NAME`
- Client: `process.env.NEXT_PUBLIC_VARIABLE_NAME`

## Testing (When Implemented)

### Unit Tests
- Test utilities and helper functions
- Test component logic (not rendering details)

### Integration Tests
- Test data flow through components
- Test React Query mutations and queries

### E2E Tests
- Test critical user flows
- Test form submissions
- Test navigation

