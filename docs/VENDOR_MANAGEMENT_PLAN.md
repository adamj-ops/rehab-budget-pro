# Vendor Management Implementation Plan

## Overview

This document outlines the complete implementation plan for vendor management in Rehab Budget Pro. The vendor system is **global** (not project-specific) - vendors exist in a master directory and are linked to budget items within projects.

## Current State

### What Exists
- ✅ Database table `vendors` with RLS policies
- ✅ TypeScript types: `Vendor`, `VendorInput`, `VendorTrade`, `VendorStatus`
- ✅ `VENDOR_TRADE_LABELS` mapping for display
- ✅ `vendor_payment_summary` database view
- ✅ Vendors tab UI (`vendors-tab.tsx`) with read-only card display
- ✅ Budget items have `vendor_id` foreign key
- ✅ UI components: Sheet, Select, Input, Button, Label, Badge

### What's Missing
- ❌ Add vendor form/dialog
- ❌ Edit vendor functionality
- ❌ Delete vendor with dependency check
- ❌ Vendor search/filter in tab
- ❌ Assign vendor to budget items
- ❌ React Query mutations for CRUD

---

## Implementation Tasks

### Task 1: Create Add Vendor Sheet Component

**File:** `src/components/project/vendor-form-sheet.tsx`

**Purpose:** Reusable sheet component for both Add and Edit operations.

**Form Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | text | ✅ | Company or individual name |
| `trade` | select | ✅ | From `VendorTrade` enum (21 options) |
| `contact_name` | text | | Primary contact person |
| `phone` | text | | Phone number |
| `email` | text | | Email address |
| `website` | text | | Company website |
| `address` | text | | Physical address |
| `licensed` | checkbox | | Has contractor license |
| `insured` | checkbox | | Has liability insurance |
| `w9_on_file` | checkbox | | W9 collected for 1099 |
| `rating` | star-select | | 1-5 stars |
| `reliability` | select | | excellent/good/fair/poor |
| `price_level` | select | | $/$$/$$$  |
| `status` | select | | active/inactive/do_not_use |
| `notes` | textarea | | Internal notes |

**Component Structure:**
```tsx
interface VendorFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor; // If provided, edit mode; otherwise add mode
  onSuccess?: () => void;
}

export function VendorFormSheet({ open, onOpenChange, vendor, onSuccess }: VendorFormSheetProps) {
  const isEditing = !!vendor;
  // Form state, mutations, etc.
}
```

**Form Sections:**
1. **Basic Info** - name, trade, contact_name
2. **Contact Details** - phone, email, website, address
3. **Qualifications** - licensed, insured, w9_on_file (checkbox group)
4. **Ratings** - rating (stars), reliability, price_level
5. **Status** - status dropdown, notes textarea

---

### Task 2: Create Vendor Mutations Hook

**File:** `src/hooks/use-vendor-mutations.ts`

**Mutations to implement:**

```typescript
export function useVendorMutations() {
  const queryClient = useQueryClient();

  // CREATE
  const createVendor = useMutation({
    mutationFn: async (vendor: VendorInput) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created');
    },
  });

  // UPDATE
  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vendor> & { id: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated');
    },
  });

  // DELETE
  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();

      // Check for dependencies first
      const { count } = await supabase
        .from('budget_items')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', id);

      if (count && count > 0) {
        throw new Error(`Cannot delete: vendor is assigned to ${count} budget items`);
      }

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { createVendor, updateVendor, deleteVendor };
}
```

---

### Task 3: Update Vendors Tab

**File:** `src/components/project/tabs/vendors-tab.tsx`

**Enhancements:**

1. **Add Vendor Button** - Opens VendorFormSheet in add mode
2. **Edit Vendor** - Click vendor card → Opens VendorFormSheet in edit mode
3. **Delete Vendor** - Dropdown action with confirmation
4. **Search/Filter** - Search by name, filter by trade
5. **Sort Options** - By name, rating, date added

**Updated Props:**
```tsx
interface VendorsTabProps {
  projectId: string;
  vendors: Vendor[];
  budgetItems: BudgetItem[];
}
```

