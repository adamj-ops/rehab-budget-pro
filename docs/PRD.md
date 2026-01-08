# Product Requirements Document (PRD)
## Rehab Budget Pro - Fix & Flip Real Estate Budget Tracking

**Version:** 1.0
**Last Updated:** January 8, 2026
**Status:** In Development (Phase 5)

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Target Users](#target-users)
3. [Core Value Propositions](#core-value-propositions)
4. [Feature Inventory](#feature-inventory)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [Implementation Status](#implementation-status)
8. [Roadmap & Priorities](#roadmap--priorities)
9. [Development Patterns](#development-patterns)
10. [Key Files Reference](#key-files-reference)

---

## Product Overview

**Rehab Budget Pro** is a fix & flip real estate project budget tracking application designed for real estate investors and property flippers. It provides comprehensive tools for:

- **Budget Management** with a three-column model (Underwriting → Forecast → Actual)
- **Vendor Management** with ratings, contact history, and assignment to line items
- **Draw Tracking** for payment schedules and milestone-based disbursements
- **Photo Documentation** attached to individual budget line items
- **Portfolio Dashboard** with Kanban-style pipeline visualization
- **Cost Reference** data for Minneapolis metro market pricing

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript 5.7
- **Styling:** Tailwind CSS v4, shadcn/ui (Mira theme), Radix UI primitives
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management:** React Query (server state), Zustand (UI state)
- **Icons:** @tabler/icons-react

---

## Target Users

1. **Fix & Flip Investors** - Managing multiple renovation projects
2. **Real Estate Wholesalers** - Analyzing deals and calculating MAO
3. **Project Managers** - Tracking budgets, vendors, and payments
4. **Property Flippers** - Single or multiple concurrent rehab projects

---

## Core Value Propositions

### 1. Three-Column Budget Model
Track financial evolution from initial analysis through project completion:
- **Underwriting** - Pre-deal estimates for initial analysis
- **Forecast** - Post-walkthrough/contractor bid amounts
- **Actual** - Real spend as work progresses

### 2. Variance Analysis
Automatically calculated variances:
- **Scope Creep Variance** = Forecast - Underwriting
- **Execution Variance** = Actual - Forecast
- **Total Variance** = Actual - Underwriting

### 3. MAO Calculation (Maximum Allowable Offer)
Built-in 70% rule and configurable calculation methods:
- ARV - (selling costs + holding costs + rehab budget + contingency + target profit)

### 4. Portfolio Pipeline View
Kanban board showing all projects across status columns:
- Leads → Analyzing → Under Contract → In Rehab → Listed → Sold

---

## Feature Inventory

### ✅ COMPLETED FEATURES

#### Projects & Dashboard
| Feature | Description | Location |
|---------|-------------|----------|
| Create Project | Form with Google Places autocomplete for address | `/projects/new` |
| Project Detail | Tabbed interface with 5 tabs | `/projects/[id]` |
| Kanban Pipeline | Drag-drop status board with 5 columns | `/` (home) |
| Portfolio Metrics | Hero cards: Total ARV, Capital Deployed, Avg ROI | `/` (home) |
| Project Search | Filter projects across all Kanban columns | Dashboard |

#### Budget Management (Hero Feature)
| Feature | Description | Location |
|---------|-------------|----------|
| Three-Column Display | Side-by-side Underwriting/Forecast/Actual | Budget Detail Tab |
| 18 Budget Categories | Soft Costs, Demo, Structural, Plumbing, HVAC, Electrical, etc. | Database enum |
| Line Item CRUD | Add, edit, delete budget items per category | Budget Detail Tab |
| Inline Editing | Edit amounts directly in table cells | Budget Detail Tab |
| Bulk Operations | Select items, bulk status update, bulk delete | Budget Detail Tab |
| Drag & Drop Reorder | Reorder items within categories | Budget Detail Tab |
| Photo Attachments | Upload receipts/progress photos per line item | Budget Detail Tab |
| Auto-Seeding | New projects get default line items per category | Project creation |
| Variance Highlighting | Red=over budget, Green=under budget | Budget Detail Tab |

#### Vendor Management
| Feature | Description | Location |
|---------|-------------|----------|
| Vendor CRUD | Full create, read, update, delete | Vendors Tab |
| Vendor Assignment | Link vendors to budget line items | Budget Detail Tab |
| 21 Trade Types | General Contractor, Plumber, Electrician, HVAC, etc. | Database enum |
| Ratings (1-5 stars) | Star rating with clear button | Vendor cards |
| Contact History | Timeline of calls, emails, meetings, site visits | Vendor detail sheet |
| Vendor Tags | Custom colored tags for organization | Vendor cards |
| Follow-Up Reminders | Track follow-up dates and completion | Contact history |
| CSV Import/Export | Bulk vendor data management | Vendors Tab |
| Duplicate Detection | Warns when adding duplicate vendors | Add vendor form |

#### Draw Management
| Feature | Description | Location |
|---------|-------------|----------|
| Draw CRUD | Full create, read, update, delete | Draws Tab |
| Status Workflow | Pending → Approved → Paid with quick status changes | Draws Tab |
| 6 Milestones | project_start, demo_complete, rough_in, drywall, finishes, final | Database enum |
| Vendor Linking | Associate draws with specific vendors | Draw form |
| Auto-Numbering | Sequential draw numbers per project | Automatic |
| Public Vendor Form | Shareable link for vendors to submit draw requests | `/draw-request/[projectId]` |
| Payment Details | Method, reference number, notes tracking | Draw form |

#### Photo Management
| Feature | Description | Location |
|---------|-------------|----------|
| Per-Item Photos | Camera icon on each budget line item | Budget Detail Tab |
| Drag & Drop Upload | react-dropzone integration | Photo upload sheet |
| Photo Types | receipt, progress, before, after, other | Auto-detect from filename |
| Photo Gallery | Grid view with thumbnails and type badges | Photo gallery component |
| Supabase Storage | Secure signed URLs with expiration | Backend |
| Photo Count Badges | Shows count on camera icon | Budget Detail Tab |

#### Deal Summary Tab
| Feature | Description | Location |
|---------|-------------|----------|
| Quick Stats Bar | ARV, Purchase Price, Rehab Budget, Total Investment, ROI | Deal Summary Tab |
| Three-Column Comparison | Budget comparison across all three columns | Deal Summary Tab |
| Profit/ROI by Scenario | Calculations for each budget phase | Deal Summary Tab |
| MAO Calculation | 70% rule with contingency | Deal Summary Tab |
| Spread Analysis | Purchase price vs MAO comparison | Deal Summary Tab |
| Active Scenario Detection | Highlights most relevant budget phase | Deal Summary Tab |

#### Cost Reference
| Feature | Description | Location |
|---------|-------------|----------|
| Minneapolis Pricing | Pre-seeded market data | Cost Reference Tab |
| Low/Mid/High Ranges | Price ranges per unit type | Cost Reference Tab |
| Search & Filter | By category and item name | Cost Reference Tab |

#### Authentication (Pages Built)
| Feature | Description | Location |
|---------|-------------|----------|
| Login Page | Supabase Auth UI | `/auth/login` |
| Signup Page | Account creation | `/auth/signup` |
| OAuth Callback | Redirect handler | `/auth/callback` |
| Middleware | Route protection (not enforced) | `middleware.ts` |

---

### ⚠️ PARTIALLY IMPLEMENTED

#### Calculation Settings
| Feature | Status | What's Missing |
|---------|--------|----------------|
| Database Schema | ✅ Complete | 50+ settings fields ready |
| Settings UI Page | ✅ Built | All sections rendered |
| **Save Mutations** | ❌ Not implemented | TODO at line 54 of settings page |

**Configurable Settings Include:**
- MAO Method: 70% rule, ARV minus all, gross margin, custom %, net profit target
- ROI Method: simple, cash-on-cash, annualized, simplified IRR
- Contingency: flat %, category-weighted, tiered, scope-based
- Holding Costs: flat monthly, % of loan, itemized, hybrid
- Profit Thresholds: minimum, target, excellent ($ and %)
- Variance Alerts: warning/critical thresholds

#### Project Edit
| Feature | Status | What's Missing |
|---------|--------|----------------|
| Edit Page | ✅ Route exists | Minimal form, needs full field editing |

---

### 📋 BUILT BUT NOT INTEGRATED

#### PDF Export System
**Components Ready:** `src/components/pdf/`

| Template | Purpose |
|----------|---------|
| `executive-summary.tsx` | High-level overview |
| `investment-analysis.tsx` | Deal analysis |
| `detailed-budget.tsx` | Full budget breakdown |
| `property-showcase.tsx` | Photos and property info |
| `vendor-summary.tsx` | Vendor details |
| `draw-schedule.tsx` | Payment schedule |

**What's Needed:** Export buttons in UI, dialog wiring

#### Rich Text Editor
**Components Ready:** `src/components/editor/`

| Component | Purpose |
|-----------|---------|
| `rich-text-editor.tsx` | Full Tiptap editing |
| `editor-toolbar.tsx` | Formatting buttons |
| `journal.tsx` | Notes/activity log |

**What's Needed:** Integration into Deal Summary tab, auto-save to `projects.notes`

#### Dashboard Analytics
**Components Ready:** `src/components/dashboard/`

| Component | Purpose |
|-----------|---------|
| `timeline/project-timeline.tsx` | Gantt chart |
| `alerts/attention-needed.tsx` | Risk alerts |
| `analytics/financial-performance.tsx` | ROI/profit charts |
| `budget/budget-insights.tsx` | Category analysis |

**What's Needed:** Connect to data, add to dashboard

#### Advanced Data Table
**Components Ready:** `src/components/data-table/`

Features built: editable cells, bulk actions, row expansion, pagination, sorting

---

### ❌ NOT STARTED

| Feature | Priority | Description |
|---------|----------|-------------|
| User ID Enforcement | HIGH | Pass authenticated user_id in all mutations |
| RLS Policy Enforcement | HIGH | Re-enable Row Level Security |
| Real-Time Collaboration | MEDIUM | Supabase Realtime subscriptions |
| Budget Version History | LOW | Snapshots and revision tracking |
| Mobile Optimization | MEDIUM | Responsive tables and forms |
| Error Boundaries | MEDIUM | Fallback UIs for failed tabs |

---

## Technical Architecture

### Data Flow Pattern
```
User Action → React Query Mutation → Supabase → Cache Invalidation → Re-render
```

### State Management
- **React Query** - Server state, data fetching, mutations, caching
- **Zustand** (`src/lib/store.ts`) - Client UI state (sidebar, modals, active tabs)

### Client Configuration
- **Browser:** `src/lib/supabase/client.ts` - Singleton via `getSupabaseClient()`
- **Server:** `src/lib/supabase/server.ts` - For Server Components

### Key Patterns

#### Data Fetching (React Query)
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

#### Mutations with Optimistic Updates
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

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `projects` | Property details, financials, status | arv, purchase_price, status, dates |
| `budget_items` | Line items with three-column model | underwriting_amount, forecast_amount, actual_amount |
| `vendors` | Master vendor directory | trade, rating, contact info, qualifications |
| `draws` | Payment tracking | amount, status, milestone, vendor_id |
| `cost_reference` | Minneapolis pricing guide | category, low, mid, high |
| `line_item_photos` | Photo attachments | storage_path, photo_type, caption |
| `vendor_tags` | Custom vendor categorization | name, color |
| `vendor_contacts` | Contact history timeline | contact_type, follow_up_date |
| `calculation_settings` | User-configurable algorithms | 50+ settings fields |

### Database Views (Use for Reads)

| View | Purpose |
|------|---------|
| `project_summary` | Projects with calculated totals (rehab_budget, mao, roi, profit) |
| `budget_by_category` | Budget/actual/variance aggregated by category |
| `vendor_payment_summary` | Vendor totals across projects |

### Key Enums

```typescript
type ProjectStatus = 'lead' | 'analyzing' | 'under_contract' | 'in_rehab' | 'listed' | 'sold' | 'dead';

type BudgetCategory = 'soft_costs' | 'demo' | 'structural' | 'plumbing' | 'hvac' |
  'electrical' | 'insulation_drywall' | 'interior_paint' | 'flooring' | 'tile' |
  'kitchen' | 'bathrooms' | 'doors_windows' | 'interior_trim' | 'exterior' |
  'landscaping' | 'finishing' | 'contingency';

type ItemStatus = 'not_started' | 'in_progress' | 'complete' | 'on_hold' | 'cancelled';

type DrawStatus = 'pending' | 'approved' | 'paid';
```

---

## Implementation Status

### Phase Completion

| Phase | Name | Status | Completion |
|-------|------|--------|------------|
| 1 | Core Foundation | ✅ Complete | 100% |
| 2 | Vendor Management | ✅ Complete | 100% |
| 3 | Draw Management | ✅ Complete | 100% |
| 4 | Photo Management | ✅ Complete | 100% |
| 5 | Dashboard & Kanban | ✅ Complete | 100% |
| 6 | Calculation Settings | ⚠️ Partial | 80% (DB ready, UI needs mutations) |
| 7 | PDF Exports | 📋 Built | 0% (components ready, not integrated) |
| 8 | Authentication | ⚠️ Partial | 60% (pages built, not enforced) |

---

## Roadmap & Priorities

### HIGH PRIORITY (Next Sprint)

1. **Implement Calculation Settings Mutations**
   - Wire settings UI to save to Supabase
   - Update queries to fetch user's settings
   - Files: `src/app/settings/calculations/page.tsx`, new hook needed

2. **Integrate PDF Export System**
   - Add export buttons to project tabs
   - Wire export dialog to generate PDFs
   - Files: `src/components/pdf/`, button integration needed

3. **Enforce Authentication**
   - Pass authenticated `user_id` in all mutations
   - Re-enable RLS policies
   - Files: All hooks in `src/hooks/`, `middleware.ts`

### MEDIUM PRIORITY

4. **Integrate Rich Text Notes**
   - Add editor to Deal Summary tab
   - Auto-save to `projects.notes`
   - Files: `src/components/editor/`, `deal-summary-tab.tsx`

5. **Connect Dashboard Analytics**
   - Integrate Gantt timeline
   - Connect risk alerts component
   - Files: `src/components/dashboard/timeline/`, `alerts/`

6. **Mobile Responsive Optimization**
   - Horizontal scroll for budget table
   - Mobile-optimized forms
   - Files: `budget-detail-tab.tsx`, form sheets

### LOW PRIORITY

7. **Real-Time Collaboration**
   - Supabase Realtime subscriptions
   - Multi-user sync
   - Files: `src/hooks/use-realtime.ts`

8. **Budget Version History**
   - Snapshot functionality
   - Revision tracking

---

## Development Patterns

### File Organization
```
src/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── project/            # Project-specific components
│   │   └── tabs/           # Tab components
│   ├── dashboard/          # Dashboard components
│   ├── pdf/                # PDF templates
│   └── editor/             # Rich text editor
├── hooks/                  # Custom React hooks (16 total)
├── lib/
│   ├── supabase/          # Supabase clients
│   └── store.ts           # Zustand stores
└── types/                  # TypeScript definitions
```

### Naming Conventions
- **Components:** PascalCase (`BudgetDetailTab.tsx`)
- **Hooks:** camelCase with `use-` prefix (`use-budget-items.ts`)
- **Types:** PascalCase (`ProjectSummary`, `BudgetItem`)
- **Database:** snake_case (`budget_items`, `project_summary`)

### Component Patterns
- **Server Components:** Page layouts, data fetching (async)
- **Client Components:** Interactive features (`'use client'`)
- **Sheet Components:** Slide-out forms (add/edit entities)
- **Dialog Components:** Confirmation dialogs

### CSS Utilities (in `globals.css`)
- Status badges: `.status-active`, `.status-pending`, `.status-completed`
- Stat cards: `.stat-card`, `.stat-value`
- Tables: `.table-header`, `.table-row-hover`
- Icons: `.icon-sm`, `.icon-md`, `.icon-lg`

---

## Key Files Reference

### Data Layer
| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/store.ts` | Zustand UI state stores |
| `src/types/index.ts` | All TypeScript types |

### Core Components
| File | Purpose |
|------|---------|
| `src/components/project/tabs/budget-detail-tab.tsx` | Hero budget management |
| `src/components/project/tabs/deal-summary-tab.tsx` | Financial summary |
| `src/components/dashboard/kanban-pipeline.tsx` | Portfolio Kanban |
| `src/components/dashboard/portfolio-health.tsx` | Hero metrics |

### Hooks
| File | Purpose |
|------|---------|
| `src/hooks/use-budget-item-mutations.ts` | Budget item CRUD |
| `src/hooks/use-vendor-mutations.ts` | Vendor CRUD |
| `src/hooks/use-draw-mutations.ts` | Draw CRUD |
| `src/hooks/use-photo-mutations.ts` | Photo upload/delete |

### Database
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Initial schema |
| `supabase/migrations/` | Migration files (10 total) |
| `supabase/seed.sql` | Cost reference data |

---

## Known Issues & Technical Debt

### Critical
1. **User ID Not Enforced** - All inserts use null user_id (RLS disabled)
2. **Settings Save Missing** - TODO at `settings/calculations/page.tsx:54`

### Medium
3. **Mobile Responsiveness** - Budget table needs horizontal scroll
4. **No Error Boundaries** - Missing fallback UIs on tabs
5. **Dashboard Views Not Connected** - Timeline, alerts built but not integrated

### Low
6. **Performance** - Large project lists may need pagination
7. **Photo Gallery** - Could use lazy loading

---

## Environment Setup

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (for Google Places)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key

# Development commands
npm install        # Install dependencies
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run lint       # Lint code
```

---

## Summary

**Rehab Budget Pro** is a well-architected, feature-rich application with most core functionality complete. The three-column budget model, vendor management, draw tracking, photo attachments, and Kanban dashboard are production-ready.

**Primary gaps:**
1. Authentication enforcement (user_id in mutations, RLS policies)
2. Calculation settings mutations (UI built, save not wired)
3. PDF export integration (components ready, buttons needed)
4. Rich text editor integration (component ready, needs placement)

**Estimated work to production:** 20-30 hours

---

*This PRD is designed to provide context for AI coding assistants (Cursor, Claude, Copilot) to understand the project structure, implemented features, and remaining work.*
