# Agent Notes - Rehab Budget Pro

**Last Updated:** 2025-01-06

## Project Overview

Rehab Budget Pro is a budget tracking application for fix & flip real estate projects. It helps investors track three distinct budget phases:
1. **Underwriting** - Initial deal analysis (pre-contract)
2. **Forecast** - Refined budget after walkthrough/contractor bids
3. **Actual** - Real spend tracking during/after construction

## Tech Stack

- **Framework**: Next.js 15 + React 19 (App Router)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Mira theme)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand + React Query (TanStack Query)
- **Icons**: Tabler Icons
- **Forms**: Google Places Autocomplete API
- **UI Components**: Radix UI primitives via shadcn/ui

## Project Structure

```
rehab-budget-pro/
├── .cursor/              # Agent documentation (THIS FOLDER)
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities, stores, Supabase clients
│   └── types/           # TypeScript type definitions
├── supabase/
│   ├── migrations/      # Database migration files
│   ├── schema.sql       # Current schema
│   └── seed.sql         # Seed data
└── reference/           # PRD and other reference docs
```

## Key Architecture Decisions

### Three-Column Budget Model
The core feature is tracking three distinct budget phases:
- **Underwriting**: Pre-deal estimate (for acquisition analysis)
- **Forecast**: Post-walkthrough refined estimate
- **Actual**: Real spend tracking

Variances are computed automatically:
- `forecast_variance = forecast - underwriting`
- `actual_variance = actual - forecast`
- `total_variance = actual - underwriting`

### Database Schema Highlights

**Core Tables:**
- `projects` - Property/deal information
- `budget_items` - Line items with three-column budget amounts
- `budget_category_templates` - Pre-seeded 18 categories with default line items
- `line_item_photos` - Photo storage metadata (links to Supabase Storage)
- `vendors` - Master vendor directory
- `draws` - Payment schedule/tracking
- `cost_reference` - Minneapolis metro pricing guide

**Views:**
- `project_summary` - Aggregated project totals with three-column budgets
- `budget_by_category` - Category-level aggregations with variances
- `vendor_payment_summary` - Vendor payment totals

### State Management Strategy

- **Zustand**: Global UI state (sidebar, theme, selected project)
- **React Query**: Server state, caching, optimistic updates
- **Local State**: Component-specific state (forms, modals)

### Component Organization

- `components/project/` - Project-specific components
  - `project-tabs.tsx` - Tab container
  - `tabs/` - Individual tab components
- `components/data-table/` - Reusable data table components
- `components/editor/` - Rich text editor components
- `components/ui/` - shadcn/ui base components

## Development Workflow

### Database Migrations

Migrations are located in `supabase/migrations/` and should be:
1. Named with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
2. Applied via Supabase CLI: `supabase db push`
3. Documented in `IMPLEMENTATION_STATUS.md`

### Key Files to Reference

- **Status**: `IMPLEMENTATION_STATUS.md` - Current feature status
- **PRD**: `reference/prd.md` - Product requirements
- **Setup**: `README.md` - Getting started guide
- **Google Places**: `GOOGLE_PLACES_SETUP.md` - Google Places API setup

### Current Phase

**Phase 1 Complete:**
- ✅ Three-column budget model implemented
- ✅ Database schema with migrations
- ✅ Project creation flow with Google Places
- ✅ Budget detail tab with inline editing
- ✅ Category templates with auto-seeding

**Phase 2 In Progress:**
- 🚧 Drag & drop reordering
- 🚧 Add/delete line items
- 🚧 Photo upload functionality
- 🚧 Deal summary tab updates

## Important Patterns

### Inline Editing Pattern
Budget items use inline editing with optimistic updates:
1. Click edit icon (pencil)
2. Edit fields appear inline
3. Changes saved with React Query mutation
4. Optimistic update shows immediately
5. Rollback on error

### Form Simplification
- **Project creation**: Street address is the project name (no redundant field)
- **Google Places**: Auto-fills city, state, ZIP from address selection
- **Auto-seeding**: Projects automatically get 18 categories with default line items

### Supabase Client Usage
- Server-side: Use `createClient()` from `lib/supabase/server.ts`
- Client-side: Use `createClient()` from `lib/supabase/client.ts`
- RLS policies: Currently allows anonymous access (auth not implemented yet)

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` - Google Places API key

## Known Technical Debt

1. **Authentication**: `user_id` is currently null in all inserts (auth not implemented)
2. **RLS Enforcement**: Need to implement auth first before enforcing RLS
3. **Error Boundaries**: Missing error handling for failed mutations
4. **Mobile Responsive**: Budget table needs horizontal scroll optimization
5. **Real-time Updates**: No real-time sync (manual refresh required)

## User Preferences & Patterns

- Prefer explicit, step-by-step implementation
- Create detailed technical specs before major features
- Update documentation frequently ("doc it" command)
- Use checkpoint commits for major changes

## Related Documentation

- See `.cursor/notes/project_checklist.md` for current tasks and progress
- See `.cursor/notes/notebook.md` for interesting findings and tidbits
- See `.cursor/docs/` for technical specifications

