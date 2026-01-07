# Architecture Overview - Rehab Budget Pro

## System Architecture

### High-Level Stack
```
┌─────────────────────────────────────────┐
│         Next.js 15 (App Router)         │
│         React 19 + TypeScript           │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌─────▼─────┐
│   Supabase  │  │  Google   │
│  (Postgres) │  │  Places   │
│  + Storage  │  │    API    │
└─────────────┘  └───────────┘
```

## Application Layers

### Presentation Layer
- **Next.js Pages**: App Router pages in `src/app/`
- **React Components**: Reusable UI components in `src/components/`
- **shadcn/ui**: Base component library
- **Tailwind CSS**: Utility-first styling

### Business Logic Layer
- **React Hooks**: Custom hooks in `src/hooks/`
- **State Management**: Zustand stores in `lib/store.ts`
- **Data Fetching**: React Query for server state
- **Form Logic**: Component-level form handling

### Data Layer
- **Supabase Client**: Database client in `lib/supabase/`
- **Type Definitions**: TypeScript types in `src/types/`
- **Database Schema**: PostgreSQL with RLS policies
- **Storage**: Supabase Storage for photos

## Data Flow

### Reading Data
```
User Action → React Query Hook → Supabase Client → PostgreSQL
                                      ↓
                              React Query Cache
                                      ↓
                                  UI Update
```

### Writing Data
```
User Action → Form Submit → React Query Mutation → Supabase Client
                                                           ↓
                                                    PostgreSQL
                                                           ↓
                                           Optimistic Update (UI)
                                                           ↓
                                              Server Response
                                                           ↓
                                              Cache Update
```

## Component Architecture

### Page Components
- `app/page.tsx` - Projects list page
- `app/projects/[id]/page.tsx` - Project detail page
- `app/projects/new/page.tsx` - New project form

### Feature Components
- `components/project/` - Project-specific components
  - `project-tabs.tsx` - Tab container
  - `tabs/*.tsx` - Individual tab implementations

### Shared Components
- `components/data-table/` - Reusable data table
- `components/editor/` - Rich text editor
- `components/ui/` - Base UI components (shadcn/ui)
- `components/nav/` - Navigation components

## State Management Strategy

### UI State (Zustand)
- Sidebar open/closed
- Theme preference
- Selected project ID (for context)

### Server State (React Query)
- Projects list
- Project details
- Budget items
- Vendors
- Draws
- Cost references

### Local State (useState)
- Form inputs
- Modal open/closed
- Toggle states
- Temporary UI state

## Database Architecture

### Core Tables
1. **projects** - Project/deal information
2. **budget_items** - Three-column budget line items
3. **budget_category_templates** - Category definitions
4. **line_item_photos** - Photo metadata
5. **vendors** - Vendor directory
6. **draws** - Payment tracking
7. **cost_reference** - Pricing guide data

### Views
- **project_summary** - Aggregated project metrics
- **budget_by_category** - Category-level totals
- **vendor_payment_summary** - Vendor payment aggregations

### Relationships
```
projects (1) ──── (many) budget_items
budget_items (1) ──── (many) line_item_photos
projects (1) ──── (many) draws
vendors (1) ──── (many) budget_items
budget_category_templates ──── (used to seed) projects
```

## Three-Column Budget Model

### Budget Columns
1. **Underwriting**: Pre-deal estimate
2. **Forecast**: Post-walkthrough refined estimate
3. **Actual**: Real spend tracking

### Computed Values
- `forecast_variance = forecast - underwriting`
- `actual_variance = actual - forecast`
- `total_variance = actual - underwriting`

### Usage Flow
```
Deal Analysis → Underwriting Amount
    ↓
Walkthrough + Bids → Forecast Amount
    ↓
Construction → Actual Amount
    ↓
Analysis → Variances
```

## Security Model

### Current State
- Anonymous access allowed
- RLS policies exist but permissive
- No authentication implemented

### Future State
- User authentication (Supabase Auth)
- Row-level security enforced
- User-scoped data access
- Project sharing capabilities

## API Integration

### Google Places API
- **Purpose**: Address autocomplete
- **Usage**: Project creation form
- **Implementation**: Custom hook `use-places-autocomplete.ts`
- **Data Flow**: User types → Google suggests → Selection → Auto-fill

### Supabase API
- **Type**: REST (via Supabase client)
- **Authentication**: Anon key (client), Service key (server)
- **Real-time**: Not yet implemented
- **Storage**: Bucket-based file storage

## Performance Considerations

### Caching Strategy
- React Query: Client-side caching with staleTime
- Supabase: Connection pooling
- Next.js: Static generation where possible

### Optimization Opportunities
- Virtual scrolling for large budget tables
- Pagination for projects list
- Lazy loading for modals and drawers
- Image optimization for photos

## Deployment Architecture

### Development
- Local Next.js dev server
- Supabase local or cloud project
- Environment variables in `.env.local`

### Production (Future)
- Vercel deployment (recommended for Next.js)
- Supabase cloud database
- Environment variables in Vercel dashboard
- CDN for static assets

## Extension Points

### Future Features
- Real-time collaboration (Supabase Realtime)
- Mobile app (React Native or PWA)
- Advanced reporting (analytics integration)
- Third-party integrations (accounting software)

### Plugin Architecture
- Budget calculation plugins
- Export format plugins
- Notification system
- Workflow automation

