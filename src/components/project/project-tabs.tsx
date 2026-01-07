'use client';

import { useState } from 'react';
import type { Project, BudgetItem, Vendor, Draw, CostReference } from '@/types';
import { DealSummaryTab } from './tabs/deal-summary-tab';
import { BudgetDetailTab } from './tabs/budget-detail-tab';
import { VendorsTab } from './tabs/vendors-tab';
import { DrawsTab } from './tabs/draws-tab';
import { CostReferenceTab } from './tabs/cost-reference-tab';
import { 
  IconReportMoney, 
  IconListDetails, 
  IconUsers, 
  IconCash, 
  IconBook 
} from '@tabler/icons-react';
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

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b mb-6">
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
