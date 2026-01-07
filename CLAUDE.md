# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rehab Budget Pro is a fix & flip real estate project budget tracking application built with Next.js 15, React 19, Supabase, and Tailwind CSS v4. The app helps manage property deals with budget tracking across 18 categories, vendor management, payment draws, and cost reference data for the Minneapolis metro area.

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm build

# Start production server
npm start

# Lint code
npm run lint
```

## Database Management

The project uses Supabase with SQL migrations located in `supabase/`:

- **Initial setup**: Run `supabase/schema.sql` in Supabase SQL Editor to create tables, views, enums, and RLS policies
- **Seed data**: Run `supabase/seed.sql` to populate cost reference data for Minneapolis metro pricing
- **Migrations**: SQL migration files are in `supabase/migrations/` directory
- **Reset database**: Use `supabase/reset.sql` to drop all tables and types

### Environment Setup

Required environment variables in `.env` or `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

### Data Flow Pattern

This app follows a specific data architecture that must be maintained:

1. **Supabase Client Layer** (`src/lib/supabase/`):
   - `client.ts`: Browser client with singleton pattern via `getSupabaseClient()`
   - `server.ts`: Server-side client for Server Components

2. **State Management**:
   - **Zustand stores** (`src/lib/store.ts`): Client-side UI state and optimistic updates
   - **React Query** (`@tanstack/react-query`): Server state, caching, and data fetching
   - Zustand handles: `currentProject`, `budgetItems`, `vendors`, `draws`, `activeTab`, UI modals
   - React Query handles: Database queries, mutations, cache invalidation

3. **Type System** (`src/types/index.ts`):
   - All database types mirror PostgreSQL schema exactly
   - Enums match database enums (e.g., `ProjectStatus`, `BudgetCategory`, `VendorTrade`)
   - View types for computed data: `ProjectSummary`, `BudgetByCategory`, `VendorPaymentSummary`
   - Input types omit `id`, `user_id`, `created_at`, `updated_at` fields

### Database Schema

**Core Tables**:
- `projects`: Property details, financials (ARV, purchase price, etc.), status tracking
- `budget_items`: Line items with qty × rate formulas, organized into 18 categories
- `vendors`: Master vendor directory with trade, ratings, licensing info
- `draws`: Payment tracking with milestones and status
- `cost_reference`: Minneapolis metro pricing guide (seeded data)

**Important Views** (use these for reads):
- `project_summary`: Projects with calculated totals (rehab_budget, total_investment, mao, profit, ROI)
- `budget_by_category`: Budget/actual/variance aggregated by category
- `vendor_payment_summary`: Vendor totals across projects

**Key Calculations**:
- Budget items: `budget = qty * rate`, `variance = actual - budget`
- MAO (Maximum Allowable Offer): `ARV - (selling_costs + holding_costs + rehab_budget_with_contingency + profit)`
- All calculated fields are in database views, not computed client-side

### Component Structure

**App Router** (`src/app/`):
- `page.tsx`: Home page (projects list)
- `projects/[id]/page.tsx`: Project detail page with tabbed interface
- `layout.tsx`: Root layout with providers (ThemeProvider, QueryProvider, Toaster)

**Project Tabs** (`src/components/project/tabs/`):
Each tab is a standalone component that queries its own data:
- `deal-summary-tab.tsx`: ARV, purchase price, profit/ROI, MAO calculations
- `budget-detail-tab.tsx`: 18 categories, line items with inline editing (uses TanStack Table)
- `vendors-tab.tsx`: Master vendor directory with ratings and contact info
- `draws-tab.tsx`: Payment schedule, milestones, progress tracking
- `cost-reference-tab.tsx`: Minneapolis metro pricing lookup

**UI Components** (`src/components/ui/`):
- Built with shadcn/ui (Mira theme variant)
- Radix UI primitives with Tailwind CSS v4
- Icons: Tabler Icons (`@tabler/icons-react`)

### Styling

