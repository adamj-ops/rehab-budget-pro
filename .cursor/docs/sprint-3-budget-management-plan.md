# Sprint 3: Budget Management Implementation Plan

## Overview

Sprint 3 focuses on enhancing the budget management user experience with advanced features that enable users to fully manage their project budgets. This sprint builds upon the three-column budget model (Underwriting, Forecast, Actual) implemented in Sprint 1-2.

**Sprint Duration:** 2-3 weeks  
**Target Completion:** Enhanced UX for budget management workflow

## Goals

1. Enable dynamic budget structure management (add/delete/reorder items)
2. Implement photo/document management for line items
3. Enhance deal summary with three-column budget insights
4. Improve overall budget management workflow efficiency

---

## Epic 1: Drag & Drop Reordering

### Overview
Allow users to reorder budget categories and line items within categories using drag-and-drop functionality.

### Technical Details
- **Library:** `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (already installed)
- **Database Field:** `sort_order` (already exists in schema)
- **Component:** `src/components/project/tabs/budget-detail-tab.tsx`

### Tasks

#### Task 1.1: Category Reordering
- [ ] Implement `@dnd-kit` SortableContext for categories
- [ ] Create draggable category headers with drag handles
- [ ] Update `sort_order` in `budget_category_templates` table on drop
- [ ] Persist order changes via Supabase mutation
- [ ] Add optimistic updates with React Query
- [ ] Handle edge cases (empty categories, single category)

**Acceptance Criteria:**
- Categories can be reordered by dragging
- Order persists after page refresh
- Visual feedback during drag operation
- Order updates immediately (optimistic UI)

**Estimated Effort:** 4-6 hours

#### Task 1.2: Line Item Reordering Within Categories
- [ ] Implement SortableContext for line items within each category
- [ ] Create draggable row component with drag handle
- [ ] Update `sort_order` in `budget_items` table on drop
- [ ] Persist order changes via Supabase mutation
- [ ] Maintain category grouping during reorder
- [ ] Handle edge cases (single item, empty categories)

**Acceptance Criteria:**
- Line items can be reordered within their category
- Order persists after page refresh
- Items cannot be dragged between categories (future enhancement)
- Visual feedback during drag operation

**Estimated Effort:** 6-8 hours

#### Task 1.3: Visual Polish & Accessibility
- [ ] Add drag handle icons (grip icon from Tabler)
- [ ] Implement hover states for draggable items
- [ ] Add keyboard navigation support
- [ ] Ensure ARIA labels for screen readers
- [ ] Add loading states during save operations

**Estimated Effort:** 2-3 hours

**Total Epic 1 Effort:** 12-17 hours

---

## Epic 2: Add/Delete Line Items

### Overview
Enable users to dynamically add new line items to categories and delete existing items with proper confirmation.

### Technical Details
- **Component:** `src/components/project/tabs/budget-detail-tab.tsx`
- **Database:** `budget_items` table
- **UI Pattern:** Inline add form or modal dialog

### Tasks

#### Task 2.1: Add Line Item Functionality
- [ ] Add "Add Item" button to each category header
- [ ] Create inline add form (or modal) with fields:
  - Item name (required)
  - Quantity (default: 1)
  - Unit (dropdown: ea, sqft, lf, etc.)
  - Underwriting amount (optional)
  - Forecast amount (optional)
  - Cost type (both/acquisition/rehab)
  - Priority (low/medium/high)
- [ ] Validate required fields before submission
- [ ] Calculate `sort_order` (append to end of category)
- [ ] Insert new item via Supabase mutation
- [ ] Add optimistic update with React Query
- [ ] Auto-expand category when adding item

**Acceptance Criteria:**
- "Add Item" button visible on each category
- Form validates required fields
- New item appears immediately after creation
- Item is saved to database
- Form clears after successful submission

**Estimated Effort:** 6-8 hours

#### Task 2.2: Delete Line Item Functionality
- [ ] Add delete button/icon to each line item row
- [ ] Implement confirmation dialog before deletion
- [ ] Delete item via Supabase mutation
- [ ] Add optimistic update (remove from UI immediately)
- [ ] Handle error cases (network errors, permission issues)
- [ ] Show toast notification on success/error

**Acceptance Criteria:**
- Delete button visible on each line item
- Confirmation dialog prevents accidental deletion
- Item removed from UI immediately
- Item deleted from database
- Error handling with user-friendly messages

**Estimated Effort:** 4-5 hours

#### Task 2.3: Edit Line Item Details
- [ ] Enhance existing inline edit to support all fields
- [ ] Allow editing item name, quantity, unit
- [ ] Update cost type and priority fields
- [ ] Validate changes before saving
- [ ] Show unsaved changes indicator

**Acceptance Criteria:**
- All line item fields are editable
- Changes save to database
- Validation prevents invalid data
- Visual feedback for unsaved changes

**Estimated Effort:** 3-4 hours

**Total Epic 2 Effort:** 13-17 hours

---

## Epic 3: Photo Upload & Management

### Overview
Enable users to upload and manage photos/documents for line items (receipts, progress photos, before/after shots).

### Technical Details
- **Storage:** Supabase Storage (`project-photos` bucket)
- **Database:** `line_item_photos` table (already created)
- **Library:** `react-dropzone` (already installed)
- **Component:** New component `src/components/project/line-item-photos.tsx`

### Tasks

#### Task 3.1: Photo Upload UI
- [ ] Create photo upload button component per line item
- [ ] Integrate `react-dropzone` for drag-and-drop upload
- [ ] Add photo type selector (receipt, progress, before, after, other)
- [ ] Implement file validation (size: 10MB max, types: jpg/png/webp/pdf)
- [ ] Show upload progress indicator
- [ ] Display upload errors clearly

**Acceptance Criteria:**
- Upload button visible on each line item
- Drag-and-drop works for file uploads
- File type and size validation
- Progress indicator during upload
- Error messages for invalid files

**Estimated Effort:** 6-8 hours

#### Task 3.2: Supabase Storage Integration
- [ ] Implement file upload to Supabase Storage
- [ ] Generate unique file paths: `project-photos/{project_id}/{line_item_id}/{uuid}.{ext}`
- [ ] Create metadata record in `line_item_photos` table
- [ ] Handle RLS policies for secure access
- [ ] Implement file deletion from storage
- [ ] Add error handling for storage operations

**Acceptance Criteria:**
- Files upload successfully to Supabase Storage
- Metadata saved to database
- Files are accessible via secure URLs
- Deletion removes both file and metadata

**Estimated Effort:** 6-8 hours

#### Task 3.3: Photo Gallery Modal
- [ ] Create photo gallery modal component
- [ ] Display thumbnails of all photos for a line item
- [ ] Show photo type badges (receipt, progress, etc.)
- [ ] Implement lightbox for full-size viewing
- [ ] Add delete functionality from gallery
- [ ] Group photos by type in gallery view

**Acceptance Criteria:**
- Gallery opens when clicking photo count/icon
- All photos for line item displayed
- Full-size viewing works
- Photos can be deleted from gallery
- Photos grouped by type

**Estimated Effort:** 8-10 hours

#### Task 3.4: Photo Display in Budget Table
- [ ] Add photo count indicator to line item rows
- [ ] Show photo type icons (receipt icon, camera icon, etc.)
- [ ] Click to open gallery modal
- [ ] Display thumbnail in tooltip on hover
- [ ] Add "Add Photo" quick action button

**Acceptance Criteria:**
- Photo count visible on each line item
- Click opens gallery modal
- Thumbnail preview on hover
- Quick upload action available

**Estimated Effort:** 4-5 hours

**Total Epic 3 Effort:** 24-31 hours

---

## Epic 4: Deal Summary Tab Enhancement

### Overview
Update the Deal Summary tab to fully leverage the three-column budget model with comprehensive financial insights.

### Technical Details
- **Component:** `src/components/project/tabs/deal-summary-tab.tsx`
- **Data Source:** `project_summary` view (already includes three-column totals)
- **Calculations:** Profit, ROI, MAO based on three budget phases

### Tasks

#### Task 4.1: Three-Column Budget Summary
- [ ] Display three budget totals (Underwriting, Forecast, Actual)
- [ ] Show variance calculations for each phase
- [ ] Add visual indicators (color-coded) for over/under budget
- [ ] Display percentage variance for each column
- [ ] Create summary cards for each budget phase

**Acceptance Criteria:**
- All three budget totals displayed
- Variances calculated and shown
- Color coding for positive/negative variances
- Percentage calculations accurate

**Estimated Effort:** 4-5 hours

#### Task 4.2: Profit & ROI Calculations
- [ ] Calculate profit for each budget phase:
  - Underwriting Profit = ARV - (Purchase + Underwriting Total + Closing + Holding + Selling Costs)
  - Forecast Profit = ARV - (Purchase + Forecast Total + Closing + Holding + Selling Costs)
  - Actual Profit = ARV - (Purchase + Actual Total + Closing + Holding + Selling Costs)
- [ ] Calculate ROI for each phase
- [ ] Display profit comparison (Underwriting vs Forecast vs Actual)
- [ ] Show profit variance (how profit changed between phases)

**Acceptance Criteria:**
- Profit calculated for all three phases
- ROI calculated correctly
- Comparison view shows profit evolution
- All calculations match expected formulas

**Estimated Effort:** 5-6 hours

#### Task 4.3: MAO (Maximum Allowable Offer) Calculation
- [ ] Calculate MAO using underwriting budget:
  - MAO = ARV - (Underwriting Total + Closing + Holding + Selling Costs + Desired Profit)
- [ ] Allow user to set desired profit margin
- [ ] Display MAO prominently
- [ ] Compare MAO to actual purchase price
- [ ] Show if deal meets MAO criteria

**Acceptance Criteria:**
- MAO calculated using underwriting budget
- User can adjust desired profit margin
- MAO displayed clearly
- Comparison to purchase price shown

**Estimated Effort:** 4-5 hours

#### Task 4.4: Budget Phase Comparison Chart
- [ ] Create visual chart/graph comparing three budget phases
- [ ] Show category-level breakdown
- [ ] Highlight categories with largest variances
- [ ] Add tooltips with detailed numbers
- [ ] Make chart interactive (hover for details)

**Acceptance Criteria:**
- Visual comparison of three phases
- Category breakdown visible
- Largest variances highlighted
- Interactive tooltips work

**Estimated Effort:** 6-8 hours

**Total Epic 4 Effort:** 19-24 hours

---

## Testing Strategy

### Unit Tests
- [ ] Test drag-and-drop reordering logic
- [ ] Test add/delete line item mutations
- [ ] Test photo upload file validation
- [ ] Test profit/ROI/MAO calculations
- [ ] Test variance calculations

### Integration Tests
- [ ] Test complete reorder flow (UI → API → Database)
- [ ] Test add item flow with validation
- [ ] Test photo upload to storage and database
- [ ] Test deal summary data loading

### E2E Tests
- [ ] Test user can reorder categories and items
- [ ] Test user can add and delete line items
- [ ] Test user can upload and view photos
- [ ] Test deal summary displays correct calculations

---

## Dependencies & Prerequisites

### Already Available
- ✅ `@dnd-kit` packages installed
- ✅ `react-dropzone` installed
- ✅ `line_item_photos` table created
- ✅ `project-photos` storage bucket (needs RLS setup)
- ✅ `sort_order` fields in database
- ✅ Three-column budget model implemented

### Required Setup
- [ ] Verify Supabase Storage bucket RLS policies
- [ ] Test storage bucket access permissions
- [ ] Ensure `project-photos` bucket exists and is configured

---

## Risk Assessment

### High Risk
- **Photo upload performance:** Large files may cause slow uploads
  - *Mitigation:* Implement file compression, show progress, limit file size
- **Drag-and-drop complexity:** May have edge cases with many items
  - *Mitigation:* Test with large datasets, implement virtualization if needed

### Medium Risk
- **Storage costs:** Photo storage may incur costs
  - *Mitigation:* Set storage limits, implement cleanup policies
- **Calculation accuracy:** Complex profit/ROI calculations need thorough testing
  - *Mitigation:* Create comprehensive test cases, peer review formulas

---

## Success Metrics

1. **User Engagement:**
   - Users can successfully reorder 90%+ of items without errors
   - Photo upload success rate > 95%
   - Add/delete operations complete in < 2 seconds

2. **Feature Adoption:**
   - 80%+ of projects have at least one photo uploaded
   - Average of 2+ custom line items added per project

3. **Performance:**
   - Page load time remains < 2 seconds
   - Photo gallery opens in < 1 second
   - Drag-and-drop feels responsive (< 100ms feedback)

---

## Timeline Estimate

| Epic | Estimated Hours | Priority |
|------|----------------|----------|
| Epic 1: Drag & Drop | 12-17 hours | High |
| Epic 2: Add/Delete Items | 13-17 hours | High |
| Epic 3: Photo Upload | 24-31 hours | High |
| Epic 4: Deal Summary | 19-24 hours | High |
| **Total** | **68-89 hours** | |

**Sprint Duration:** 2-3 weeks (assuming 30-40 hours/week development time)

---

## Post-Sprint Considerations

### Future Enhancements (Sprint 4+)
- Bulk edit operations (edit multiple items at once)
- Budget templates (save and reuse category structures)
- Budget version history (track changes over time)
- Export to Excel/PDF functionality
- Vendor linking to line items
- Draw management integration

### Technical Debt
- Consider implementing virtual scrolling for large budget lists
- Optimize photo loading (lazy load, thumbnails)
- Add undo/redo for budget changes
- Implement optimistic updates for all mutations

---

## Notes

- All database schema changes are already in place from previous sprints
- Focus should be on UI/UX enhancements and integration
- Maintain consistency with existing design system (shadcn/ui, Tailwind)
- Ensure mobile responsiveness for all new features
- Follow existing code patterns (React Query, Zustand, TypeScript)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-06  
**Author:** Development Team

