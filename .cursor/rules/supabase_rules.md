# Supabase Development Rules

## Database Patterns

### Migration Naming
- Format: `YYYYMMDDHHMMSS_description.sql`
- Use snake_case for descriptions
- Group related changes in single migration when logical
- Never modify applied migrations (create new ones)

### Schema Design
- Use UUID for primary keys (uuid_generate_v4())
- Always include `created_at` and `updated_at` timestamps
- Use `NOT NULL` constraints appropriately
- Add comments for complex columns/tables

### Computed Columns
- Use `GENERATED ALWAYS AS ... STORED` for computed values
- Examples: variances, totals, percentages
- Cannot be directly inserted/updated (automatically computed)

## RLS (Row Level Security)

### Policy Naming
- Format: `{action}_{table}_{description}`
- Example: `select_projects_own`, `insert_budget_items_own`

### Policy Patterns
- Always enforce RLS (even if allowing anonymous temporarily)
- Use `auth.uid()` for user-scoped policies
- Use `auth.jwt()` for role-based access

### Current Status
- RLS policies exist but allow anonymous access
- Will need updates when authentication is implemented

## Client Usage

### Server Client
- Use in Server Components and Server Actions
- Located: `lib/supabase/server.ts`
- Creates new client for each request
- Handles cookies automatically

### Browser Client
- Use in Client Components and hooks
- Located: `lib/supabase/client.ts`
- Singleton pattern (one instance)
- Handles auth state automatically

### Client Selection
```
Server Component → use server client
Server Action → use server client
Client Component → use browser client
React Hook → use browser client
API Route → use server client
```

## Query Patterns

### Type Safety
- Always use TypeScript types from `types/index.ts`
- Type query results explicitly
- Use type assertions only when necessary

### Error Handling
- Always check for errors in Supabase responses
- Handle network errors gracefully
- Provide user-friendly error messages

### Query Optimization
- Select only needed columns (not `*`)
- Use `.select()` explicitly
- Use views for complex aggregations
- Index frequently queried columns

## Storage

### Bucket Setup
- Bucket name: `project-photos`
- Path structure: `project-photos/{project_id}/{line_item_id}/{uuid}.{ext}`
- File size limit: 10MB
- Allowed types: jpg, png, webp, pdf

### File Upload Pattern
1. Validate file (size, type)
2. Generate unique filename (UUID)
3. Construct storage path
4. Upload to Supabase Storage
5. Insert metadata to `line_item_photos` table
6. Handle errors and cleanup

### RLS for Storage
- Policies match database RLS patterns
- Users can only access photos for their projects
- Currently allows anonymous (will update with auth)

## Real-time (Future)

### Subscriptions
- Use for live updates (when implemented)
- Subscribe to specific tables/rows
- Clean up subscriptions on unmount
- Handle reconnection logic

### Use Cases
- Budget item updates
- Project status changes
- Collaborative editing (future)

## Best Practices

### Transactions
- Use database transactions for multi-step operations
- Example: Creating project + seeding categories
- Use Supabase RPC functions for complex logic

### Migrations
- Test migrations on local/dev first
- Back up production before applying
- Review generated SQL carefully
- Keep migration files in version control

### Performance
- Use database indexes for foreign keys and frequently queried columns
- Use views for complex queries (better than client-side aggregation)
- Consider materialized views for expensive calculations
- Monitor query performance in Supabase dashboard

### Security
- Never expose service role key to client
- Use anon key for client-side operations
- Validate all user inputs
- Sanitize data before database operations
- Review RLS policies regularly

