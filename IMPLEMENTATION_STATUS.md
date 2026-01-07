# Rehab Budget Pro - Implementation Status

## ✅ Completed (Phase 1 - Core Foundation)

### Database Schema Updates
- ✅ **Three-Column Budget Model** implemented in [supabase/migrations/20260106040000_add_three_column_budget_model.sql](supabase/migrations/20260106040000_add_three_column_budget_model.sql)
  - `underwriting_amount`: Pre-deal estimate (used during acquisition analysis)
  - `forecast_amount`: Post-walkthrough/contractor bid estimate
  - `actual_amount`: Real spend during/after construction
  - Computed variance columns: `forecast_variance`, `actual_variance`, `total_variance`

- ✅ **Budget Category Templates** table created
  - Pre-seeded with 18 common rehab categories
  - Each template includes default line items (e.g., Kitchen → Cabinets, Countertops, etc.)
  - Used to auto-populate new projects with budget structure

- ✅ **Line Item Photos** table created
  - Support for receipts, progress photos, before/after shots
  - Path: `project-photos/{project_id}/{line_item_id}/{uuid}.{ext}`
  - Photo types: receipt, progress, before, after, other
  - Linked to both `budget_items` and `projects` for easy querying

- ✅ **Updated Views** for three-column support
  - `project_summary`: Now includes `underwriting_total`, `forecast_total`, `actual_total`
  - `budget_by_category`: Aggregates all three columns + variances per category

### TypeScript Types
- ✅ Updated [src/types/index.ts](src/types/index.ts) to reflect new schema
  - `BudgetItem` interface with three-column fields
  - `LineItemPhoto` and `BudgetCategoryTemplate` interfaces
  - `ProjectSummary` and `BudgetByCategory` views updated
  - New `PhotoType` enum
  - Extended `UnitType` to include: load, ton, set, opening

### Project Creation Flow
- ✅ Built [src/app/projects/new/page.tsx](src/app/projects/new/page.tsx) page
  - **Streamlined form using street address as project name** (no redundancy)
  - **Google Places Autocomplete** for address input with auto-fill (city, state, ZIP)
  - Comprehensive property info and deal financials inputs
  - **Auto-seeds budget categories** from templates on project creation
  - Creates all 18 categories with default line items automatically
  - Defaults: 10% contingency, 8% selling costs, 4-month hold
  - Form validation prevents empty address submission

### Budget Detail Tab (Hero Feature)
- ✅ Completely rebuilt [src/components/project/tabs/budget-detail-tab.tsx](src/components/project/tabs/budget-detail-tab.tsx)
  - **Three-column layout**: Underwriting | Forecast | Actual
  - Variance calculations at item, category, and total levels
  - Inline editing with optimistic updates (React Query)
  - Collapsible categories with item counts
  - Color-coded variances (red = over budget, green = under)
  - Summary cards showing all three budgets + total variance
  - Legend explaining the three-column model
  - **Add/Delete Line Items**: Inline add form per category with delete confirmation dialog

### Deal Summary Tab (Three-Column Model)
- ✅ Updated [src/components/project/tabs/deal-summary-tab.tsx](src/components/project/tabs/deal-summary-tab.tsx)
  - **Rehab Budget Comparison**: Side-by-side Underwriting vs Forecast vs Actual
  - Variance percentages between budget phases (scope creep, execution variance)
  - Contingency breakdown for each budget phase
  - Active scenario highlighting based on data availability
  - **Profit/ROI by Scenario**: Calculations for each budget phase
  - **MAO using Underwriting**: 70% rule calculation uses underwriting + contingency
  - **Spread Analysis**: Shows if purchase price is under/over MAO
  - Updated Quick Stats bar with active scenario metrics

### Storage Setup
- ✅ Documentation for Supabase Storage bucket setup in [supabase/storage-setup.md](supabase/storage-setup.md)
  - Bucket name: `project-photos`
  - RLS policies for secure access
  - File constraints: 10MB max, jpg/png/webp/pdf accepted

