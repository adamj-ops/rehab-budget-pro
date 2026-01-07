# Rehab Budget Pro - Development Plan

## Current State Assessment

Based on codebase analysis (January 2026), the project has completed Phase 1 (Core Foundation) and Phase 2 (Vendor Management).

### Completed Features (Phase 1 - Core Foundation)
- Three-column budget model (underwriting/forecast/actual)
- Project creation with Google Places autocomplete
- Budget display with inline editing framework
- Deal Summary tab (fully functional)
- Cost Reference tab (fully functional)
- 18 pre-seeded budget categories on project creation
- Database schema with RLS policies
- Data table components (built, awaiting integration)
- Rich text editor (built, awaiting integration)

### Completed Features (Phase 2 - Vendor Management)
- ✅ Full Vendor CRUD (add, edit, delete with optimistic updates)
- ✅ Vendor assignment to budget items
- ✅ Vendor detail sheet with all information
- ✅ Sort options (5 modes: name, rating, recent, most used)
- ✅ Clear rating button
- ✅ Inline quick edit for phone/email
- ✅ Duplicate vendor detection
- ✅ Vendor tags/categories with colors
- ✅ Contact history timeline with follow-up reminders
- ✅ Bulk selection and delete
- ✅ CSV import/export

### Completed Features (Phase 3 - Draw Management)
- ✅ Full Draw CRUD (add, edit, delete)
- ✅ Status transitions (Pending → Approved → Paid)
- ✅ Quick status change via dropdown menu
- ✅ Auto-set date_paid when marking as paid
- ✅ Auto-increment draw numbers
- ✅ Vendor and milestone assignment

### Completed Features (Phase 4 - Photo Upload)
- ✅ Photo upload per line item (drag & drop or file picker)
- ✅ Photo type classification (receipt, progress, before, after, other)
- ✅ Photo gallery view in slide-out sheet
- ✅ Photo count badge on line items
- ✅ Delete photos with confirmation
- ✅ Signed URL generation for secure viewing

### Not Started
- Authentication
- PDF exports
- Drag & drop reordering

---

## Phase 2: Complete CRUD Operations

**Goal:** Make all tabs fully interactive with add/edit/delete capabilities.

### 2.1 Budget Item Management ✅ COMPLETED

**Status:** Fully implemented with all planned features plus additional enhancements.

**Completed Tasks:**
1. ✅ **Add "New Line Item" button per category**
   - "Add" button in each category header row
   - Slide-out sheet form with all budget item fields
   - Auto-calculate: `budget = qty × rate` or manual amount entry
   - Vendor assignment during creation
   - Cost type, priority, and status selection

2. ✅ **Delete functionality**
   - Trash icon on each line item
   - Confirmation dialog before deletion
   - React Query mutation with cache invalidation

3. ✅ **Bulk operations**
   - "Select Items" mode toggle
   - Checkboxes on each row and category headers
   - Select all / deselect all buttons
   - Select/deselect entire categories
   - Bulk status update dropdown
   - Bulk delete with confirmation

**Files created:**
- `src/hooks/use-budget-item-mutations.ts` - Create, delete, bulk operations
- `src/components/project/budget-item-form-sheet.tsx` - Add item form
- `src/components/ui/confirm-dialog.tsx` - Reusable confirmation dialog

**Files modified:**
- `src/components/project/tabs/budget-detail-tab.tsx` - Full CRUD UI

### 2.2 Vendor Management ✅ COMPLETED

**Status:** Fully implemented with all planned features plus additional enhancements.

**Completed Tasks:**
1. ✅ **Add Vendor form** - `vendor-form-sheet.tsx` with 14 fields
2. ✅ **Edit Vendor functionality** - Slide-out sheet with all fields editable
3. ✅ **Delete Vendor** - With dependency check and confirmation
4. ✅ **Link Vendors to Budget Items** - Dropdown in budget table

