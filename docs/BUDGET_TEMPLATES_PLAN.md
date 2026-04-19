# Budget Templates - Implementation Plan

> Comprehensive plan for implementing reusable budget templates in Rehab Budget Pro.
> Created: January 8, 2026

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [User Stories](#user-stories)
3. [Database Schema](#database-schema)
4. [UI/UX Design](#uiux-design)
5. [Implementation Steps](#implementation-steps)
6. [File Structure](#file-structure)
7. [API Design](#api-design)

---

## Feature Overview

### What Are Budget Templates?

Budget Templates allow users to save and reuse budget structures across multiple rehab projects. Instead of manually entering the same line items for each project, users can:

1. **Save** a project's budget as a reusable template
2. **Apply** templates when creating new projects
3. **Manage** a library of templates (rename, duplicate, delete)
4. **Share** templates via export/import (future enhancement)

### Why This Feature?

- **Time Savings**: Experienced flippers have established scopes of work they reuse
- **Consistency**: Ensures all projects include necessary line items
- **Accuracy**: Templates can include estimated costs from previous projects
- **Organization**: Different templates for different property types (light cosmetic vs full gut)

### Template Types

1. **System Templates** (Read-only)
   - Pre-built by the app
   - Examples: "Light Cosmetic Refresh", "Full Gut Renovation", "Kitchen & Bath Focus"

2. **User Templates** (Editable)
   - Created by users from their own projects
   - Fully customizable

---

## User Stories

### Core User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T1 | User | Save my current project's budget as a template | I can reuse it for similar projects |
| T2 | User | Apply a template when creating a new project | I don't have to enter line items manually |
| T3 | User | Preview a template before applying it | I know what line items it includes |
| T4 | User | Edit template details (name, description) | I can organize my template library |
| T5 | User | Delete templates I no longer need | My library stays clean |
| T6 | User | Duplicate a template | I can create variations |
| T7 | User | See which categories/items are in each template | I can choose the right one |
| T8 | User | Include estimated costs in templates | New projects start with baseline estimates |

### Secondary User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T9 | User | Choose which line items to include when saving | I only save relevant items |
| T10 | User | Merge a template into an existing project | I can add items without recreating |
| T11 | User | See template usage stats | I know which templates I use most |
| T12 | User | Star/favorite templates | Quick access to my go-to templates |

---

## Database Schema

### New Tables

```sql
-- ============================================================================
-- BUDGET TEMPLATES
-- ============================================================================

-- Template metadata
CREATE TABLE budget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template Info
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  template_type TEXT NOT NULL DEFAULT 'user' CHECK (template_type IN ('system', 'user')),
  property_type property_type, -- Optional: target property type (sfh, duplex, etc.)
  scope_level TEXT CHECK (scope_level IN ('light', 'medium', 'heavy', 'gut')),

  -- Stats
  times_used INTEGER DEFAULT 0,

  -- Flags
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template line items (the actual budget structure)
CREATE TABLE budget_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,

  -- Item Details (same as budget_items)
  category budget_category NOT NULL,
  item TEXT NOT NULL,
  description TEXT,

  -- Default Values (optional - user can include estimates)
  qty NUMERIC(10,2) DEFAULT 0,
  unit unit_type DEFAULT 'ls',
  rate NUMERIC(12,2) DEFAULT 0,
  default_amount NUMERIC(12,2) DEFAULT 0, -- Suggested underwriting amount

  -- Classification
  cost_type cost_type DEFAULT 'both',
  default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('high', 'medium', 'low')),
  suggested_trade vendor_trade, -- Recommended vendor type

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budget_templates_user_id ON budget_templates(user_id);
CREATE INDEX idx_budget_templates_type ON budget_templates(template_type);
CREATE INDEX idx_budget_template_items_template_id ON budget_template_items(template_id);
CREATE INDEX idx_budget_template_items_category ON budget_template_items(category);

-- RLS Policies
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_template_items ENABLE ROW LEVEL SECURITY;

-- Users can view system templates + their own
CREATE POLICY "Users can view templates" ON budget_templates
  FOR SELECT USING (template_type = 'system' OR auth.uid() = user_id);

-- Users can only modify their own templates
CREATE POLICY "Users can insert own templates" ON budget_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id AND template_type = 'user');
CREATE POLICY "Users can update own templates" ON budget_templates
  FOR UPDATE USING (auth.uid() = user_id AND template_type = 'user');
CREATE POLICY "Users can delete own templates" ON budget_templates
  FOR DELETE USING (auth.uid() = user_id AND template_type = 'user');

-- Template items follow parent template access
CREATE POLICY "Users can view template items" ON budget_template_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND (t.template_type = 'system' OR t.user_id = auth.uid())
    )
  );
CREATE POLICY "Users can manage own template items" ON budget_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
      AND t.template_type = 'user'
    )
  );
```

### Views

```sql
-- Template summary with item counts
CREATE VIEW budget_template_summary AS
SELECT
  t.*,
  COUNT(DISTINCT i.id) as item_count,
  COUNT(DISTINCT i.category) as category_count,
  COALESCE(SUM(i.default_amount), 0) as total_estimate,
  ARRAY_AGG(DISTINCT i.category ORDER BY i.category) as categories
FROM budget_templates t
LEFT JOIN budget_template_items i ON i.template_id = t.id
GROUP BY t.id;
```

---

## UI/UX Design

### Design Principles

1. **Discoverability**: Templates should be easy to find and understand
2. **Quick Actions**: Save/Apply should be 1-2 clicks
3. **Preview First**: Always show what a template contains before applying
4. **Non-Destructive**: Applying a template should merge, not replace (with option to replace)
5. **Familiar Patterns**: Use existing UI components (sheets, dialogs, cards)

---

### UI Flow 1: Save Project as Template

**Entry Points:**
- Budget tab → "⋮" menu → "Save as Template"
- Project header → Actions menu → "Save as Template"

**Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  Save as Template                                      [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Template Name *                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Full Gut - 3BR SFH                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Description                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Complete renovation scope for single-family homes   │   │
│  │ with 3 bedrooms. Includes full kitchen/bath reno.   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Scope Level                          Property Type         │
│  ┌──────────────────┐                ┌──────────────────┐  │
│  │ Heavy Rehab    ▼ │                │ Single Family  ▼ │  │
│  └──────────────────┘                └──────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Include estimated amounts                         │   │
│  │   Copy current underwriting amounts to template     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── Select Items to Include ──────────────────────────────  │
│                                                             │
│  ☑ Select All (87 items)                                   │
│                                                             │
│  ▼ Demo (4 items)                               ☑ $8,500   │
│    ☑ Interior Demo                                         │
│    ☑ Exterior Demo                                         │
│    ☑ Dumpster/Hauling                                      │
│    ☐ Hazmat Abatement (skip - not applicable)              │
│                                                             │
│  ▼ Plumbing (6 items)                          ☑ $12,000   │
│    ☑ Rough-In Plumbing                                     │
│    ☑ Finish Plumbing                                       │
│    ...                                                      │
│                                                             │
│  ▶ HVAC (5 items)                              ☑ $6,500    │
│  ▶ Electrical (5 items)                        ☑ $8,200    │
│  ... (remaining categories collapsed)                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Template]      │
└─────────────────────────────────────────────────────────────┘
```

**Interaction Details:**
- Category headers are expandable/collapsible
- Checkbox on category header toggles all items in that category
- Total estimate shown per category (updates as items are toggled)
- "Include estimated amounts" checkbox controls whether to save $ values

---

### UI Flow 2: Template Library (Management)

**Entry Point:**
- Sidebar → "Templates" menu item
- Settings → "Budget Templates"

**Template Library Page:**
```
┌─────────────────────────────────────────────────────────────┐
│  Budget Templates                           [+ New Template] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Search templates...                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Filter: [All ▼]  [Any Scope ▼]  [Any Property ▼]          │
│                                                             │
│  ── My Templates ────────────────────────────────────────   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ ⭐ Full Gut - 3BR SFH                           [⋮]   ││
│  │    Heavy Rehab • Single Family                        ││
│  │    87 items across 16 categories • ~$85,000 estimate  ││
│  │    Used 12 times • Last used 3 days ago               ││
│  │    ─────────────────────────────────────────────────  ││
│  │    Demo ████ Plumbing ███ Electrical ██ Kitchen ████  ││
│  │                                                        ││
│  │    [Preview]  [Apply to Project ▼]  [Duplicate]       ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │    Kitchen & Bath Refresh                       [⋮]   ││
│  │    Medium Rehab • Any Property                        ││
│  │    34 items across 8 categories • ~$42,000 estimate   ││
│  │    Used 5 times                                        ││
│  │    ...                                                 ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ── System Templates ────────────────────────────────────   │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │ 📋 Light Cosmetic Refresh                       [🔒]  ││
│  │    Light Rehab • Any Property                         ││
│  │    28 items across 6 categories                       ││
│  │    Paint, flooring, fixtures, and minor repairs       ││
│  │                                                        ││
│  │    [Preview]  [Apply to Project ▼]  [Copy to My...]   ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Template Card Actions (⋮ menu):**
- ⭐ Add to Favorites / Remove from Favorites
- ✏️ Edit Details
- 📋 Duplicate
- 📤 Export (JSON)
- 🗑️ Delete

**Visual Elements:**
- Category bar shows relative budget distribution
- Star icon for favorites (shown prominently)
- Lock icon for system templates (read-only)
- Usage stats encourage engagement

---

### UI Flow 3: Apply Template to Project

**Entry Points:**
- New Project form → "Start from Template" option
- Existing project Budget tab → "⋮" menu → "Apply Template"
- Template Library → "Apply to Project" button

**A. During New Project Creation:**
```
┌─────────────────────────────────────────────────────────────┐
│  Create New Project                                    [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Property Address *                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search address...                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... (other project fields) ...                             │
│                                                             │
│  ── Budget Setup ───────────────────────────────────────    │
│                                                             │
│  ○ Start with default line items                           │
│    Standard categories with empty amounts                   │
│                                                             │
│  ● Start from template                                      │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ Select a template...                             ▼  │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                             │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ ⭐ Full Gut - 3BR SFH                               │ │
│    │    87 items • ~$85,000                              │ │
│    │    ☑ Include estimated amounts                      │ │
│    │    [Preview Items →]                                │ │
│    └─────────────────────────────────────────────────────┘ │
│                                                             │
│  ○ Start with empty budget                                 │
│    No line items - add everything manually                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Create Project]     │
└─────────────────────────────────────────────────────────────┘
```

**B. Applying to Existing Project:**
```
┌─────────────────────────────────────────────────────────────┐
│  Apply Template                                        [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Template                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⭐ Full Gut - 3BR SFH                            ▼  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── Preview ────────────────────────────────────────────    │
│                                                             │
│  This template will add:                                    │
│  • 87 line items across 16 categories                      │
│  • Estimated total: $85,000                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Demo (4) │ Plumbing (6) │ HVAC (5) │ ...     [+12]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ── Conflict Resolution ────────────────────────────────    │
│                                                             │
│  Your project already has 23 items. How should we handle   │
│  items that exist in both?                                  │
│                                                             │
│  ○ Skip duplicates                                         │
│    Keep existing items, only add new ones                   │
│                                                             │
│  ● Merge (recommended)                                      │
│    Add new items, update amounts for existing matches       │
│                                                             │
│  ○ Replace all                                             │
│    ⚠️ Delete existing items and replace with template       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Include estimated amounts from template           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Apply Template]     │
└─────────────────────────────────────────────────────────────┘
```

---

### UI Flow 4: Template Preview

**Full-screen preview showing all template contents:**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Templates                                        │
│                                                             │
│  Full Gut - 3BR SFH                                        │
│  Heavy Rehab • Single Family • 87 items                    │
│                                                             │
│  Complete renovation scope for single-family homes with    │
│  3 bedrooms. Includes full kitchen/bath renovation,        │
│  new HVAC, updated electrical, and complete refinishing.   │
│                                                             │
│  Total Estimate: $85,000          [Apply to Project ▼]     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Demo ───────────────────────────────────── $8,500 ───┐ │
│  │                                                        │ │
│  │  Item                    Unit    Qty    Rate    Amount │ │
│  │  ─────────────────────────────────────────────────────│ │
│  │  Interior Demo           SF      1,800  $2.50   $4,500 │ │
│  │  Exterior Demo           LS      1      $2,000  $2,000 │ │
│  │  Dumpster/Hauling        Load    4      $500    $2,000 │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Plumbing ──────────────────────────────── $12,000 ───┐ │
│  │                                                        │ │
│  │  Item                    Unit    Qty    Rate    Amount │ │
│  │  ─────────────────────────────────────────────────────│ │
│  │  Rough-In Plumbing       LS      1      $4,500  $4,500 │ │
│  │  Finish Plumbing         LS      1      $2,500  $2,500 │ │
│  │  Water Heater            EA      1      $1,800  $1,800 │ │
│  │  Fixtures & Faucets      LS      1      $3,200  $3,200 │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ... (remaining categories) ...                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Navigation & Entry Points Summary

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  SIDEBAR                          BUDGET TAB                │
│  ────────                         ──────────                │
│  📊 Dashboard                     ┌─────────────────────┐   │
│  📁 Projects                      │  Budget  │ Vendors │   │
│  📋 Templates  ←─────────────┐    ├─────────────────────┤   │
│  📓 Journal                  │    │                     │   │
│  ⚙️ Settings                 │    │  [+ Add Item]       │   │
│                              │    │  [⋮] ←───────────┐  │   │
│                              │    │      │           │  │   │
│  NEW PROJECT FLOW            │    │      │  ┌───────────┐   │
│  ────────────────            │    │      └──│ Save as   │   │
│  ┌─────────────────┐         │    │         │ Template  │   │
│  │ Budget Setup:   │         │    │         │───────────│   │
│  │ ○ Default       │         │    │         │ Apply     │   │
│  │ ● Template ←────┼─────────┼────┼─────────│ Template  │   │
│  │ ○ Empty         │         │    │         └───────────┘   │
│  └─────────────────┘         │    │                     │   │
│                              │    └─────────────────────┘   │
│                              │                              │
│  TEMPLATE LIBRARY ←──────────┘                              │
│  ────────────────                                           │
│  [+ New] [Search] [Filter]                                  │
│  ┌──────────────────────┐                                   │
│  │ My Templates         │                                   │
│  │ • Full Gut - 3BR     │ → Preview, Apply, Edit, Delete   │
│  │ • Kitchen & Bath     │                                   │
│  ├──────────────────────┤                                   │
│  │ System Templates     │                                   │
│  │ • Light Cosmetic     │ → Preview, Apply, Copy           │
│  │ • Medium Rehab       │                                   │
│  └──────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Phase 1: Database & Types (Day 1)
1. Create migration for `budget_templates` and `budget_template_items` tables
2. Create `budget_template_summary` view
3. Add TypeScript types to `src/types/index.ts`
4. Seed 3-5 system templates

### Phase 2: Core Hooks (Day 1-2)
1. Create `src/hooks/use-budget-templates.ts`:
   - `useBudgetTemplates()` - List all templates
   - `useBudgetTemplate(id)` - Get single template with items
   - `useCreateTemplate()` - Save project as template
   - `useUpdateTemplate()` - Edit template metadata
   - `useDeleteTemplate()` - Delete template
   - `useDuplicateTemplate()` - Copy template
   - `useApplyTemplate()` - Apply template to project
   - `useToggleFavorite()` - Star/unstar template

### Phase 3: Template Library Page (Day 2)
1. Create `src/app/templates/page.tsx`
2. Create template card component
3. Implement search and filtering
4. Add to sidebar navigation

### Phase 4: Save as Template Flow (Day 2-3)
1. Create `SaveAsTemplateSheet` component
2. Add item selection with category grouping
3. Integrate into Budget tab menu
4. Handle "include amounts" option

### Phase 5: Apply Template Flow (Day 3)
1. Create `ApplyTemplateSheet` component
2. Add template selection dropdown
3. Implement conflict resolution logic
4. Integrate into new project form
5. Integrate into existing project Budget tab

### Phase 6: Template Preview (Day 3-4)
1. Create `TemplatePreview` component
2. Show categorized items with amounts
3. Add quick-apply action

### Phase 7: Polish & Testing (Day 4)
1. Add loading states and skeletons
2. Error handling and validation
3. Toast notifications
4. Mobile responsiveness
5. Integration tests

---

## File Structure

```
src/
├── app/
│   └── templates/
│       ├── page.tsx              # Template library page
│       └── [id]/
│           └── page.tsx          # Template detail/preview
│
├── components/
│   └── templates/
│       ├── template-card.tsx     # Card for library list
│       ├── template-preview.tsx  # Full preview component
│       ├── save-as-template-sheet.tsx
│       ├── apply-template-sheet.tsx
│       ├── template-select.tsx   # Dropdown selector
│       └── category-item-list.tsx # Grouped item display
│
├── hooks/
│   └── use-budget-templates.ts   # All template hooks
│
└── types/
    └── index.ts                  # Add BudgetTemplate types

supabase/
└── migrations/
    └── 20260108_add_budget_templates.sql
```

---

## API Design

### Types

```typescript
// Template metadata
interface BudgetTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_type: 'system' | 'user';
  property_type: PropertyType | null;
  scope_level: 'light' | 'medium' | 'heavy' | 'gut' | null;
  times_used: number;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Template line item
interface BudgetTemplateItem {
  id: string;
  template_id: string;
  category: BudgetCategory;
  item: string;
  description: string | null;
  qty: number;
  unit: UnitType;
  rate: number;
  default_amount: number;
  cost_type: CostType;
  default_priority: 'high' | 'medium' | 'low';
  suggested_trade: VendorTrade | null;
  sort_order: number;
  created_at: string;
}

// Summary view with counts
interface BudgetTemplateSummary extends BudgetTemplate {
  item_count: number;
  category_count: number;
  total_estimate: number;
  categories: BudgetCategory[];
}

// Input types
type BudgetTemplateInput = Omit<BudgetTemplate, 'id' | 'user_id' | 'times_used' | 'created_at' | 'updated_at'>;
type BudgetTemplateItemInput = Omit<BudgetTemplateItem, 'id' | 'created_at'>;

// Apply options
interface ApplyTemplateOptions {
  templateId: string;
  projectId: string;
  includeAmounts: boolean;
  conflictResolution: 'skip' | 'merge' | 'replace';
}

// Save options
interface SaveAsTemplateOptions {
  projectId: string;
  name: string;
  description?: string;
  propertyType?: PropertyType;
  scopeLevel?: 'light' | 'medium' | 'heavy' | 'gut';
  includeAmounts: boolean;
  selectedItemIds: string[]; // Which budget items to include
}
```

### Hook Signatures

```typescript
// List templates
function useBudgetTemplates(filters?: {
  type?: 'system' | 'user' | 'all';
  propertyType?: PropertyType;
  scopeLevel?: string;
  search?: string;
  favoritesOnly?: boolean;
}): UseQueryResult<BudgetTemplateSummary[]>;

// Get single template with items
function useBudgetTemplate(id: string): UseQueryResult<{
  template: BudgetTemplate;
  items: BudgetTemplateItem[];
}>;

// Mutations
function useCreateTemplate(): UseMutationResult<BudgetTemplate, Error, SaveAsTemplateOptions>;
function useUpdateTemplate(): UseMutationResult<BudgetTemplate, Error, Partial<BudgetTemplate> & { id: string }>;
function useDeleteTemplate(): UseMutationResult<void, Error, string>;
function useDuplicateTemplate(): UseMutationResult<BudgetTemplate, Error, string>;
function useApplyTemplate(): UseMutationResult<{ added: number; updated: number; skipped: number }, Error, ApplyTemplateOptions>;
function useToggleTemplateFavorite(): UseMutationResult<BudgetTemplate, Error, { id: string; is_favorite: boolean }>;
```

---

## System Templates (Seed Data)

### 1. Light Cosmetic Refresh
- **Scope**: Paint, flooring, fixtures, minor repairs
- **Categories**: Interior Paint, Flooring, Finishing, Soft Costs
- **Items**: ~25-30
- **Est. Total**: $15,000-25,000

### 2. Kitchen & Bath Focus
- **Scope**: Kitchen and bathroom renovations with supporting work
- **Categories**: Kitchen, Bathrooms, Plumbing, Electrical, Tile, Flooring
- **Items**: ~35-40
- **Est. Total**: $35,000-50,000

### 3. Full Gut Renovation
- **Scope**: Complete renovation including structural
- **Categories**: All 18 categories
- **Items**: ~80-100
- **Est. Total**: $75,000-125,000

### 4. Investor Flip Standard
- **Scope**: Typical flip renovation without structural
- **Categories**: 14 categories (excludes structural, hvac, major electrical)
- **Items**: ~60-70
- **Est. Total**: $45,000-65,000

---

## Success Metrics

- Template creation rate (templates created per user per month)
- Template usage rate (% of new projects using templates)
- Time savings (compare project setup time with/without templates)
- Template library size per user
- Favorite template usage frequency

---

## Future Enhancements

1. **Export/Import**: Share templates as JSON files
2. **Template Marketplace**: Share templates with other users
3. **AI Suggestions**: Recommend templates based on property details
4. **Version History**: Track changes to templates over time
5. **Cost Auto-Population**: Pull from cost_reference table automatically
6. **Category Presets**: Quick-add category bundles (e.g., "Add all Kitchen items")