## 📋 Migration Applied

Run this to verify:
```bash
supabase db push
```

The migration `20260106040000_add_three_column_budget_model.sql` has been applied, which:
1. Adds three-column budget fields to `budget_items`
2. Creates `line_item_photos` table
3. Creates `budget_category_templates` table with seed data
4. Updates database views for three-column support

## 🎯 What Works Now

1. **Create a new project** → Go to [http://localhost:3000](http://localhost:3000) → Click "New Project"
   - Fill in street address (required - this becomes the project name)
   - Fill in property details and financials
   - On save, project is created with **18 pre-seeded budget categories**

2. **View project budget** → Click on a project → Budget Detail tab
   - See all categories and line items
   - Click edit icon (pencil) on any line item
   - Update underwriting, forecast, or actual amounts
   - Change item status (Not Started → In Progress → Complete)
   - Click checkmark to save, X to cancel

3. **Three-column workflow**:
   - **Underwriting**: Fill in during deal analysis (pre-contract)
   - **Forecast**: Update after walkthrough and getting contractor bids
   - **Actual**: Track real spend as invoices come in

## 🚧 Next Steps (Phase 2 - Enhanced UX)

### High Priority

1. ~~**Drag & Drop Reordering**~~ ✅ COMPLETED
   - ~~Reorder line items within category~~
   - ~~Update `sort_order` field on drop~~
   - ~~Drag handle icon with visual feedback~~

2. ~~**Add/Delete Line Items**~~ ✅ COMPLETED
   - ~~"Add Item" button per category~~
   - ~~Inline add form or modal~~
   - ~~Delete confirmation dialog~~

3. ~~**Photo Upload**~~ ✅ COMPLETED
   - ~~Upload button per line item~~
   - ~~Photo gallery modal~~
   - ~~Photo type selector (receipt/progress/before/after)~~
   - ~~Integration with Supabase Storage~~

4. ~~**Deal Summary Tab** - Update for three-column model~~ ✅ COMPLETED
   - ~~Show underwriting vs forecast vs actual budgets~~
   - ~~Profit calculations based on actual spend~~
   - ~~MAO calculation using underwriting~~

### Medium Priority

5. ~~**Vendor Management**~~ ✅ COMPLETED
   - ~~Create/edit/delete vendors~~
   - ~~Link vendors to line items~~
   - Track vendor performance
   - Payment history

6. ~~**Draw Management**~~ ✅ COMPLETED
   - ~~Create draw requests~~
   - ~~Track submission → approval → funded~~
   - ~~Public vendor submission form~~

7. **Cost Reference Integration**
   - Quick lookup of Minneapolis metro pricing
   - "Apply to budget" button to copy reference costs

### Low Priority (Phase 3)

8. **PDF Exports** (@react-pdf/renderer already installed)
   - Underwriting Summary PDF (for lender/investor)
   - Full Investor Packet PDF (comprehensive report)

9. **Advanced Features**
   - Budget version history
   - Budget templates (save and reuse category structures)
   - Bulk edit operations
   - Export to Excel

---

## 🎯 Phase 4: Multi-Project Dashboard (Planned)

Full specification available in [docs/DASHBOARD_PLAN.md](docs/DASHBOARD_PLAN.md)

### Dashboard Sections

1. **Portfolio Health** (Hero Metrics)
   - Total ARV across active projects
   - Capital deployed (total investment)
   - Portfolio-wide ROI
   - Active project count by status

2. **Attention Needed** (Risk Alerts)
   - Projects over budget
   - Projects behind schedule
   - Low ROI warnings
   - Contingency burn alerts

3. **Project Pipeline** (Kanban Board)
   - Columns: Lead → Analyzing → Under Contract → In Rehab → Listed → Sold
   - Drag-drop to change project status
   - Context-aware card content per stage
   - Search, filter, sort controls

4. **Project Timeline** (Gantt Chart)
   - Visual timeline of all projects
   - Milestone markers (contract, close, rehab, list, sale)
   - Progress bars for active rehabs
   - Dependency lines
   - Zoom controls (0.5x - 2x)

5. **Financial Performance**
   - Gross profit summary
   - ROI distribution chart
   - Profit by project ranking

6. **Budget Insights**
   - Top spending categories
   - Budget vs actual variance
   - Cost benchmarking vs Minneapolis metro

### New Dependencies Required

```bash
npm install framer-motion recharts
```

### New Database Views Required

```sql
-- Portfolio-level aggregates
CREATE VIEW portfolio_summary AS
SELECT
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE status NOT IN ('sold', 'dead')) as active_projects,
  SUM(arv) FILTER (WHERE status NOT IN ('sold', 'dead')) as total_arv,
  SUM(total_investment) FILTER (WHERE status NOT IN ('sold', 'dead')) as capital_deployed,
  SUM(gross_profit) FILTER (WHERE status = 'sold') as total_profit,
  AVG(roi) FILTER (WHERE status = 'sold') as avg_roi
FROM project_summary
WHERE user_id = auth.uid();

-- Category totals across portfolio
CREATE VIEW category_totals AS
SELECT
  category,
  SUM(budget) as total_budget,
  SUM(actual) as total_actual,
  SUM(actual) - SUM(budget) as variance
FROM budget_items bi
JOIN projects p ON bi.project_id = p.id
WHERE p.status NOT IN ('sold', 'dead')
GROUP BY category
ORDER BY total_actual DESC;
```

### UI/UX Enhancements Planned

- Micro-interactions (card hover, number animations)
- Skeleton loading states
- Keyboard shortcuts (N, G, K, /, ?)
- Command palette (Cmd+K)
- Mobile-optimized views (swipeable tabs, bottom nav)
- Accessibility (WCAG AA, reduced motion support)
- Optimistic updates with rollback

### Implementation Phases

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| 4.1 | Core Dashboard | Hero metrics, basic project grid |
| 4.2 | Kanban Pipeline | Drag-drop board, filters, search |
| 4.3 | Gantt Timeline | Timeline view, zoom, dependencies |
| 4.4 | Risk & Alerts | Attention section, thresholds |
| 4.5 | Analytics | Charts, ROI distribution |
| 4.6 | Budget Intelligence | Category analysis, benchmarking |

## 🔧 Development Commands

```bash
# Run dev server
npm run dev

# Apply migrations
supabase db push

# Reset database (CAUTION: deletes all data)
psql $SUPABASE_CONNECTION_STRING < supabase/reset.sql

# Seed cost reference data
psql $SUPABASE_CONNECTION_STRING < supabase/seed.sql
```

## 📁 Key Files Modified/Created

### Documentation
- `docs/DASHBOARD_PLAN.md` (NEW) - Comprehensive dashboard wireframes and UX specs
- `README.md` (UPDATED) - Added dashboard features and phased roadmap

### Database
- `supabase/migrations/20260106040000_add_three_column_budget_model.sql` (NEW)
- `supabase/storage-setup.md` (NEW)

### Types
- `src/types/index.ts` (UPDATED)

### Pages
- `src/app/page.tsx` (REWRITTEN - Dashboard with Portfolio Health + Kanban Pipeline)
- `src/app/dashboard-client.tsx` (NEW - Client component for dashboard interactivity)
- `src/app/projects/new/page.tsx` (NEW - simplified form with Google Places)

### Dashboard Components
- `src/components/dashboard/portfolio-health.tsx` (NEW - Hero metrics cards)
- `src/components/dashboard/kanban-pipeline.tsx` (NEW - Drag-drop Kanban board)
- `src/components/dashboard/project-card.tsx` (NEW - Context-aware project cards)
- `src/components/dashboard/index.ts` (NEW - Component exports)

### Components & Hooks
- `src/components/project/tabs/budget-detail-tab.tsx` (REWRITTEN - with add/delete/photos)
- `src/components/project/tabs/deal-summary-tab.tsx` (REWRITTEN - three-column)
- `src/components/project/photo-gallery.tsx` (NEW - photo upload/gallery modal)
- `src/components/ui/alert-dialog.tsx` (NEW - delete confirmation)
- `src/components/ui/checkbox.tsx` (NEW)
- `src/components/ui/label.tsx` (NEW)
- `src/components/ui/select.tsx` (NEW)
- `src/hooks/use-places-autocomplete.ts` (NEW - Google Places integration)

### Updated for Three-Column Model
- `src/components/project/project-tabs.tsx` (UPDATED - passes budget totals)
- `src/components/project/tabs/vendors-tab.tsx` (UPDATED)
- `src/lib/store.ts` (UPDATED)
- `src/app/page.tsx` (UPDATED)

## 🎨 Three-Column Budget Model Explained

| Column | Usage | Example |
|--------|-------|---------|
| **Underwriting** | Initial deal analysis before going under contract | Kitchen: $15,000 based on rough estimates |
| **Forecast** | Updated after walkthrough and getting contractor bids | Kitchen: $18,500 after getting cabinet quote |
| **Actual** | Real spend as invoices come in | Kitchen: $19,200 after final payment |

**Variances**:
- **Forecast Variance**: $18,500 - $15,000 = +$3,500 (scope creep)
- **Actual Variance**: $19,200 - $18,500 = +$700 (execution variance)
- **Total Variance**: $19,200 - $15,000 = +$4,200 (total overrun from original estimate)

This helps investors understand:
- Did we miss costs during underwriting?
- Did we stick to our post-walkthrough budget?
- How accurate are we at estimating deals?

## 🐛 Known Issues / Tech Debt

1. **Authentication not implemented** - `user_id` is currently null in all inserts
2. **No RLS enforcement yet** - Need to implement auth first
3. **No real-time updates** - Budget changes require manual refresh
4. **Mobile responsive** - Budget table needs horizontal scroll optimization
5. **Error boundaries** - Add error handling for failed mutations

## 📝 Notes

- All dependencies already installed (dnd-kit, react-pdf, react-dropzone, etc.)
- Database schema supports all planned features
- Three-column model is fully functional and ready to use
- Category seeding works automatically on project creation
- Form simplified: Street address is used as project name (no redundant field)

## ✅ Recent Changes

### Phase 2: Dashboard - Kanban Pipeline (Latest - Jan 7, 2026)
- **Portfolio Health Metrics**: 4-card hero section with Total ARV, Capital Deployed, ROI, Active Projects
- **Kanban Board**: 5-column pipeline (Leads → Analyzing → Under Contract → In Rehab → Listed)
- **Drag & Drop**: Move projects between columns to update status (uses @dnd-kit)
- **Context-Aware Cards**: Different card content based on project status:
  - Analyzing: ARV, MAO, Projected ROI
  - Under Contract: ARV, Purchase Price, Close Date, ROI
  - In Rehab: Progress bar, Budget vs Actual, ROI
  - Listed: List Price, Days on Market, Showings, ROI
- **Search**: Filter projects across all columns by name, address, or city
- **ROI Color Coding**: Green (≥20%), Light Green (15-20%), Yellow (10-15%), Red (<10%)
- **New Dependencies**: framer-motion, recharts, @radix-ui/react-progress

### Drag & Drop Reordering (Jan 7, 2026)
- **Drag Handle**: Grip icon (⋮⋮) added to first column of each budget item row
- **@dnd-kit Integration**: Using DndContext, SortableContext, and useSortable hook
- **Visual Feedback**: Items highlight and become semi-transparent while dragging
- **Sort Order Persistence**: Updates `sort_order` field in database on drop
- **Per-Category Sorting**: Items can only be reordered within their category
- **Keyboard Support**: Full accessibility with keyboard navigation

### Photo Upload (Jan 7, 2026)
- **Photo Button**: Camera icon in Actions column for each budget item
- **Photo Gallery Modal**: View, upload, and delete photos per line item
- **Photo Types**: Receipt, Progress, Before, After, Other - selectable when uploading
- **Drag & Drop Upload**: Uses react-dropzone for easy file uploads
- **File Support**: JPEG, PNG, WebP, and PDF (max 10MB)
- **Supabase Storage**: Photos stored in `project-photos` bucket with path `{projectId}/{itemId}/{uuid}.{ext}`
- **Photo Preview**: Full-screen preview with download option
- **Delete Confirmation**: AlertDialog to prevent accidental deletions

### Vendor CRUD (Jan 7, 2026)
- **Create Vendor**: Full form modal with all vendor fields (name, trade, contact info, qualifications)
- **Edit Vendor**: Click pencil icon on any vendor card to edit all fields
- **Delete Vendor**: Trash icon with AlertDialog confirmation, warns if vendor is assigned to items
- **Assign to Items**: "Assign to item" button shows list of unassigned budget items
- **Vendor Form Fields**: Company name, trade (21 options), contact details, licensed/insured/W-9, ratings, reliability, price level, status, notes
- **React Query Mutations**: Full CRUD with cache invalidation

### Draw Management CRUD (Jan 7, 2026)
- **Create Draw**: Form with draw number, milestone, amount, description, percent complete
- **Edit Draw**: Inline editing of all draw fields
- **Delete Draw**: Confirmation dialog before deletion
- **Status Workflow**: Dropdown to change status (pending → approved → paid)
- **Payment Modal**: When marking as paid, capture payment method, reference number, and date
- **Vendor Request Link**: Button to copy public URL for vendors to submit draw requests
- **Public Vendor Form**: `/draw-request/[projectId]` - Vendors can submit requests without login

### Deal Summary Three-Column Update (Jan 7, 2026)
- **Rehab Budget Comparison**: New card showing Underwriting vs Forecast vs Actual side-by-side
- Each budget phase shows base amount + contingency breakdown
- Variance percentages between phases (scope creep, execution variance)
- **Active Scenario Detection**: Highlights most relevant phase based on data availability
- **Profit/ROI by Scenario**: Shows calculations for each budget phase
- **MAO Calculation Fixed**: Now correctly uses underwriting budget + contingency
- **Spread Analysis**: New section showing if purchase price is under/over MAO
- Updated Quick Stats bar to show active scenario metrics

### Budget Item Add/Delete (Jan 7, 2026)
- **Add Item Button**: Each category now has an inline "Add item" button
- **Inline Add Form**: Click to reveal form with name, description, and budget fields
- **Delete Confirmation**: AlertDialog component for safe deletion
- **React Query Mutations**: Optimistic updates for add/delete operations
- New UI components: `alert-dialog.tsx`, `checkbox.tsx`

### Google Places API Integration
- Added Google Places Autocomplete to address input field
- **Removed city, state, and ZIP input fields** - they're auto-filled from address selection
- Auto-filled location shown as green checkmark below address field
- Custom React hook (`use-places-autocomplete`) handles API integration
- Updated `.env` to use `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- Loads Google Maps API directly (no npm dependencies needed)
- Added TypeScript type definitions for Google Maps API
- Added comprehensive documentation in [GOOGLE_PLACES_SETUP.md](GOOGLE_PLACES_SETUP.md)

### Form Simplification
- Removed separate "Project Name" field from new project form
- Street address is now the required field and becomes the project name
- Added validation to prevent empty/whitespace-only addresses
- Updated placeholder and help text to clarify this behavior
- Form submission uses `formData.address.trim()` as the project name
