# Dashboard & Analytics Implementation Plan

## Overview

This plan implements the multi-project dashboard as specified in `docs/DASHBOARD_PLAN.md`. The dashboard replaces the current home page and provides portfolio health visualization, risk alerts, Kanban pipeline, Gantt timeline, and financial analytics.

**Estimated Scope**: ~30+ files across 6 phases

---

## Phase 1: Infrastructure & Core Dashboard (Foundation)

### Step 1.1: Install Required Dependencies

```bash
npm install framer-motion recharts
npx shadcn@latest add badge tooltip dialog select progress separator scroll-area
```

**Files Modified**:
- `package.json`

### Step 1.2: Create Database Views

Add new views to Supabase for aggregated portfolio data:

**File**: `supabase/migrations/003_portfolio_views.sql`

```sql
-- Portfolio summary view (aggregated metrics across all projects)
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  user_id,
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE status NOT IN ('sold', 'dead')) as active_projects,
  COUNT(*) FILTER (WHERE status = 'lead') as lead_count,
  COUNT(*) FILTER (WHERE status = 'analyzing') as analyzing_count,
  COUNT(*) FILTER (WHERE status = 'under_contract') as under_contract_count,
  COUNT(*) FILTER (WHERE status = 'in_rehab') as in_rehab_count,
  COUNT(*) FILTER (WHERE status = 'listed') as listed_count,
  COUNT(*) FILTER (WHERE status = 'sold') as sold_count,

  -- Financial aggregates
  COALESCE(SUM(arv) FILTER (WHERE status NOT IN ('sold', 'dead')), 0) as total_arv,
  COALESCE(SUM(total_investment) FILTER (WHERE status NOT IN ('sold', 'dead')), 0) as capital_deployed,
  COALESCE(SUM(gross_profit) FILTER (WHERE status = 'sold'), 0) as total_profit,
  COALESCE(AVG(roi) FILTER (WHERE status = 'sold'), 0) as avg_roi,

  -- Budget aggregates
  COALESCE(SUM(rehab_budget), 0) as total_budget,
  COALESCE(SUM(rehab_actual), 0) as total_actual,

  -- Risk indicators
  COUNT(*) FILTER (WHERE rehab_actual > rehab_budget AND status = 'in_rehab') as over_budget_count,
  COUNT(*) FILTER (WHERE target_complete_date < NOW() AND status = 'in_rehab') as behind_schedule_count
FROM project_summary
GROUP BY user_id;

-- Category totals view (budget breakdown by category)
CREATE OR REPLACE VIEW category_totals AS
SELECT
  p.user_id,
  bi.category,
  COALESCE(SUM(bi.underwriting_amount), 0) as total_underwriting,
  COALESCE(SUM(bi.forecast_amount), 0) as total_forecast,
  COALESCE(SUM(bi.actual_amount), 0) as total_actual,
  COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) as total_budget,
  COALESCE(SUM(bi.actual_amount) - SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) as variance,
  COUNT(*) as item_count
FROM budget_items bi
JOIN projects p ON bi.project_id = p.id
WHERE p.status NOT IN ('sold', 'dead')
GROUP BY p.user_id, bi.category
ORDER BY total_actual DESC;

-- Projects with risk indicators
CREATE OR REPLACE VIEW projects_with_risks AS
SELECT
  ps.*,
  CASE WHEN rehab_actual > rehab_budget THEN true ELSE false END as is_over_budget,
  CASE WHEN target_complete_date < NOW() AND status = 'in_rehab' THEN true ELSE false END as is_behind_schedule,
  CASE WHEN roi < 10 THEN true ELSE false END as is_low_roi,
  COALESCE(rehab_actual - rehab_budget, 0) as budget_variance,
  CASE
    WHEN target_complete_date IS NOT NULL
    THEN EXTRACT(DAY FROM NOW() - target_complete_date)::integer
    ELSE 0
  END as days_overdue
FROM project_summary ps;
```

### Step 1.3: Add TypeScript Types for Dashboard

**File**: `src/types/dashboard.ts`

