# Rehab Budget Pro - Project Status

> Single source of truth for implementation status and roadmap.
> Last updated: January 7, 2026

## Quick Reference

| Feature | Status |
|---------|--------|
| Three-Column Budget Model | ✅ Complete |
| Budget CRUD (add/edit/delete/bulk) | ✅ Complete |
| Vendor Management | ✅ Complete |
| Draw Management | ✅ Complete |
| Photo Upload | ✅ Complete |
| Kanban Dashboard | ✅ Complete |
| Drag & Drop Reordering | ✅ Complete |
| PDF Exports | 🚧 Not Started |
| Authentication | 🚧 Not Started |
| Real-time Updates | 🚧 Not Started |

---

## ✅ Completed Features

### Core Foundation
- **Three-Column Budget Model** - Underwriting → Forecast → Actual with computed variances
- **Project Creation** - Google Places autocomplete, auto-seeds 18 budget categories
- **Deal Summary Tab** - MAO calculations, ROI by scenario, spread analysis
- **Cost Reference Tab** - Minneapolis metro pricing data

### Budget Management
- **Full CRUD** - Add/edit/delete line items per category
- **Inline Editing** - Click to edit amounts directly in table
- **Bulk Operations** - Select mode, bulk status update, bulk delete
- **Category Totals** - Auto-calculated from database views

### Vendor Management
- **Full CRUD** - Add/edit/delete with optimistic updates
- **Vendor Directory** - Global across all projects
- **Tags & Categories** - Custom colored tags
- **Contact History** - Log calls, emails, site visits with follow-ups
- **CSV Import/Export** - Bulk vendor management
- **Assignment** - Link vendors to budget items

### Draw Management
- **Full CRUD** - Add/edit/delete draws
- **Status Workflow** - Pending → Approved → Paid
- **Auto-numbering** - Sequential draw numbers per project
- **Milestone Tracking** - 6 milestone types
- **Payment Details** - Method, reference number, dates

### Photo Upload
- **Per Line Item** - Camera icon on each budget row
- **Drag & Drop** - react-dropzone integration
- **Type Classification** - Receipt, Progress, Before, After, Other
- **Supabase Storage** - Secure signed URLs
- **Photo Gallery** - Grid view with delete

### Dashboard
- **Portfolio Health** - Total ARV, Capital Deployed, ROI, Active Projects
- **Kanban Pipeline** - Drag-drop projects between status columns
- **Context-Aware Cards** - Different info per project status
- **Search** - Filter across all columns

### Drag & Drop
- **Budget Items** - Reorder within category
- **Project Pipeline** - Move between status columns
- **@dnd-kit** - Full accessibility support

---

## 🚧 Next Up

### High Priority

#### PDF Exports
- [ ] Underwriting Summary PDF (for lenders)
- [ ] Full Project Report PDF (for investors)
- [ ] Draw Request PDF (with photos/receipts)

**Dependencies:** `@react-pdf/renderer` (installed)

#### Authentication
- [ ] Supabase Auth integration
- [ ] Login/signup pages
- [ ] Protected routes middleware
- [ ] RLS policy enforcement

**Files to create:**
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/middleware.ts`

### Medium Priority

#### Project Notes Integration
- [ ] Rich text editor in Deal Summary tab
- [ ] Auto-save on blur
- [ ] Activity log/journal

**Dependencies:** `@tiptap/*` (installed, components built)

#### Real-time Updates
- [ ] Supabase subscriptions
- [ ] Live collaboration
- [ ] Optimistic UI updates

### Low Priority

- [ ] Budget Templates (save/reuse structures)
- [ ] Excel Export
- [ ] Mobile optimization
- [ ] Offline support

---

## 📁 Key Files

### Hooks
| Hook | Purpose |
|------|---------|
| `use-budget-item-mutations.ts` | Budget CRUD, bulk operations |
| `use-vendor-mutations.ts` | Vendor CRUD with optimistic updates |
| `use-vendor-tags.ts` | Tag management |
| `use-vendor-contacts.ts` | Contact history |
| `use-draw-mutations.ts` | Draw CRUD, status transitions |
| `use-photo-mutations.ts` | Upload, delete, signed URLs |
| `use-projects.ts` | Project queries |
| `use-dashboard.ts` | Portfolio aggregates |

### Components
| Component | Purpose |
|-----------|---------|
| `budget-detail-tab.tsx` | Three-column budget table |
| `deal-summary-tab.tsx` | Financials, MAO, ROI |
| `vendors-tab.tsx` | Vendor directory |
| `draws-tab.tsx` | Payment tracking |
| `vendor-form-sheet.tsx` | Add/edit vendor |
| `budget-item-form-sheet.tsx` | Add budget item |
| `draw-form-sheet.tsx` | Add/edit draw |
| `photo-upload-sheet.tsx` | Upload with drag & drop |
| `kanban-pipeline.tsx` | Dashboard pipeline |
| `portfolio-health.tsx` | Dashboard metrics |

### Database
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Main schema |
| `supabase/migrations/` | Schema changes |
| `supabase/seed.sql` | Cost reference data |

---

## 🐛 Known Issues

1. **Auth not implemented** - `user_id` is null in all inserts
2. **No RLS enforcement** - Waiting on auth
3. **No real-time** - Manual refresh required
4. **Mobile budget table** - Needs horizontal scroll optimization

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | React Query + Zustand |
| Icons | Tabler Icons |
| Animations | Framer Motion |
| DnD | @dnd-kit |
| PDF | @react-pdf/renderer |
| Editor | TipTap |

---

## 📋 Sprint History

### Sprint 1 ✅ - Budget CRUD
- Add/delete line items
- Bulk operations
- Inline editing

### Sprint 2 ✅ - Vendor Management
- Full CRUD
- Tags & contacts
- CSV import/export

### Sprint 3 ✅ - Draw Management
- Full CRUD
- Status workflow
- Milestone tracking

### Sprint 4 ✅ - Photos & Dashboard
- Photo upload system
- Kanban pipeline
- Portfolio metrics

### Sprint 5 (Current) - Exports & Auth
- PDF generation
- Authentication
- Protected routes
