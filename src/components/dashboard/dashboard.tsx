'use client';

import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { DashboardHeader } from './dashboard-header';
import { PortfolioHealth } from './portfolio-health';
import { AttentionNeeded } from './alerts/attention-needed';
import { KanbanBoard } from './pipeline/kanban-board';
import { ProjectTimeline } from './timeline/project-timeline';
import { FinancialPerformance } from './analytics/financial-performance';
import { BudgetInsights } from './budget/budget-insights';

/**
 * Main Dashboard Component
 * Orchestrates all dashboard sections based on current view
 */
export function Dashboard() {
  const { currentView } = useDashboardStore();

  return (
    <div className="space-y-8">
      {/* Header with view toggle and actions */}
      <DashboardHeader />

      {/* Portfolio Health - Always visible */}
      <PortfolioHealth />

      {/* Attention Needed - Always visible */}
      <AttentionNeeded />

      {/* Pipeline/Timeline - Depends on view */}
      {currentView === 'gantt' ? <ProjectTimeline /> : <KanbanBoard />}

      {/* Financial Performance */}
      <FinancialPerformance />

      {/* Budget Insights */}
      <BudgetInsights />
    </div>
  );
}