```typescript
// Portfolio summary type (from portfolio_summary view)
export interface PortfolioSummary {
  user_id: string | null;
  total_projects: number;
  active_projects: number;
  lead_count: number;
  analyzing_count: number;
  under_contract_count: number;
  in_rehab_count: number;
  listed_count: number;
  sold_count: number;
  total_arv: number;
  capital_deployed: number;
  total_profit: number;
  avg_roi: number;
  total_budget: number;
  total_actual: number;
  over_budget_count: number;
  behind_schedule_count: number;
}

// Category totals type
export interface CategoryTotal {
  user_id: string | null;
  category: BudgetCategory;
  total_underwriting: number;
  total_forecast: number;
  total_actual: number;
  total_budget: number;
  variance: number;
  item_count: number;
}

// Project with risk indicators
export interface ProjectWithRisks extends ProjectSummary {
  is_over_budget: boolean;
  is_behind_schedule: boolean;
  is_low_roi: boolean;
  budget_variance: number;
  days_overdue: number;
}

// Kanban column structure
export interface KanbanColumn {
  id: ProjectStatus;
  title: string;
  projects: ProjectSummary[];
}

// Timeline event for Gantt chart
export interface TimelineEvent {
  id: string;
  projectId: string;
  title: string;
  type: 'acquisition' | 'rehab' | 'sale';
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  status: ProjectStatus;
  isCompleted: boolean;
  dependencies: string[];
  financials: {
    arv: number;
    budget: number;
    actual: number;
    roi: number;
  };
}

// Dashboard filter state
export interface DashboardFilters {
  dateRange: 'all' | 'ytd' | 'quarter' | 'month';
  statusFilter: ProjectStatus | 'all';
  minROI: number | null;
  maxROI: number | null;
  city: string | null;
}

// Dashboard view mode
export type DashboardView = 'kanban' | 'gantt' | 'grid';
```

### Step 1.4: Create Dashboard React Query Hooks

**File**: `src/hooks/use-dashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { PortfolioSummary, CategoryTotal, ProjectWithRisks } from '@/types/dashboard';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  portfolio: () => [...dashboardKeys.all, 'portfolio'] as const,
  categories: () => [...dashboardKeys.all, 'categories'] as const,
  riskyProjects: () => [...dashboardKeys.all, 'risky-projects'] as const,
  projectsByStatus: () => [...dashboardKeys.all, 'by-status'] as const,
};

// Hook for portfolio-level summary
export function usePortfolioSummary() {
  return useQuery({
    queryKey: dashboardKeys.portfolio(),
    queryFn: async (): Promise<PortfolioSummary> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('portfolio_summary')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });
}

// Hook for category breakdown
export function useCategoryTotals() {
  return useQuery({
    queryKey: dashboardKeys.categories(),
    queryFn: async (): Promise<CategoryTotal[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('category_totals')
        .select('*')
        .order('total_actual', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// Hook for projects needing attention
export function useRiskyProjects() {
  return useQuery({
    queryKey: dashboardKeys.riskyProjects(),
    queryFn: async (): Promise<ProjectWithRisks[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects_with_risks')
        .select('*')
        .or('is_over_budget.eq.true,is_behind_schedule.eq.true,is_low_roi.eq.true');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// Hook for projects grouped by status (for Kanban)
export function useProjectsByStatus() {
  return useQuery({
    queryKey: dashboardKeys.projectsByStatus(),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .not('status', 'eq', 'dead')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}
```

### Step 1.5: Create Dashboard Zustand Store

**File**: `src/lib/stores/dashboard-store.ts`

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { DashboardFilters, DashboardView } from '@/types/dashboard';

interface DashboardState {
  // View state
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;

  // Filters
  filters: DashboardFilters;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;

