# Rehab Budget Pro

Simple, focused budget tracking for fix & flip real estate projects.

## Features

- **Deal Summary**: Property info, ARV, purchase price, profit/ROI calculations, MAO
- **Budget Detail**: 18 categories, 180+ line items with Qty × Rate formulas
- **Vendors**: Master vendor directory with trade, ratings, contact info
- **Draws**: Payment tracking with milestones and progress visualization
- **Cost Reference**: Minneapolis metro pricing guide for estimates

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui (Mira theme)
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand + React Query
- **Icons**: Tabler Icons

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
│   │   ├── page.tsx           # Home (projects list)
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Tailwind + custom styles
│   │   └── projects/
│   │       └── [id]/
│   │           └── page.tsx   # Project detail page
│   ├── components/
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
│   │   └── utils.ts           # Helpers, formatters
│   └── types/
│       └── index.ts           # TypeScript types
└── supabase/
    ├── schema.sql             # Database schema
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

- [ ] Add/edit budget items inline
- [ ] Add/edit vendors
- [ ] Create/update draws
- [ ] Photo attachments
- [ ] Project creation form
- [ ] User authentication
- [ ] Export to Excel/PDF
- [ ] Multi-project dashboard

## License

MIT
