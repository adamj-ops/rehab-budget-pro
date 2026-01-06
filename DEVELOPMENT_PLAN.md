# Rehab Budget Pro - Development Plan

## Current State Assessment

Based on codebase analysis (January 2026), the project has completed Phase 1 (Core Foundation) and is ready for Phase 2 development.

### Completed Features
- Three-column budget model (underwriting/forecast/actual)
- Project creation with Google Places autocomplete
- Budget display with inline editing framework
- Deal Summary tab (fully functional)
- Cost Reference tab (fully functional)
- 18 pre-seeded budget categories on project creation
- Database schema with RLS policies
- Data table components (built, awaiting integration)
- Rich text editor (built, awaiting integration)

### Partially Implemented
- Budget item editing (edit works, add/delete UI missing)
- Vendors tab (display only)
- Draws tab (display only)

### Not Started
- Authentication
- Photo upload/management
- PDF exports
- Drag & drop reordering

---

## Phase 2: Complete CRUD Operations

**Goal:** Make all tabs fully interactive with add/edit/delete capabilities.

### 2.1 Budget Item Management (High Priority)

**Current State:** Inline editing works for existing items, but no add/delete UI.

**Tasks:**
1. **Add "New Line Item" button per category**
   - Location: `src/components/project/tabs/budget-detail-tab.tsx`
   - Insert inline form or slide-out sheet for new item
   - Fields: name, description, qty, unit_type, rate, underwriting_amount
   - Auto-calculate: `budget = qty × rate` or use manual amount

2. **Add delete functionality**
   - Confirmation dialog before deletion
   - React Query mutation with cache invalidation
   - Update: `useMutation` → `supabase.from('budget_items').delete().eq('id', itemId)`

3. **Bulk operations**
   - Select multiple items via checkbox
   - Bulk delete selected items
   - Bulk status update (Not Started → In Progress → Complete)

**Files to modify:**
- `src/components/project/tabs/budget-detail-tab.tsx`
- `src/lib/store.ts` (ensure mutations are defined)

### 2.2 Vendor Management (High Priority)

**Current State:** Display only with contact info and ratings.

**Tasks:**
1. **Add Vendor form**
   - Create `add-vendor-dialog.tsx` component
   - Fields: name, company, trade (select from VendorTrade enum), phone, email
   - Optional: license_number, insurance_expiry, w9_on_file, notes, hourly_rate

2. **Edit Vendor functionality**
   - Click vendor card → slide-out sheet with editable fields
   - React Query mutation for updates

3. **Delete Vendor**
   - Only allow if no budget items reference this vendor
   - Soft delete or hard delete with confirmation

4. **Link Vendors to Budget Items**
   - Add vendor_id dropdown to budget item edit form
   - Show vendor name in budget line items

**Files to create:**
- `src/components/project/dialogs/add-vendor-dialog.tsx`
- `src/components/project/dialogs/edit-vendor-sheet.tsx`

**Files to modify:**
- `src/components/project/tabs/vendors-tab.tsx`
- `src/components/project/tabs/budget-detail-tab.tsx` (vendor linking)

### 2.3 Draw Management (High Priority)

**Current State:** Display with progress bars, no CRUD operations.

**Tasks:**
1. **Create Draw form**
   - Fields: draw_number, amount, milestone (enum), scheduled_date, notes
   - Status defaults to 'scheduled'

2. **Draw status workflow**
   - Status progression: scheduled → submitted → approved → funded
   - Date tracking for each status change
   - Payment method capture on funding

3. **Link draws to budget items**
   - Select which line items are included in each draw
   - Calculate draw amount from selected items

4. **Draw approval workflow (stretch)**
   - Mark items as "included in draw #X"
   - Track submission → lender review → approval → funding

**Files to create:**
- `src/components/project/dialogs/add-draw-dialog.tsx`
- `src/components/project/dialogs/draw-detail-sheet.tsx`

**Files to modify:**
- `src/components/project/tabs/draws-tab.tsx`

---

## Phase 3: Enhanced UX Features

### 3.1 Photo Upload & Management

**Current State:** Database table exists (`line_item_photos`), Supabase storage configured, no UI.

**Tasks:**
1. **Photo upload per line item**
   - Add camera icon button to budget line items
   - Open modal with drag-and-drop zone (react-dropzone installed)
   - Upload to Supabase Storage: `project-photos/{project_id}/{line_item_id}/{uuid}.{ext}`

2. **Photo type selection**
   - Categories: receipt, progress, before, after, other
   - Display badge/icon for photo type

3. **Photo gallery view**
   - Grid display of all photos for a line item
   - Lightbox for full-size viewing
   - Delete capability

4. **Receipt OCR (stretch)**
   - Extract amount from receipt photos
   - Auto-populate actual_amount field

**Files to create:**
- `src/components/project/photo-upload-modal.tsx`
- `src/components/project/photo-gallery.tsx`
- `src/hooks/use-photo-upload.ts`

**Files to modify:**
- `src/components/project/tabs/budget-detail-tab.tsx` (add photo button)

### 3.2 Project Notes Integration

**Current State:** Rich text editor built (`src/components/editor/`), not integrated.

**Tasks:**
1. **Add notes section to Deal Summary tab**
   - Editable rich text field for project notes
   - Auto-save on blur or debounced input
   - Store in `projects.notes` column

2. **Journal/Activity Log**
   - Timeline of project activity
   - Manual note entries with timestamps
   - Eventually: auto-log status changes

