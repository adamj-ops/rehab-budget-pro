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

---

## ✅ Completed (Sprint 1 - Budget CRUD Completion)

### Full Budget Item CRUD System
- ✅ **Add Line Item** (`src/components/project/budget-item-form-sheet.tsx`)
  - "Add" button per category in budget table header
  - Full form with all budget item fields
  - Auto-calculate amount from qty × rate
  - Vendor assignment during creation
  - Cost type, priority, and status selection

- ✅ **Delete Line Item**
  - Trash icon on each line item row
  - Confirmation dialog before deletion
  - Uses reusable ConfirmDialog component

- ✅ **Bulk Operations**
  - "Select Items" mode toggle button
  - Checkboxes on each row
  - Category header checkboxes (select/deselect all in category)
  - Select all / Clear selection buttons
  - Visual highlight on selected rows

- ✅ **Bulk Status Update**
  - Dropdown to set status on all selected items
  - Options: Not Started, In Progress, Complete, On Hold, Cancelled

- ✅ **Bulk Delete**
  - Delete button for selected items
  - Confirmation dialog with count

### Budget Item Mutations Hook
- ✅ **`src/hooks/use-budget-item-mutations.ts`**
  - `createItem` - Add new budget item with auto sort_order
  - `deleteItem` - Delete single item
  - `bulkUpdateStatus` - Update status on multiple items
  - `bulkDelete` - Delete multiple items

---

## ✅ Completed (Phase 4 - Photo Upload)

### Photo Upload System
- ✅ **Photo Upload Sheet** (`src/components/project/photo-upload-sheet.tsx`)
  - Drag & drop zone for file upload
  - File picker alternative
  - Photo type selection (receipt, progress, before, after, other)
  - Caption input
  - File validation (JPG, PNG, WebP, PDF up to 10MB)
  - Auto-detect photo type from filename

- ✅ **Photo Mutations Hook** (`src/hooks/use-photo-mutations.ts`)
  - `uploadPhoto` - Upload to Supabase Storage + create DB record
  - `deletePhoto` - Remove from storage + delete DB record
  - `getPhotoUrl` - Generate signed URLs for secure viewing
  - `useLineItemPhotos` - Fetch photos for a line item
  - `useProjectPhotos` - Fetch all photos for a project

- ✅ **Photo Gallery**
  - Grid display in upload sheet
  - Photo thumbnails with type badges
  - Delete button on hover
  - PDF file support with icon display

- ✅ **Budget Line Item Integration**
  - Camera icon button on each line item
  - Photo count badge when photos exist
  - Highlighted icon when item has photos

---

## ✅ Completed (Phase 3 - Draw Management)

### Full Draw CRUD System
- ✅ **Draw Form Sheet** (`src/components/project/draw-form-sheet.tsx`)
  - Add and edit draws with all fields
  - Amount, vendor, milestone, percent complete, description
  - Status, dates, payment method, reference number, notes
  - Auto-increment draw numbers

- ✅ **Draw Mutations Hook** (`src/hooks/use-draw-mutations.ts`)
  - `createDraw` - Add new draw with auto-numbering
  - `updateDraw` - Update draw details
  - `updateStatus` - Quick status changes with auto date_paid
  - `deleteDraw` - Delete with confirmation

- ✅ **Status Transitions**
  - Clickable status badges with dropdown menu
  - Quick change: Pending → Approved → Paid
  - Auto-sets date_paid when marking as paid

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

## 📋 Migrations Applied

5. ~~**Vendor Management**~~ ✅ COMPLETED
   - ~~Create/edit/delete vendors~~
   - ~~Link vendors to line items~~
   - Track vendor performance
   - Payment history

6. ~~**Draw Management**~~ ✅ COMPLETED
   - ~~Create draw requests~~
   - ~~Track submission → approval → funded~~
   - ~~Public vendor submission form~~

---

## 🎯 What Works Now

### Project Management
1. **Create a new project** → Click "New Project"
   - Enter street address (becomes project name)
   - Auto-fills city, state, ZIP from Google Places
   - Creates project with 18 pre-seeded budget categories

2. **View project budget** → Click on a project → Budget Detail tab
   - See all categories and line items in three-column view
   - Click edit icon to update underwriting, forecast, or actual amounts
   - Assign vendors to line items via dropdown

3. **Add line items** → Click "Add" button on any category row
   - Full form with item name, description, qty, rate
   - Auto-calculates underwriting amount from qty × rate
   - Assign vendor during creation
   - Set cost type, priority, and initial status

