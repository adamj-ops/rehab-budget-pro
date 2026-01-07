# Rehab Budget Pro

Simple, focused budget tracking for fix & flip real estate projects.

## Features

### Project Management
- **Deal Summary**: Property info, ARV, purchase price, three-column budget comparison, profit/ROI by scenario, MAO with spread analysis
- **Budget Detail**: 18 categories with three-column model (Underwriting → Forecast → Actual), inline add/edit/delete, photo attachments
- **Vendors**: Full CRUD vendor directory with trade, ratings, contact info, assign vendors to budget items
- **Draws**: Full CRUD draw management with status workflow (pending → approved → paid), public vendor submission form
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

### Phase 1: Core Features ✅ Complete
- [x] Project creation with Google Places autocomplete
- [x] Three-column budget model (Underwriting → Forecast → Actual)
- [x] Budget category templates with auto-seeding
- [x] Add/edit/delete budget items inline
- [x] Deal summary with three-column budget comparison
- [x] MAO calculation using underwriting budget
- [x] Profit/ROI calculations by scenario
- [x] Vendor CRUD (create, edit, delete, assign to items)
- [x] Draw management with CRUD operations
- [x] Public vendor draw request form (shareable link)
- [x] Photo attachments for line items (receipts, progress, before/after)

### Phase 2: Dashboard - Kanban Pipeline
- [ ] Install framer-motion, recharts dependencies
- [ ] Portfolio health hero metrics
- [ ] Kanban board with drag-drop status updates
- [ ] Search, filter, sort functionality
- [ ] Project cards with context-aware content

### Phase 3: Dashboard - Gantt Timeline
- [ ] Project timeline visualization
- [ ] Milestone and dependency tracking
- [ ] Zoom controls and filtering
- [ ] Today marker and progress indicators

### Phase 4: Dashboard - Risk & Alerts
- [ ] Attention needed section
- [ ] Over budget detection
- [ ] Behind schedule detection
- [ ] Contingency burn tracking

### Phase 5: Financial Analytics
- [ ] ROI distribution charts
- [ ] Profit by project visualization
- [ ] Time-period filtering
- [ ] Export to PDF/Excel

### Phase 6: Budget Intelligence
- [ ] Category breakdown across portfolio
- [ ] Cost benchmarking vs Minneapolis data
- [ ] Trend analysis

### Future
- [ ] User authentication
- [ ] Real-time collaboration
- [ ] Mobile app

## Documentation

- [CLAUDE.md](CLAUDE.md) - Development guidelines for AI assistants
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Current implementation progress
- [docs/DASHBOARD_PLAN.md](docs/DASHBOARD_PLAN.md) - Dashboard wireframes and UX specs
- [GOOGLE_PLACES_SETUP.md](GOOGLE_PLACES_SETUP.md) - Google Places API configuration

## License

MIT