**Files to modify:**
- `src/components/project/tabs/deal-summary-tab.tsx`

### 3.3 Drag & Drop Reordering

**Current State:** @dnd-kit installed, not implemented.

**Tasks:**
1. **Category reordering**
   - Drag handle on category headers
   - Update `sort_order` on drop

2. **Line item reordering within category**
   - Drag handle on line items
   - Constrain to same category
   - Batch update sort_order values

**Dependencies:** @dnd-kit/core, @dnd-kit/sortable (already installed)

**Files to modify:**
- `src/components/project/tabs/budget-detail-tab.tsx`

---

## Phase 4: Reports & Exports

### 4.1 PDF Exports

**Current State:** @react-pdf/renderer installed, not implemented.

**Tasks:**
1. **Underwriting Summary PDF**
   - Property overview
   - Three-column budget summary
   - Category totals
   - Key financial metrics (ARV, MAO, ROI)
   - For: lenders, investors, internal records

2. **Full Project Report PDF**
   - All budget details with actuals
   - Variance analysis
   - Draw history
   - Photos grid
   - For: investors, year-end documentation

3. **Draw Request PDF**
   - Selected line items and amounts
   - Photos/receipts for completed work
   - Vendor invoices (if attached)

**Files to create:**
- `src/components/pdf/underwriting-summary.tsx`
- `src/components/pdf/project-report.tsx`
- `src/components/pdf/draw-request.tsx`
- `src/app/api/pdf/route.ts` (API endpoint for generation)

### 4.2 Excel Export

**Tasks:**
1. **Budget export to Excel**
   - All line items with three columns
   - Category grouping
   - Formulas for totals

**Dependencies:** May need xlsx or similar library

---

## Phase 5: Authentication & Multi-tenancy

### 5.1 User Authentication

**Current State:** `user_id` is null in all inserts, RLS policies defined but not enforced.

**Tasks:**
1. **Implement Supabase Auth**
   - Email/password signup and login
   - Password reset flow
   - Session management

2. **Protect routes**
   - Middleware to check auth state
   - Redirect to login if unauthenticated

3. **Enforce RLS**
   - Pass `user_id` in all inserts
   - RLS policies already defined in schema

**Files to create:**
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/middleware.ts`
- `src/components/auth/auth-form.tsx`

### 5.2 User Settings

**Tasks:**
1. **Profile management**
   - Name, email, company info
   - Default contingency percentage
   - Default assumptions

---

## Technical Debt & Polish

### Must Address
- [ ] Error boundaries for tab components
- [ ] Loading skeletons for async operations
- [ ] Empty state messages (no budget items, no vendors, etc.)
- [ ] Form validation with error messages
- [ ] Mobile responsive testing (especially budget table)

### Should Address
- [ ] Integrate Zustand store with React Query (currently parallel systems)
- [ ] Optimistic updates for all mutations
- [ ] Real-time updates via Supabase subscriptions
- [ ] Keyboard shortcuts (Escape to cancel edit, Enter to save)

### Nice to Have
- [ ] Budget version history (snapshot before major changes)
- [ ] Project templates (save and reuse budget structures)
- [ ] Multi-project dashboard with aggregated metrics
- [ ] Contractor bid comparison tool

---

## Recommended Sprint Plan

### Sprint 1 (Budget CRUD Completion)
- [ ] Add line item button and form
- [ ] Delete line item with confirmation
- [ ] Bulk selection and operations
- [ ] Error handling and loading states

### Sprint 2 (Vendor Management)
- [ ] Add vendor dialog
- [ ] Edit vendor sheet
- [ ] Delete vendor with dependency check
- [ ] Link vendors to budget items

### Sprint 3 (Draw Management)
- [ ] Add draw dialog
- [ ] Draw status workflow
- [ ] Link draws to budget items
- [ ] Progress tracking improvements

### Sprint 4 (Photos & Notes)
- [ ] Photo upload modal
- [ ] Photo gallery component
- [ ] Integrate notes editor
- [ ] Receipt management

### Sprint 5 (Exports & Auth)
- [ ] Underwriting PDF export
- [ ] Basic auth implementation
- [ ] Protected routes

---

## Architecture Notes

### Data Flow Pattern (Maintain This)
```
User Action → React Query Mutation → Supabase → Cache Invalidation → Re-render
```

### Key Principles
1. **Use database views** for calculated data (never compute client-side)
2. **Optimistic updates** for responsive UX
3. **React Query** for server state, **Zustand** for UI state
4. **Type safety** - all DB entities have TypeScript interfaces

### Component Patterns
```tsx
// Standard mutation pattern
const mutation = useMutation({
  mutationFn: async (data) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('table').insert(data);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
    toast.success('Saved successfully');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

---

## Dependencies Status

**Installed & Ready:**
- @dnd-kit/core, @dnd-kit/sortable - Drag and drop
- @react-pdf/renderer - PDF generation
- react-dropzone - File uploads
- @tiptap/* - Rich text editing
- @tanstack/react-table - Data tables

**May Need:**
- xlsx - Excel export
- sharp - Image optimization (for receipts)

---

## Questions for Product Owner

1. **Vendor assignment**: Should vendors be project-specific or global across all projects?
2. **Draw workflow**: Do we need lender approval integration or just internal tracking?
3. **Photo retention**: How long to keep photos? Any storage limits?
4. **Multi-user**: Will multiple users collaborate on the same project?
5. **Offline support**: Is offline capability needed for job site usage?

---

*Last updated: January 2026*
