'use client';

import { useState } from 'react';
import {
  IconFileTypePdf,
  IconReportAnalytics,
  IconListDetails,
  IconReceipt2,
  IconUsers,
  IconChartPie,
  IconPhotoStar,
  IconLoader2,
  IconDownload,
  IconEye,
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
import { getSupabaseClient } from '@/lib/supabase/client';
import { compileToPdf, previewPdf, downloadPdf } from '@/lib/pdf/compile';
import {
  ExecutiveSummaryReport,
  DetailedBudgetReport,
  DrawScheduleReport,
  VendorSummaryReport,
  InvestmentAnalysisReport,
  PropertyShowcaseReport,
  type PhotoWithUrl,
} from '@/lib/pdf/templates';
import type { ProjectSummary, BudgetItem, Draw, Vendor, LineItemPhoto } from '@/types';

interface ExportDialogProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  draws: Draw[];
  vendors: Vendor[];
  trigger?: React.ReactNode;
}

type ReportType = 'executive-summary' | 'detailed-budget' | 'draw-schedule' | 'vendor-summary' | 'investment-analysis' | 'property-showcase';

interface ReportOption {
  id: ReportType;
  name: string;
  description: string;
  icon: React.ReactNode;
  audience: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'property-showcase',
    name: 'Property Showcase',
    description: 'Marketing-ready before/after transformation with photos and financials',
    icon: <IconPhotoStar className="h-6 w-6" />,
    audience: 'Marketing, Listings, Investors',
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'One-page overview with key metrics, ROI, and budget summary',
    icon: <IconReportAnalytics className="h-6 w-6" />,
    audience: 'Investors, Leadership',
  },
  {
    id: 'investment-analysis',
    name: 'Investment Analysis',
    description: 'MAO calculations, profit projections, and risk assessment',
    icon: <IconChartPie className="h-6 w-6" />,
    audience: 'Investors, Acquisition Team',
  },
  {
    id: 'detailed-budget',
    name: 'Detailed Budget',
    description: 'Full breakdown of all categories and line items with variances',
    icon: <IconListDetails className="h-6 w-6" />,
    audience: 'Project Managers, Contractors',
  },
  {
    id: 'vendor-summary',
    name: 'Vendor Summary',
    description: 'Vendor assignments, payments, and contact details by trade',
    icon: <IconUsers className="h-6 w-6" />,
    audience: 'Project Managers, Accounting',
  },
  {
    id: 'draw-schedule',
    name: 'Draw Schedule',
    description: 'Payment milestones, funding progress, and draw status',
    icon: <IconReceipt2 className="h-6 w-6" />,
    audience: 'Lenders, Banks',
  },
];

export function ExportDialog({
  project,
  budgetItems,
  draws,
  vendors,
  trigger,
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportType>('property-showcase');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch photos with signed URLs for the showcase report
  const fetchPhotosWithUrls = async (): Promise<PhotoWithUrl[]> => {
    const supabase = getSupabaseClient();

    // Fetch all photos for this project
    const { data: photos, error } = await supabase
      .from('line_item_photos')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (error || !photos) {
      console.error('Error fetching photos:', error);
      return [];
    }

    // Get signed URLs for each photo
    const photosWithUrls: PhotoWithUrl[] = await Promise.all(
      photos.map(async (photo: LineItemPhoto) => {
        const { data } = await supabase.storage
          .from('project-photos')
          .createSignedUrl(photo.storage_path, 3600); // 1 hour expiry

        return {
          ...photo,
          signedUrl: data?.signedUrl || null,
        };
      })
    );

    return photosWithUrls;
  };

  const generateReport = async (action: 'preview' | 'download') => {
    setIsGenerating(true);

    try {
      let component: React.ReactElement;

      switch (selectedReport) {
        case 'property-showcase': {
          // Fetch photos with signed URLs
          const photos = await fetchPhotosWithUrls();
          component = (
            <PropertyShowcaseReport
              project={project}
              budgetItems={budgetItems}
              photos={photos}
            />
          );
          break;
        }
        case 'executive-summary':
          component = (
            <ExecutiveSummaryReport
              project={project}
              budgetItems={budgetItems}
              draws={draws}
              vendors={vendors}
            />
          );
          break;
        case 'investment-analysis':
          component = (
            <InvestmentAnalysisReport
              project={project}
              budgetItems={budgetItems}
            />
          );
          break;
        case 'detailed-budget':
          component = (
            <DetailedBudgetReport
              project={project}
              budgetItems={budgetItems}
              vendors={vendors}
            />
          );
          break;
        case 'vendor-summary':
          component = (
            <VendorSummaryReport
              project={project}
              budgetItems={budgetItems}
              draws={draws}
              vendors={vendors}
            />
          );
          break;
        case 'draw-schedule':
          component = (
            <DrawScheduleReport
              project={project}
              draws={draws}
              vendors={vendors}
            />
          );
          break;
        default:
          throw new Error('Unknown report type');
      }

      const html = await compileToPdf(component);
      const reportName = REPORT_OPTIONS.find((r) => r.id === selectedReport)?.name || 'Report';
      const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${reportName.replace(/\s+/g, '_')}`;

      if (action === 'preview') {
        previewPdf(html, `${project.name} - ${reportName}`);
      } else {
        downloadPdf(html, filename);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <IconFileTypePdf className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Select a report template to generate for {project.name}
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
                    Best for: {report.audience}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => generateReport('preview')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconEye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button
            onClick={() => generateReport('download')}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconDownload className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