- **Tailwind CSS v4**: Uses new `@import` syntax in `globals.css`
- **Theme**: Custom theme variables in `globals.css` for Mira variant
- **Dark Mode**: Supported via `ThemeProvider` with `data-theme` attribute
- **Fonts**: Inter (sans) and JetBrains Mono (mono) from fontsource-variable
- **Animations**: `tailwindcss-animate` plugin for enter/exit animations

### UI Consistency Utilities

The project uses reusable CSS utility classes defined in `globals.css` for consistent styling:

- **Status badges**: `.status-badge`, `.status-active`, `.status-pending`, `.status-completed`, `.status-draft`
- **Stat cards**: `.stat-card`, `.stat-card-compact`, `.stat-label`, `.stat-value`
- **Tables**: `.table-header`, `.table-row-hover`, `.col-underwriting`, `.col-forecast`, `.col-actual`
- **Forms**: `.form-input`, `.form-select`, `.inline-input`
- **Empty states**: `.empty-state`, `.empty-state-lg`, `.empty-state-icon`
- **Section headers**: `.section-header`, `.section-header-lg`, `.section-subheader`
- **Icons**: `.icon-xs`, `.icon-sm`, `.icon-md`, `.icon-lg`, `.icon-xl`
- **Animations**: `.fade-in`, `.scale-in`, `.slide-in-bottom`, `.modal-enter`, `.dropdown-enter`
- **Transitions**: `.transition-base`, `.transition-fast`, `.hover-lift`

Always prefer these utility classes over inline styles for consistency.

## Key Patterns to Follow

### Data Fetching

Always use React Query for server data:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['projects', projectId],
  queryFn: async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('project_summary')  // Use views for computed data
      .select('*')
      .eq('id', projectId)
      .single();
    if (error) throw error;
    return data;
  },
});
```

### Mutations

Use React Query mutations with optimistic updates:
```typescript
const mutation = useMutation({
  mutationFn: async (updates) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('budget_items')
      .update(updates)
      .eq('id', itemId);
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['budgetItems'] });
  },
});
```

### Type Safety

- Import types from `@/types` (path alias configured in `tsconfig.json`)
- Use database view types (`ProjectSummary`, `BudgetByCategory`) for read operations
- Use input types (`ProjectInput`, `BudgetItemInput`) for create/update operations
- Never create custom types for database entities; extend existing types

### Budget Calculations

DO NOT calculate budget totals client-side. Always use the `project_summary` view which has:
- `rehab_budget`: Sum of all budget items (qty × rate)
- `rehab_actual`: Sum of all actual costs
- `contingency_amount`: rehab_budget × contingency_percent
- `rehab_budget_with_contingency`: rehab_budget + contingency_amount
- `total_investment`: purchase_price + closing_costs + holding_costs_total + rehab_budget_with_contingency
- `mao`: Calculated per 70% rule formula

## Common Tasks

### Adding a New Database Column

1. Update `supabase/schema.sql` with ALTER TABLE statement
2. Add corresponding field to TypeScript type in `src/types/index.ts`
3. Run SQL in Supabase SQL Editor
4. Update components that display/edit the data

### Adding a New Budget Category

1. Add enum value to `budget_category` type in `supabase/schema.sql`
2. Add to `BudgetCategory` type in `src/types/index.ts`
3. Add to `BUDGET_CATEGORIES` array in `src/types/index.ts`
4. Update any UI that displays categories

### Creating a New View

1. Define view in `supabase/schema.sql`
2. Create corresponding TypeScript interface in `src/types/index.ts`
3. Use view name in Supabase queries (e.g., `.from('your_view_name')`)

## Project Status Workflow

Projects follow this status progression:
- `lead` → `analyzing` → `under_contract` → `in_rehab` → `listed` → `sold`
- Can be marked as `dead` at any point

## Important Notes

- **RLS Policies**: All tables have Row Level Security enabled (user_id filtering)
- **User ID**: Currently not enforced (authentication not implemented). Use placeholder or null.
- **Inline Editing**: Budget items and vendors should support inline editing (not yet fully implemented)
- **shadcn/ui**: When adding new UI components, use shadcn CLI or manually add to `src/components/ui/`
- **Path Aliases**: `@/` maps to `src/` (configured in `tsconfig.json`)