4. **Delete line items** → Click trash icon on any item
   - Confirmation dialog before deletion
   - Instant UI update after delete

5. **Bulk operations** → Click "Select Items" button
   - Select individual items or entire categories
   - Bulk update status (Not Started → In Progress → Complete, etc.)
   - Bulk delete with confirmation

### Vendor Management
6. **Manage vendors** → Vendors tab
   - Add new vendors with full details form
   - View vendor details in slide-out sheet
   - Quick edit phone/email inline
   - Search and filter by trade
   - Sort by name, rating, recent, or most used

4. **Organize with tags**
   - Create custom colored tags
   - Assign tags to vendors
   - View tags on vendor cards

5. **Track contact history**
   - Log calls, emails, meetings, site visits
   - Set follow-up reminders
   - View timeline in vendor detail

6. **Bulk operations**
   - Enable selection mode
   - Select multiple vendors
   - Bulk delete or export

7. **Import/Export**
   - Export all vendors to CSV
   - Import vendors from CSV

### Draw Management
8. **Create draws** → Click "Add Draw" in Draws tab
   - Set amount, vendor, milestone, percent complete
   - Select payment method and add reference number
   - Auto-assigns next draw number

9. **Manage draw status** → Click status badge
   - Quick change: Pending → Approved → Paid
   - Auto-sets paid date when marking as paid

10. **Edit/Delete draws** → Action buttons on each row
    - Edit opens form sheet with all fields
    - Delete with confirmation dialog

### Photo Management
11. **Upload photos** → Click camera icon on any budget line item
    - Drag & drop or click to browse
    - Select photo type: Receipt, Progress, Before, After, Other
    - Add optional caption

12. **View photos** → Opens sheet showing all uploaded photos
    - Grid gallery with thumbnails
    - Type badges (color-coded)
    - Delete with confirmation

13. **Photo count badge** → Shows on camera icon
    - Number badge when photos exist
    - Highlighted icon color

---

## 🚧 Next Steps (Remaining Features)

### High Priority
1. **Drag & Drop Reordering** - Reorder categories and line items
2. **PDF Exports** - Underwriting summary and investor packets

### Medium Priority
3. **Authentication** - User login and protected routes

### Low Priority
4. **Budget Templates** - Save and reuse budget structures
5. **Real-time Updates** - Supabase subscriptions for live sync

---

## 📁 Key Files - Photo Upload

### Hooks
- `src/hooks/use-photo-mutations.ts` - Upload, delete, fetch, signed URLs

### Components
- `src/components/project/photo-upload-sheet.tsx` - Upload sheet with drag & drop
- `src/components/project/tabs/budget-detail-tab.tsx` - Photo button integration

---

## 📁 Key Files - Draw Management

### Hooks
- `src/hooks/use-draw-mutations.ts` - Create, update, delete, status transitions

### Components
- `src/components/project/tabs/draws-tab.tsx` - Main draws tab with full CRUD
- `src/components/project/draw-form-sheet.tsx` - Add/edit draw form

---

## 📁 Key Files - Budget CRUD

### Hooks
- `src/hooks/use-budget-item-mutations.ts` - Create, delete, bulk operations

### Components
- `src/components/project/tabs/budget-detail-tab.tsx` - Main budget table with full CRUD
- `src/components/project/budget-item-form-sheet.tsx` - Add item form sheet
- `src/components/ui/confirm-dialog.tsx` - Reusable confirmation dialog

---

## 📁 Key Files - Vendor Management

### Hooks
- `src/hooks/use-vendor-mutations.ts` - CRUD with optimistic updates
- `src/hooks/use-vendor-tags.ts` - Tag management
- `src/hooks/use-vendor-contacts.ts` - Contact history

### Components
- `src/components/project/tabs/vendors-tab.tsx` - Main vendors tab
- `src/components/project/vendor-form-sheet.tsx` - Add/Edit form
- `src/components/project/vendor-detail-sheet.tsx` - Detail view
- `src/components/project/vendor-tag-selector.tsx` - Tag popover
- `src/components/project/vendor-contact-history.tsx` - Contact timeline
- `src/components/ui/tag-badge.tsx` - Tag display
- `src/components/ui/star-rating.tsx` - Rating input with clear

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

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

---

## 🐛 Known Issues / Tech Debt

1. **Authentication not implemented** - `user_id` is currently null in all inserts
2. **No RLS enforcement yet** - Need to implement auth first
3. **No real-time updates** - Changes require manual refresh
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
