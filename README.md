# Rehab Budget Pro

Simple, focused budget tracking for fix & flip real estate projects.

## Features

### Project Management
- **Deal Summary**: Property info, ARV, purchase price, profit/ROI calculations, MAO
- **Budget Detail**: 18 categories with three-column model (Underwriting → Forecast → Actual)
- **Vendors**: Master vendor directory with trade, ratings, contact info
- **Draws**: Payment tracking with milestones and progress visualization
- **Cost Reference**: Minneapolis metro pricing guide for estimates

### Calculation Settings (NEW)
- **Customizable Algorithms**: Build your own deal analysis formulas
- **MAO Methods**: 70% Rule, Custom %, ARV Minus All, Gross Margin, Net Profit Target
- **ROI Methods**: Simple, Annualized, Cash-on-Cash, IRR Simplified
- **Contingency Options**: Flat %, Category-Weighted (by risk), Budget-Tiered
- **Holding Costs**: Flat Monthly, Itemized Breakdown, Loan-Based, Hybrid
- **Profit Thresholds**: Configure min/target/excellent profit targets
- **Variance Alerts**: Warning and critical thresholds for budget tracking
- **Live Preview**: Real-time calculation preview with sample deal data

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
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   │   └── page.tsx   # New project form
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Project detail page
│   │   └── settings/
│   │       └── calculations/
│   │           └── page.tsx   # Calculation settings page
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
│   │   ├── settings/          # Settings components
│   │   │   ├── mao-settings-section.tsx
│   │   │   ├── roi-settings-section.tsx
│   │   │   ├── contingency-settings-section.tsx
│   │   │   ├── holding-cost-settings-section.tsx
│   │   │   ├── selling-cost-settings-section.tsx
│   │   │   ├── profit-settings-section.tsx
│   │   │   ├── variance-settings-section.tsx
│   │   │   └── formula-preview.tsx
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
│   │   ├── utils.ts           # Helpers, formatters, configurable calculations
│   │   ├── timeline-utils.ts  # Timeline data transforms (planned)
│   │   └── kanban-utils.ts    # Kanban helpers (planned)
│   └── types/
│       └── index.ts           # TypeScript types + calculation settings types
├── docs/
│   └── DASHBOARD_PLAN.md      # Dashboard wireframes & specs
└── supabase/
    ├── schema.sql             # Database schema
    ├── migrations/            # Schema migrations
    │   ├── 20260106040000_add_three_column_budget_model.sql
    │   └── 20260107000000_add_calculation_settings.sql
    └── seed.sql               # Cost reference data
```

## Database Schema

### Tables

1. **projects** - Property/deal information
2. **budget_items** - Line items with qty, rate, actual (three-column model)
3. **vendors** - Master vendor directory
4. **draws** - Payment schedule/tracking
5. **cost_reference** - Pricing lookup table
6. **calculation_settings** - User-configurable calculation algorithms

### Views

- `project_summary` - Projects with calculated totals
- `budget_by_category` - Aggregated by category
- `vendor_payment_summary` - Vendor totals

## Roadmap

### Phase 1: Core Features (Complete)
- [x] Project creation with Google Places autocomplete
- [x] Three-column budget model (Underwriting → Forecast → Actual)
- [x] Budget category templates with auto-seeding
- [x] Add/delete budget items
- [x] Calculation settings page with customizable algorithms
- [ ] Photo attachments for line items
- [ ] Add/edit vendors

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