  // UI state
  expandedSections: Set<string>;
  toggleSection: (sectionId: string) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: 'all',
  statusFilter: 'all',
  minROI: null,
  maxROI: null,
  city: null,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      currentView: 'kanban',
      setCurrentView: (view) => set({ currentView: view }),

      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      expandedSections: new Set(['portfolio-health', 'pipeline']),
      toggleSection: (sectionId) =>
        set((state) => {
          const newSet = new Set(state.expandedSections);
          if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
          } else {
            newSet.add(sectionId);
          }
          return { expandedSections: newSet };
        }),

      isCommandPaletteOpen: false,
      openCommandPalette: () => set({ isCommandPaletteOpen: true }),
      closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
    }),
    { name: 'dashboard-store' }
  )
);
```

### Step 1.6: Create Dashboard Component Structure

**Files to Create**:
```
src/components/dashboard/
├── index.ts                      # Barrel exports
├── dashboard.tsx                 # Main dashboard container
├── portfolio-health.tsx          # Hero metrics (4 cards)
├── portfolio-health-skeleton.tsx # Loading state
└── stat-card.tsx                 # Reusable metric card
```

### Step 1.7: Implement Portfolio Health Component

**File**: `src/components/dashboard/portfolio-health.tsx`

Key features:
- 4-column grid with hero metrics (Total ARV, Capital Deployed, Avg ROI, Active Projects)
- Animated number transitions using framer-motion
- Responsive layout (4→2→1 columns)
- Color-coded indicators

### Step 1.8: Update Home Page

**File**: `src/app/page.tsx`

Replace current projects list with new Dashboard component. Move projects list to `/projects` route.

---

## Phase 2: Kanban Pipeline (Interactive Project Flow)

### Step 2.1: Create Kanban Components

**Files to Create**:
```
src/components/dashboard/pipeline/
├── kanban-board.tsx              # Main board container
├── kanban-column.tsx             # Status column with header
├── project-card.tsx              # Draggable project card
├── kanban-skeleton.tsx           # Loading state
└── kanban-filters.tsx            # Search, filter, sort controls
```

### Step 2.2: Implement Drag-and-Drop

Using framer-motion for drag-and-drop:
- `motion.div` with drag constraints
- `AnimatePresence` for card enter/exit
- Optimistic status updates via React Query mutations
- Visual feedback during drag (elevation, opacity)

### Step 2.3: Project Card Variants

Card content varies by status column:
- **Lead/Analyzing**: ARV, MAO, Projected ROI
- **Under Contract**: Close Date, ARV, ROI
- **In Rehab**: Progress bar, schedule status, ROI
- **Listed**: List Price, Days on Market, showings

### Step 2.4: Add Status Update Mutation

**File**: `src/hooks/use-dashboard.ts` (extend)

```typescript
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string; newStatus: ProjectStatus }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
    },
    onMutate: async ({ projectId, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dashboardKeys.projectsByStatus() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueryData(dashboardKeys.projectsByStatus());

      // Optimistically update
      queryClient.setQueryData(dashboardKeys.projectsByStatus(), (old: ProjectSummary[]) =>
        old.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
      );

      return { previousProjects };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(dashboardKeys.projectsByStatus(), context?.previousProjects);
      toast.error("Couldn't update status. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
```

### Step 2.5: Search and Filter Implementation

- Debounced search across project name, address, city
- Filter by ROI range, property type
- Sort by ARV, ROI, date added

---

## Phase 3: Attention Needed (Risk Alerts)

### Step 3.1: Create Alert Components

**Files to Create**:
```
src/components/dashboard/alerts/
├── attention-needed.tsx          # Main alerts section
├── alert-card.tsx                # Individual alert item
├── alert-category.tsx            # Grouped alerts (over budget, behind schedule)
└── empty-alerts.tsx              # "All clear" state
```

### Step 3.2: Alert Categories

1. **Over Budget**: Projects where `rehab_actual > rehab_budget`
   - Show project name, variance amount, top category overage

2. **Behind Schedule**: Projects where `target_complete_date < NOW()` and `status = 'in_rehab'`
   - Show project name, days overdue, target date

3. **Low ROI**: Projects where `roi < 10%` (configurable threshold)
   - Show project name, current ROI, target ROI

4. **Contingency Burned**: Projects where contingency usage > 50%
   - Show project name, percentage used, remaining amount

### Step 3.3: Alert Severity Levels

- **Critical (Red)**: >10% over budget, >14 days overdue, ROI < 5%
- **Warning (Yellow)**: 1-10% over budget, 1-14 days overdue, ROI 5-10%
- **Info (Blue)**: Items approaching thresholds

### Step 3.4: Collapsible Behavior

- Section collapses/hides when no alerts exist
- "All clear!" message when everything is on track
- Click-to-navigate to project detail

---

## Phase 4: Gantt Timeline (Project Visualization)

### Step 4.1: Create Timeline Components

**Files to Create**:
```
src/components/dashboard/timeline/
├── project-timeline.tsx          # Main Gantt container
├── timeline-row.tsx              # Single project row
├── timeline-bar.tsx              # Duration bar with progress
├── timeline-header.tsx           # Date scale header
├── timeline-controls.tsx         # Zoom, filter controls
├── timeline-milestone.tsx        # Milestone markers
└── timeline-today-marker.tsx     # Current date line
```

### Step 4.2: Timeline Data Transformation

**File**: `src/lib/timeline-utils.ts`

```typescript
export function projectToTimelineEvents(project: ProjectSummary): TimelineEvent[] {
  return [
    {
      id: `${project.id}-acquisition`,
      projectId: project.id,
      title: project.name,
      type: 'acquisition',
      startDate: project.contract_date ? new Date(project.contract_date) : null,
      endDate: project.close_date ? new Date(project.close_date) : null,
      isCompleted: !!project.close_date && new Date(project.close_date) < new Date(),
      progress: project.close_date ? 100 : 0,
      status: project.status,
      dependencies: [],
      financials: {
        arv: project.arv,
        budget: project.rehab_budget,
        actual: project.rehab_actual,
        roi: project.roi,
      },
    },
    {
      id: `${project.id}-rehab`,
      projectId: project.id,
      title: project.name,
      type: 'rehab',
      startDate: project.close_date ? new Date(project.close_date) : null,
      endDate: project.target_complete_date ? new Date(project.target_complete_date) : null,
      isCompleted: project.status === 'listed' || project.status === 'sold',
      progress: calculateRehabProgress(project),
      status: project.status,
      dependencies: [`${project.id}-acquisition`],
      financials: { /* ... */ },
    },
    {
      id: `${project.id}-sale`,
      projectId: project.id,
      title: project.name,
      type: 'sale',
      startDate: project.list_date ? new Date(project.list_date) : null,
      endDate: project.sale_date ? new Date(project.sale_date) : null,
      isCompleted: project.status === 'sold',
      progress: project.status === 'sold' ? 100 : 0,
      status: project.status,
      dependencies: [`${project.id}-rehab`],
      financials: { /* ... */ },
    },
  ].filter(event => event.startDate !== null);
}
```

### Step 4.3: Timeline Features

- **Zoom controls**: 0.5x, 1x, 2x time scales
- **Today marker**: Vertical line showing current date
- **Color by status**: Green (completed), Blue (in progress), Gray (planned)
- **Dependency lines**: Show acquisition → rehab → sale flow
- **Click to expand**: Opens project detail dialog
- **Responsive**: Horizontal scroll on smaller screens

### Step 4.4: Add View Toggle

Add toggle between Kanban and Gantt views in dashboard header.

---

## Phase 5: Financial Analytics (Charts & Metrics)

### Step 5.1: Create Analytics Components

**Files to Create**:
```
src/components/dashboard/analytics/
├── financial-performance.tsx     # Main analytics section
├── roi-distribution-chart.tsx    # ROI histogram using Recharts
├── profit-by-project.tsx         # Horizontal bar chart
├── performance-summary.tsx       # Gross profit, avg ROI, sold count
├── time-period-filter.tsx        # YTD, Quarter, Month filter
└── animated-number.tsx           # Smooth number transitions
```

### Step 5.2: ROI Distribution Chart

Using Recharts `BarChart`:
- X-axis: ROI ranges (< 10%, 10-15%, 15-20%, > 20%)
- Y-axis: Project count
- Color-coded bars (red < 10%, yellow 10-15%, green 15%+)
- Target line at 15%

### Step 5.3: Profit by Project Chart

Horizontal bar chart showing:
- Top 5 projects by gross profit
- Color intensity based on ROI
- Click to navigate to project

### Step 5.4: Performance Summary Cards

- Gross Profit (YTD)
- Projects Sold
- Average ROI
- Average Hold Time

### Step 5.5: Time Period Filtering

- Date range selector (All, YTD, This Quarter, This Month)
- Filters affect all analytics components
- Persist selection in dashboard store

---

## Phase 6: Budget Intelligence

### Step 6.1: Create Budget Insight Components

**Files to Create**:
```
src/components/dashboard/budget/
├── budget-insights.tsx           # Main budget section
├── category-breakdown.tsx        # Top categories table
├── budget-health.tsx             # Overall budget vs actual
├── cost-benchmarking.tsx         # Compare to Minneapolis data
├── variance-indicator.tsx        # Visual variance display
└── category-progress-bar.tsx     # Budget utilization bar
```

### Step 6.2: Category Breakdown Table

- Category name
- Total Budget
- Total Actual
- Variance (amount and percentage)
- Visual indicator (green under, red over)
- Expandable to show per-project breakdown

### Step 6.3: Budget Health Overview

- Total Portfolio Budget
- Total Actual Spend
- Overall Variance
- Progress bar visualization

### Step 6.4: Cost Benchmarking

Compare user's average $/sqft against Minneapolis metro data from `cost_reference` table:
- Your Avg $/sqft
- Market Avg $/sqft
- Savings percentage

---

## Phase 7: Polish & UX Enhancements

### Step 7.1: Loading States

- Skeleton loaders for each section
- Shimmer animation (gradient sweep)
- Staggered reveal as data loads

### Step 7.2: Empty States

- No projects: CTA to add first project
- No alerts: "All clear" message
- No sold projects: Encouraging message about pipeline

### Step 7.3: Animations

- Hero metrics count up on load
- Cards animate in with stagger
- View transitions (Kanban ↔ Gantt) with crossfade
- Progress bars animate from 0 to actual value

### Step 7.4: Keyboard Navigation

- `N`: New project
- `G`: Toggle Gantt view
- `K`: Toggle Kanban view
- `/`: Focus search
- `Cmd+K`: Command palette
- `Esc`: Close modals

### Step 7.5: Command Palette

**File**: `src/components/dashboard/command-palette.tsx`

- Quick search across projects
- Quick actions (Add project, Export, Settings)
- View switching
- Recent projects

### Step 7.6: Accessibility

- ARIA labels for all interactive elements
- Focus management in modals
- Screen reader announcements for updates
- Reduced motion support
- Keyboard-only navigation

### Step 7.7: Responsive Design

- Desktop: Full 4-column layout
- Tablet: 2-column, stacked sections
- Mobile: Single column, swipeable Kanban

---

## File Summary

### New Files (~35 files)

```
supabase/migrations/
└── 003_portfolio_views.sql

src/types/
└── dashboard.ts

src/hooks/
└── use-dashboard.ts

src/lib/
├── stores/dashboard-store.ts
├── timeline-utils.ts
└── kanban-utils.ts

src/components/dashboard/
├── index.ts
├── dashboard.tsx
├── portfolio-health.tsx
├── portfolio-health-skeleton.tsx
├── stat-card.tsx
├── animated-number.tsx
├── command-palette.tsx
├── view-toggle.tsx
│
├── pipeline/
│   ├── kanban-board.tsx
│   ├── kanban-column.tsx
│   ├── project-card.tsx
│   ├── kanban-skeleton.tsx
│   └── kanban-filters.tsx
│
├── alerts/
│   ├── attention-needed.tsx
│   ├── alert-card.tsx
│   ├── alert-category.tsx
│   └── empty-alerts.tsx
│
├── timeline/
│   ├── project-timeline.tsx
│   ├── timeline-row.tsx
│   ├── timeline-bar.tsx
│   ├── timeline-header.tsx
│   ├── timeline-controls.tsx
│   ├── timeline-milestone.tsx
│   └── timeline-today-marker.tsx
│
├── analytics/
│   ├── financial-performance.tsx
│   ├── roi-distribution-chart.tsx
│   ├── profit-by-project.tsx
│   ├── performance-summary.tsx
│   └── time-period-filter.tsx
│
└── budget/
    ├── budget-insights.tsx
    ├── category-breakdown.tsx
    ├── budget-health.tsx
    ├── cost-benchmarking.tsx
    ├── variance-indicator.tsx
    └── category-progress-bar.tsx

src/app/
├── page.tsx (modified - new dashboard)
└── projects/
    └── page.tsx (new - projects list)
```

### Modified Files (~5 files)

- `package.json`: Add framer-motion, recharts
- `src/types/index.ts`: Export dashboard types
- `src/app/page.tsx`: Replace with dashboard
- `src/app/layout.tsx`: Add keyboard shortcut handlers
- `src/lib/store.ts`: Import dashboard store

---

## Implementation Order

| Phase | Focus | Dependencies |
|-------|-------|--------------|
| 1 | Infrastructure + Portfolio Health | None |
| 2 | Kanban Pipeline | Phase 1 |
| 3 | Risk Alerts | Phase 1 |
| 4 | Gantt Timeline | Phase 1 |
| 5 | Financial Analytics | Phase 1 |
| 6 | Budget Intelligence | Phase 1 |
| 7 | Polish & UX | All phases |

Phases 2-6 can be developed in parallel after Phase 1 is complete.

---

## Testing Strategy

1. **Unit Tests**: Utility functions, calculations
2. **Component Tests**: Each dashboard section in isolation
3. **Integration Tests**: Data fetching, mutations
4. **E2E Tests**: Full dashboard interactions
5. **Visual Regression**: Storybook snapshots

---

## Success Criteria

From DASHBOARD_PLAN.md:
1. ✅ Assess portfolio health in < 5 seconds
2. ✅ Identify projects needing attention immediately
3. ✅ Understand where money is made/lost
4. ✅ Navigate to any project in ≤ 2 clicks
5. ✅ Trust the numbers (match project details)

### Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Zero layout shifts after initial render
- All interactions respond < 100ms
- Lighthouse Accessibility > 95