**New State:**
```tsx
const [isAddOpen, setIsAddOpen] = useState(false);
const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [tradeFilter, setTradeFilter] = useState<VendorTrade | 'all'>('all');
```

**UI Changes:**
- Add search input in header
- Add trade filter dropdown
- Add "Add Vendor" button (already exists, needs onClick)
- Add dropdown menu on each vendor card (Edit, Delete, View Details)
- Click card → open edit sheet

---

### Task 4: Create Delete Confirmation Dialog

**File:** `src/components/ui/alert-dialog.tsx` (add shadcn component)

**Usage:**
```tsx
<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "{vendor.name}". This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Task 5: Vendor Assignment to Budget Items

**File:** `src/components/project/tabs/budget-detail-tab.tsx`

**Changes:**
1. Add vendor dropdown to budget item inline edit form
2. Show vendor name in budget item row (when assigned)
3. Quick-assign: Dropdown in budget item row for vendor selection

**New Inline Field:**
```tsx
<Select
  value={item.vendor_id || ''}
  onValueChange={(value) => updateItem({ vendor_id: value || null })}
>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Assign vendor..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">No vendor</SelectItem>
    {vendors.map((v) => (
      <SelectItem key={v.id} value={v.id}>
        {v.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

### Task 6: Vendor Detail Sheet (View Mode)

**File:** `src/components/project/vendor-detail-sheet.tsx`

**Purpose:** Full read-only view of vendor with all details and project history.

**Sections:**
1. **Header** - Name, trade, status badge, rating stars
2. **Contact Info** - All contact fields with click-to-call/email
3. **Qualifications** - Licensed/Insured/W9 badges
4. **Project History** - List of projects and budget items for this vendor
5. **Payment Summary** - Total paid, pending amounts (from view)
6. **Notes** - Full notes display
7. **Actions** - Edit, Delete buttons

---

### Task 7: Star Rating Component

**File:** `src/components/ui/star-rating.tsx`

**Component:**
```tsx
interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly, size = 'md' }: StarRatingProps) {
  // Render 5 stars, filled based on value
  // If not readonly, allow click to set value
}
```

---

## File Structure After Implementation

```
src/
├── components/
│   ├── project/
│   │   ├── tabs/
│   │   │   └── vendors-tab.tsx          # Updated with CRUD
│   │   ├── vendor-form-sheet.tsx        # NEW - Add/Edit form
│   │   └── vendor-detail-sheet.tsx      # NEW - View details
│   └── ui/
│       ├── alert-dialog.tsx             # NEW - Confirmation dialog
│       └── star-rating.tsx              # NEW - Rating component
├── hooks/
│   └── use-vendor-mutations.ts          # NEW - CRUD mutations
└── types/
    └── index.ts                         # Existing (no changes needed)
```

---

## Implementation Order

### Phase 1: Core CRUD (Sprint Priority)
1. ✅ Add `alert-dialog.tsx` UI component (shadcn)
2. ✅ Create `use-vendor-mutations.ts` hook
3. ✅ Create `vendor-form-sheet.tsx` component
4. ✅ Update `vendors-tab.tsx` with Add/Edit/Delete

### Phase 2: Enhanced UX
5. Add search and filter to vendors tab
6. Create `star-rating.tsx` component
7. Create `vendor-detail-sheet.tsx` for full view

### Phase 3: Budget Integration
8. Add vendor dropdown to budget item edit
9. Show vendor name/badge in budget item rows
10. Filter budget items by vendor

---

## Database Considerations

### Current Schema (No Changes Needed)
The `vendors` table already supports all required fields:
- Basic info, contact details, qualifications
- Rating (1-5), reliability, price_level
- Status tracking
- Notes

### RLS Policies (Already Configured)
- Users can only see/edit their own vendors
- `user_id` links vendors to authenticated user

### Foreign Key Handling
- `budget_items.vendor_id` → `ON DELETE SET NULL`
- `draws.vendor_id` → `ON DELETE SET NULL`
- Safe to delete vendors; references become null

---

## API Patterns

### Create Vendor
```typescript
const { data, error } = await supabase
  .from('vendors')
  .insert({
    name: 'ABC Plumbing',
    trade: 'plumber',
    phone: '612-555-1234',
    licensed: true,
    insured: true,
    status: 'active',
  })
  .select()
  .single();
```

### Update Vendor
```typescript
const { data, error } = await supabase
  .from('vendors')
  .update({ rating: 5, reliability: 'excellent' })
  .eq('id', vendorId)
  .select()
  .single();
```

### Delete Vendor (with dependency check)
```typescript
// First check for budget items
const { count } = await supabase
  .from('budget_items')
  .select('*', { count: 'exact', head: true })
  .eq('vendor_id', vendorId);

if (count > 0) {
  throw new Error('Vendor has assigned budget items');
}

// Safe to delete
await supabase.from('vendors').delete().eq('id', vendorId);
```

### Query Vendors with Payment Summary
```typescript
const { data } = await supabase
  .from('vendor_payment_summary')
  .select('*')
  .order('name');
```

---

## Form Validation Rules

| Field | Validation |
|-------|------------|
| `name` | Required, min 2 characters |
| `trade` | Required, must be valid enum value |
| `email` | Optional, must be valid email format |
| `phone` | Optional, must be valid phone format |
| `rating` | Optional, 1-5 integer |
| `status` | Required, defaults to 'active' |

---

## UI/UX Guidelines

### Vendor Cards
- Show status badge (color-coded: green=active, gray=inactive, red=do_not_use)
- Show rating as filled/empty stars
- Show qualification badges (Licensed ✓, Insured ✓, W9 ✓)
- Hover state with subtle elevation
- Click to open edit sheet

### Form Sheet
- Slide in from right
- Clear section headers
- Save button at bottom (sticky)
- Cancel closes without saving
- Show loading state during mutation

### Delete Confirmation
- Red destructive action button
- Show vendor name in message
- Disable if vendor has dependencies (show warning instead)

### Empty States
- "No vendors yet. Add your first vendor to get started."
- "No vendors match your search."

---

## Testing Checklist

### Functional Tests
- [ ] Can create vendor with required fields only
- [ ] Can create vendor with all fields
- [ ] Can edit existing vendor
- [ ] Can delete vendor with no dependencies
- [ ] Cannot delete vendor with budget items (shows error)
- [ ] Search filters vendors by name
- [ ] Trade filter works correctly
- [ ] Vendor appears in dropdown when assigning to budget item

### Edge Cases
- [ ] Empty name validation
- [ ] Invalid email format
- [ ] Duplicate vendor names (allowed? unique constraint?)
- [ ] Delete while sheet is open
- [ ] Network error handling

### UI Tests
- [ ] Sheet opens/closes correctly
- [ ] Form resets on cancel
- [ ] Loading states show during mutations
- [ ] Toast notifications appear
- [ ] Star rating interaction works

---

## Estimated Effort

| Task | Complexity | Estimate |
|------|------------|----------|
| Alert dialog component | Low | 0.5 hr |
| Vendor mutations hook | Medium | 1 hr |
| Vendor form sheet | High | 2-3 hr |
| Update vendors tab | Medium | 1.5 hr |
| Star rating component | Low | 0.5 hr |
| Vendor detail sheet | Medium | 1 hr |
| Budget item vendor assignment | Medium | 1 hr |
| **Total** | | **8-9 hr** |

---

## Questions to Resolve

1. **Unique constraint on vendor name?** - Probably not, same vendor might work across user accounts
2. **Vendor categories/tags?** - Just trade for now, expand later if needed
3. **Vendor documents storage?** - W9, insurance cert uploads (Phase 3 feature)
4. **Vendor import/export?** - CSV import for migrating from spreadsheets (future)
5. **Shared vendor directory?** - Currently per-user; team sharing is future feature

---

## Dependencies

**Already Installed:**
- `@tanstack/react-query` - Mutations and cache
- `@radix-ui/react-dialog` - Sheet component uses this
- `sonner` - Toast notifications

**Need to Add (shadcn CLI):**
```bash
npx shadcn@latest add alert-dialog
```

---

*Last Updated: January 2026*
