'use client';

import { useState } from 'react';
import {
  IconFileSpreadsheet,
  IconListDetails,
  IconReportAnalytics,
  IconUsers,
  IconReceipt2,
  IconLoader2,
  IconDownload,
} from '@tabler/icons-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  exportBudgetToExcel,
  exportProjectSummaryToExcel,
  exportVendorsToExcel,
  exportDrawsToExcel,
} from '@/lib/excel';
import type { ProjectSummary, BudgetItem, Draw, Vendor } from '@/types';

interface ExcelExportDialogProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  draws: Draw[];
  vendors: Vendor[];
  trigger?: React.ReactNode;
}

type ReportType = 'budget-detail' | 'project-summary' | 'vendor-list' | 'draw-schedule';

interface ReportOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  sheets: string[];
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'budget-detail',
    name: 'Budget Detail',
    description: 'Full three-column breakdown with categories, line items, and variances',
    icon: <IconListDetails className="h-6 w-6" />,
    sheets: ['Budget Detail'],
  },
  {
    id: 'project-summary',
    name: 'Project Summary',
    description: 'Property details, financials, investment metrics, and category totals',
    icon: <IconReportAnalytics className="h-6 w-6" />,
    sheets: ['Summary', 'Budget by Category'],
  },
  {
    id: 'vendor-list',
    name: 'Vendor List',
    description: 'Project vendors with payments, plus full vendor directory',
    icon: <IconUsers className="h-6 w-6" />,
    sheets: ['Project Vendors', 'Full Directory'],
  },
  {
    id: 'draw-schedule',
    name: 'Draw Schedule',
    description: 'Payment draws with milestone tracking and vendor summaries',
    icon: <IconReceipt2 className="h-6 w-6" />,
    sheets: ['Draw Schedule', 'By Vendor', 'By Milestone'],
  },
];

export function ExcelExportDialog({
  project,
  budgetItems,
  draws,
  vendors,
  trigger,
}: ExcelExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('budget-detail');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);

    try {
      switch (selectedReport) {
        case 'budget-detail':
          exportBudgetToExcel({ project, budgetItems, vendors });
          break;
        case 'project-summary':
          exportProjectSummaryToExcel({ project, budgetItems });
          break;
        case 'vendor-list':
          exportVendorsToExcel({ project, vendors, budgetItems, draws });
          break;
        case 'draw-schedule':
          exportDrawsToExcel({ project, draws, vendors });
          break;
      }

      // Close dialog after successful export
      setOpen(false);
    } catch (error) {
      console.error('Error generating Excel file:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedOption = REPORT_OPTIONS.find((r) => r.id === selectedReport);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <IconFileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export to Excel</DialogTitle>
          <DialogDescription>
            Select a report to export for {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 overflow-y-auto flex-1">
          {REPORT_OPTIONS.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedReport(report.id)}
              className={cn(
                'w-full text-left p-4 rounded-lg border-2 transition-colors',
                selectedReport === report.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    selectedReport === report.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {report.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-muted-foreground">{report.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Sheets: {report.sheets.join(', ')}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconDownload className="h-4 w-4 mr-2" />
            )}
            Download Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
