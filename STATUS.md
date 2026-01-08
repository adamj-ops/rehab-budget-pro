# Rehab Budget Pro - Project Status

> Single source of truth for implementation status and roadmap.
> Last updated: January 8, 2026

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
| PDF Exports | ✅ Complete |
| Authentication | ✅ Complete |
| Real-time Updates | ✅ Complete |
| Journal/Notes System | ✅ Complete |
| Calculation Settings | ✅ Complete |
| Budget Templates | ✅ Complete |
| Excel Export | ✅ Complete |

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
- **View Toggle** - Switch between Kanban and Gantt/Timeline views

### Drag & Drop
- **Budget Items** - Reorder within category
- **Project Pipeline** - Move between status columns
- **@dnd-kit** - Full accessibility support

### Authentication
- **Supabase Auth** - Email/password + Google OAuth
- **Auth Pages** - `/auth/login`, `/auth/signup`, `/auth/callback`
- **Route Protection** - Middleware guards authenticated routes
- **RLS Enforcement** - All tables filtered by user_id
- **Session Management** - Automatic state synchronization

### PDF Exports
- **6 Report Templates**:
  - Executive Summary (for lenders)
  - Detailed Budget (full three-column breakdown)
  - Investment Analysis (deal metrics)
  - Draw Schedule (with photos/receipts)
  - Property Showcase (property photos/info)
  - Vendor Summary (contacts and assignments)
- **Export Dialog** - Template selection with descriptions
- **Preview & Download** - Browser-based PDF generation

### Real-time Updates
- **Supabase Subscriptions** - Live data sync
- **React Query Integration** - Auto cache invalidation
- **Specialized Hooks**:
  - `useRealtimeSubscription` - Core subscription hook
  - `useProjectRealtime` - Project-specific updates
  - `useProjectsListRealtime` - Dashboard updates
  - `useVendorsRealtime` - Vendor directory sync
- **Status Tracking** - Connection state monitoring

### Journal/Notes System
- **Rich Text Editor** - TipTap-based with full formatting
- **Page Types** - Note, Meeting, Checklist, Idea, Research, Site Visit
- **Auto-save** - 1-second debounce
- **Project Tagging** - Associate notes with projects
- **Pin/Archive** - Organize important notes
- **Filtering** - By project, type, search

### Calculation Settings
- **7 Configuration Sections**:
  - MAO (Maximum Allowable Offer) methods
  - ROI calculation methods
  - Contingency calculation methods
  - Holding cost methods
  - Selling cost settings
  - Profit thresholds
  - Variance/alert thresholds
- **Live Preview** - Real-time calculation updates
- **Formula Display** - Shows current calculation formula
- **Database Persistence** - Settings saved per user

### Budget Templates
- **Template Library** - Browse and manage templates at `/templates`
- **System Templates** - 4 pre-built templates (Light Cosmetic, Kitchen & Bath, Full Gut, Investor Flip)
- **User Templates** - Save custom templates from any project
- **Save as Template** - Select items to include, optionally include amounts
- **Apply Template** - Apply to new or existing projects with conflict resolution (skip/merge/replace)
- **Template Preview** - Full preview of template contents at `/templates/[id]`
- **Favorites** - Star frequently used templates
- **Filtering** - By scope level, property type, search
- **Database Backed** - RLS-protected with user/system template separation

### Excel Export
- **4 Export Templates**:
  - Budget Detail (full three-column breakdown with categories)
  - Project Summary (financials, metrics, category totals)
  - Vendor List (project vendors + full directory)
  - Draw Schedule (draws by milestone and vendor)
- **Multi-Sheet Workbooks** - Each export type includes relevant summary sheets
- **Formatted Data** - Currency values, dates, and structured headers
- **xlsx Library** - SheetJS for robust Excel file generation

---

## 🚧 Future Enhancements

### Medium Priority
- [ ] Offline support (PWA)

### Low Priority
- [ ] Multi-user collaboration (real-time editing)
- [ ] Mobile app (React Native)
- [ ] AI-powered cost estimation

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
| `use-auth.ts` | Authentication state |
| `use-realtime.ts` | Real-time subscriptions |
| `use-journal.ts` | Journal CRUD |
| `use-calculation-settings.ts` | Calculation settings persistence |
| `use-budget-templates.ts` | Template CRUD, save/apply templates |

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
| `rich-text-editor.tsx` | TipTap journal editor |
| `export-dialog.tsx` | PDF export selector |
| `template-card.tsx` | Template library card |
| `save-as-template-sheet.tsx` | Save project as template |
| `apply-template-sheet.tsx` | Apply template to project |
| `excel-export-dialog.tsx` | Excel export selector |

### Pages
| Route | Purpose |
|-------|---------|
| `/` | Home dashboard |
| `/projects` | Projects list |
| `/projects/[id]` | Project detail with tabs |
| `/projects/new` | Create project |
| `/pipeline` | Kanban view |
| `/timeline` | Gantt view |
| `/journal` | Notes list |
| `/journal/[id]` | Note editor |
| `/templates` | Template library |
| `/templates/[id]` | Template preview |
| `/settings/calculations` | Calculation settings |
| `/auth/login` | Sign in |
| `/auth/signup` | Sign up |

### Database
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Main schema |
| `supabase/migrations/` | Schema changes |
| `supabase/seed.sql` | Cost reference data |

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
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |

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

### Sprint 5 ✅ - Exports & Auth
- PDF generation (6 templates)
- Authentication (Supabase Auth)
- Protected routes

### Sprint 6 ✅ - Journal & Settings
- Journal/notes system
- Calculation settings
- Real-time updates

### Sprint 7 ✅ - Budget Templates
- Template library page
- Save as template flow
- Apply template flow
- 4 system templates
- Conflict resolution (skip/merge/replace)

### Sprint 8 ✅ - Excel Export
- Excel export dialog
- 4 export templates (Budget, Summary, Vendors, Draws)
- Multi-sheet workbooks
- xlsx (SheetJS) integration