**Additional Features Implemented:**
- ✅ Vendor detail sheet (read-only view)
- ✅ Inline quick edit for phone/email
- ✅ Sort options (5 modes)
- ✅ Clear rating button
- ✅ Duplicate detection
- ✅ Vendor tags/categories
- ✅ Contact history with follow-ups
- ✅ Bulk operations (select, delete, export)
- ✅ CSV import/export

**Files created:**
- `src/components/project/vendor-form-sheet.tsx`
- `src/components/project/vendor-detail-sheet.tsx`
- `src/components/project/vendor-tag-selector.tsx`
- `src/components/project/vendor-contact-history.tsx`
- `src/components/ui/tag-badge.tsx`
- `src/hooks/use-vendor-mutations.ts`
- `src/hooks/use-vendor-tags.ts`
- `src/hooks/use-vendor-contacts.ts`
- `supabase/migrations/003_vendor_tags_and_contacts.sql`

### 2.3 Draw Management ✅ COMPLETED

**Status:** Fully implemented with all planned features.

**Completed Tasks:**
1. ✅ **Create Draw form** (`draw-form-sheet.tsx`)
   - All fields: amount, vendor, milestone, percent complete, description
   - Status, dates (requested/paid), payment method, reference number, notes
   - Auto-increment draw numbers

2. ✅ **Draw status workflow**
   - Status dropdown with quick transitions: Pending → Approved → Paid
   - Auto-sets date_paid when marking as paid
   - Status badge with dropdown menu for one-click changes

3. ✅ **Full CRUD operations**
   - Create new draws with form sheet
   - Edit existing draws
   - Delete draws with confirmation dialog

4. ✅ **Vendor & milestone linking**
   - Assign vendors to draws
   - Link to 6 milestone types

**Files created:**
- `src/hooks/use-draw-mutations.ts` - CRUD with auto draw numbering
- `src/components/project/draw-form-sheet.tsx` - Add/edit form

**Files modified:**
- `src/components/project/tabs/draws-tab.tsx` - Full CRUD UI with status dropdown

---

## Phase 3: Enhanced UX Features

### 3.1 Photo Upload & Management ✅ COMPLETED

**Status:** Fully implemented with all planned features.

**Completed Tasks:**
1. ✅ **Photo upload per line item**
   - Camera icon button on each budget line item
   - Drag-and-drop zone in slide-out sheet
   - Upload to Supabase Storage: `project-photos/{project_id}/{line_item_id}/{uuid}.{ext}`
   - File validation (JPG, PNG, WebP, PDF up to 10MB)

2. ✅ **Photo type selection**
   - Categories: receipt, progress, before, after, other
   - Auto-detect type from filename (receipt, before, after)
   - Color-coded type badges on photos

3. ✅ **Photo gallery view**
   - Grid display of all photos for a line item
   - Signed URLs for secure viewing
   - Delete with confirmation dialog

4. ✅ **Photo count badge**
   - Shows count on camera icon when photos exist
   - Highlights camera icon when item has photos

**Files created:**
- `src/hooks/use-photo-mutations.ts` - Upload, delete, fetch with React Query
- `src/components/project/photo-upload-sheet.tsx` - Upload UI with drag & drop

**Files modified:**
- `src/components/project/tabs/budget-detail-tab.tsx` - Added photo button and count

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

### Sprint 1 (Budget CRUD Completion) ✅ COMPLETED
- [x] Add line item button and form per category
- [x] Delete line item with confirmation dialog
- [x] Bulk selection and operations (select all, select by category)
- [x] Bulk status update (change multiple items to any status)
- [x] Bulk delete with confirmation

### Sprint 2 (Vendor Management) ✅ COMPLETED
- [x] Add vendor dialog
- [x] Edit vendor sheet
- [x] Delete vendor with dependency check
- [x] Link vendors to budget items
- [x] Vendor tags/categories
- [x] Contact history
- [x] Bulk operations
- [x] CSV import/export

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

*Last updated: January 7, 2026*
