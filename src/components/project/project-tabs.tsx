'use client';

import { useState } from 'react';
import type { Project, BudgetItem, Vendor, Draw, CostReference, ProjectSummary } from '@/types';
import { DealSummaryTab } from './tabs/deal-summary-tab';
import { BudgetDetailTab } from './tabs/budget-detail-tab';
import { VendorsTab } from './tabs/vendors-tab';
import { DrawsTab } from './tabs/draws-tab';
import { CostReferenceTab } from './tabs/cost-reference-tab';
import { ExportDialog } from '@/components/pdf/export-dialog';
import {
  IconReportMoney,
  IconListDetails,
  IconUsers,
  IconCash,
  IconBook,
  IconFileTypePdf,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectTabsProps {
  project: Project;
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  draws: Draw[];
  costReference: CostReference[];
}

type TabId = 'summary' | 'budget' | 'vendors' | 'draws' | 'costs';

const TABS: { id: TabId; label: string; icon: typeof IconReportMoney }[] = [
  { id: 'summary', label: 'Deal Summary', icon: IconReportMoney },
  { id: 'budget', label: 'Budget Detail', icon: IconListDetails },
  { id: 'vendors', label: 'Vendors', icon: IconUsers },
  { id: 'draws', label: 'Draws', icon: IconCash },
  { id: 'costs', label: 'Cost Reference', icon: IconBook },
];

export function ProjectTabs({
  project,
  budgetItems,
  vendors,
  draws,
  costReference,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  // Calculate budget totals (using forecast if available, otherwise underwriting)
  const totalUnderwriting = budgetItems.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);
  const totalForecast = budgetItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalBudget = totalForecast > 0 ? totalForecast : totalUnderwriting;
  const contingencyAmount = totalBudget * (project.contingency_percent / 100);
  const totalBudgetWithContingency = totalBudget + contingencyAmount;

  // Construct ProjectSummary for PDF export
  const holdingCostsTotal = project.holding_costs_monthly * project.hold_months;
  const sellingCosts = (project.arv || 0) * (project.selling_cost_percent / 100);
  const totalInvestment = (project.purchase_price || 0) + project.closing_costs + holdingCostsTotal + totalBudgetWithContingency;
  const grossProfit = (project.arv || 0) - sellingCosts - totalInvestment;
  const mao = (project.arv || 0) - sellingCosts - holdingCostsTotal - totalBudgetWithContingency - grossProfit;

  const projectSummary: ProjectSummary = {
    ...project,
    underwriting_total: totalUnderwriting,
    forecast_total: totalForecast,
    actual_total: totalActual,
    rehab_budget: totalBudget,
    rehab_actual: totalActual,
    contingency_amount: contingencyAmount,
    rehab_budget_with_contingency: totalBudgetWithContingency,
    selling_costs: sellingCosts,
    holding_costs_total: holdingCostsTotal,
    total_investment: totalInvestment,
    gross_profit: grossProfit,
    mao: mao,
    total_items: budgetItems.length,
    completed_items: budgetItems.filter((item) => item.status === 'complete').length,
    in_progress_items: budgetItems.filter((item) => item.status === 'in_progress').length,
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <div className="flex items-center justify-between">
          <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
          </nav>

          {/* Export Button */}
          <div className="mb-px">
            <ExportDialog
              project={projectSummary}
              budgetItems={budgetItems}
              draws={draws}
              vendors={vendors}
              trigger={
                <Button variant="outline" size="sm">
                  <IconFileTypePdf className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary' && (
          <DealSummaryTab
            project={project}
            totalBudget={totalBudgetWithContingency}
            totalActual={totalActual}
          />
        )}
        
        {activeTab === 'budget' && (
          <BudgetDetailTab
            projectId={project.id}
            budgetItems={budgetItems}
            vendors={vendors}
            contingencyPercent={project.contingency_percent}
            vendors={vendors}
          />
        )}
        
        {activeTab === 'vendors' && (
          <VendorsTab
            projectId={project.id}
            vendors={vendors}
            budgetItems={budgetItems}
          />
        )}
        
        {activeTab === 'draws' && (
          <DrawsTab
            projectId={project.id}
            draws={draws}
            vendors={vendors}
            totalBudget={totalBudgetWithContingency}
          />
        )}
        
        {activeTab === 'costs' && (
          <CostReferenceTab costReference={costReference} />
        )}
      </div>
    </div>
  );
}
