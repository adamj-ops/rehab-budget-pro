# Rehab Budget Pro

Simple, focused budget tracking for fix & flip real estate projects.

## Features

### Project Management
- **Deal Summary**: Property info, ARV, purchase price, profit/ROI calculations, MAO
- **Budget Detail**: 18 categories with three-column budget model (Underwriting → Forecast → Actual)
  - Inline editing of amounts and status
  - Drag & drop reordering of line items within categories
  - Photo/receipt uploads per line item
  - Bulk selection and status updates
- **Vendors**: Master vendor directory with full CRUD
  - Trade classification and ratings
  - Tags and contact history tracking
  - CSV import/export
- **Draws**: Full payment schedule management
  - Create, edit, delete draws
  - Status transitions (Pending → Approved → Paid)
  - Payment method and milestone tracking
  - Progress visualization
- **Cost Reference**: Minneapolis metro pricing guide for estimates

### Multi-Project Dashboard (Planned)
- **Portfolio Health**: Total ARV, capital deployed, average ROI at a glance
- **Kanban Pipeline**: Drag-drop projects through stages (Lead → Analyzing → Contract → Rehab → Listed → Sold)
- **Gantt Timeline**: Visual project timelines with milestones and dependencies
- **Risk Alerts**: Automatic detection of over-budget and behind-schedule projects
- **Budget Insights**: Category-level spending analysis across all projects

See [docs/DASHBOARD_PLAN.md](docs/DASHBOARD_PLAN.md) for detailed wireframes and implementation plan.

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui (Mira theme)
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand + React Query
- **Icons**: Tabler Icons
- **Animations**: Framer Motion (planned)
- **Charts**: Recharts (planned)

## Getting Started

### 1. Clone and Install

```bash
cd rehab-budget-pro
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Run Database Migrations

In your Supabase SQL Editor, run these files in order:

1. `supabase/schema.sql` - Creates tables, views, RLS policies
2. `supabase/seed.sql` - Seeds cost reference data

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
rehab-budget-pro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Home / Dashboard
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Tailwind + custom styles
│   │   └── projects/
│   │       ├── new/
│   │       │   └── page.tsx   # New project form
│   │       └── [id]/
│   │           └── page.tsx   # Project detail page
│   ├── components/
│   │   ├── dashboard/         # Dashboard components (planned)
│   │   │   ├── portfolio-health.tsx
│   │   │   ├── attention-needed.tsx
│   │   │   ├── project-timeline.tsx
│   │   │   ├── project-pipeline.tsx
│   │   │   ├── financial-performance.tsx
│   │   │   └── budget-insights.tsx
│   │   ├── kanban/            # Kanban board (planned)
│   │   │   ├── kanban-board.tsx
│   │   │   ├── project-card.tsx
│   │   │   └── kanban-filters.tsx
│   │   ├── timeline/          # Gantt timeline (planned)
│   │   │   ├── gantt-chart.tsx
│   │   │   └── timeline-controls.tsx
│   │   ├── project/
│   │   │   ├── project-tabs.tsx
│   │   │   └── tabs/
│   │   │       ├── deal-summary-tab.tsx
│   │   │       ├── budget-detail-tab.tsx
│   │   │       ├── vendors-tab.tsx
│   │   │       ├── draws-tab.tsx
│   │   │       └── cost-reference-tab.tsx
│   │   └── providers/
│   │       └── query-provider.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts      # Browser client
│   │   │   └── server.ts      # Server client
│   │   ├── store.ts           # Zustand stores
│   │   ├── utils.ts           # Helpers, formatters
│   │   ├── timeline-utils.ts  # Timeline data transforms (planned)
│   │   └── kanban-utils.ts    # Kanban helpers (planned)
│   └── types/
│       └── index.ts           # TypeScript types
├── docs/
│   └── DASHBOARD_PLAN.md      # Dashboard wireframes & specs
└── supabase/
    ├── schema.sql             # Database schema
    ├── migrations/            # Schema migrations
    └── seed.sql               # Cost reference data
```

## Database Schema

### Tables

1. **projects** - Property/deal information
2. **budget_items** - Line items with qty, rate, actual
3. **vendors** - Master vendor directory
4. **draws** - Payment schedule/tracking
5. **cost_reference** - Pricing lookup table

### Views

- `project_summary` - Projects with calculated totals
- `budget_by_category` - Aggregated by category
- `vendor_payment_summary` - Vendor totals

## Roadmap

### Completed
- [x] Add/edit budget items inline
- [x] Drag & drop reorder line items
- [x] Add/edit/delete vendors with tags
- [x] CSV import/export for vendors
- [x] Create/update/delete draws with status transitions
- [x] Photo/receipt attachments for line items
- [x] Bulk selection and status updates

### In Progress
- [ ] User authentication
- [ ] Project creation form
- [ ] Export to Excel/PDF
- [ ] Multi-project dashboard
- [ ] Notifications and reminders

## License

MIT
