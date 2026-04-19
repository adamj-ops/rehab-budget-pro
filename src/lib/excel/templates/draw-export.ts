/**
 * Draw Schedule Excel Export
 *
 * Exports payment draws with milestones and status tracking.
 */

import type { ProjectSummary, Draw, Vendor } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import {
  createWorkbook,
  downloadWorkbook,
  formatCurrencyValue,
  formatDateValue,
  type WorksheetConfig,
  type WorksheetData,
} from '../index';

interface DrawExportOptions {
  project: ProjectSummary;
  draws: Draw[];
  vendors: Vendor[];
}

// Milestone labels
const MILESTONE_LABELS: Record<string, string> = {
  project_start: 'Project Start',
  demo_complete: 'Demo Complete',
  rough_in: 'Rough-In',
  drywall: 'Drywall',
  finishes: 'Finishes',
  final: 'Final',
};

// Status labels
const DRAW_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
};

// Payment method labels
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  check: 'Check',
  zelle: 'Zelle',
  venmo: 'Venmo',
  wire: 'Wire Transfer',
  cash: 'Cash',
  credit_card: 'Credit Card',
  other: 'Other',
};

/**
 * Generates and downloads a draw schedule Excel file
 */
export function exportDrawsToExcel({ project, draws, vendors }: DrawExportOptions): void {
  // Create vendor lookup map
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // Sort draws by draw number
  const sortedDraws = [...draws].sort((a, b) => (a.draw_number || 0) - (b.draw_number || 0));

  // Calculate totals
  const totalRequested = draws.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalApproved = draws
    .filter((d) => d.status === 'approved' || d.status === 'paid')
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalPaid = draws
    .filter((d) => d.status === 'paid')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  // Draw schedule sheet
  const scheduleData: WorksheetData = [
    [`Draw Schedule - ${project.name}`],
    [project.address || ''],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['DRAW SUMMARY'],
    ['Total Requested', formatCurrencyValue(totalRequested)],
    ['Total Approved', formatCurrencyValue(totalApproved)],
    ['Total Paid', formatCurrencyValue(totalPaid)],
    ['Remaining', formatCurrencyValue(totalRequested - totalPaid)],
    [],
    ['DRAW SCHEDULE'],
    [
      'Draw #',
      'Vendor',
      'Trade',
      'Milestone',
      'Description',
      '% Complete',
      'Amount',
      'Status',
      'Date Requested',
      'Date Paid',
      'Payment Method',
      'Reference #',
      'Notes',
    ],
  ];

  for (const draw of sortedDraws) {
    const vendor = draw.vendor_id ? vendorMap.get(draw.vendor_id) : null;

    scheduleData.push([
      draw.draw_number || '',
      vendor?.name || '',
      vendor ? VENDOR_TRADE_LABELS[vendor.trade] : '',
      draw.milestone ? MILESTONE_LABELS[draw.milestone] || draw.milestone : '',
      draw.description || '',
      draw.percent_complete ? `${draw.percent_complete}%` : '',
      formatCurrencyValue(draw.amount),
      draw.status ? DRAW_STATUS_LABELS[draw.status] || draw.status : '',
      formatDateValue(draw.date_requested),
      formatDateValue(draw.date_paid),
      draw.payment_method ? PAYMENT_METHOD_LABELS[draw.payment_method] || draw.payment_method : '',
      draw.reference_number || '',
      draw.notes || '',
    ]);
  }

  // Add totals row
  scheduleData.push([]);
  scheduleData.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    formatCurrencyValue(totalRequested),
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  // Summary by vendor sheet
  const vendorSummary = new Map<string, { name: string; trade: string; total: number; paid: number }>();
  for (const draw of draws) {
    if (draw.vendor_id) {
      const vendor = vendorMap.get(draw.vendor_id);
      const existing = vendorSummary.get(draw.vendor_id) || {
        name: vendor?.name || 'Unknown',
        trade: vendor ? VENDOR_TRADE_LABELS[vendor.trade] : '',
        total: 0,
        paid: 0,
      };
      existing.total += draw.amount || 0;
      if (draw.status === 'paid') {
        existing.paid += draw.amount || 0;
      }
      vendorSummary.set(draw.vendor_id, existing);
    }
  }

  const vendorSummaryData: WorksheetData = [
    ['Draws by Vendor'],
    [],
    ['Vendor', 'Trade', 'Total Draws', 'Amount Paid', 'Outstanding'],
  ];

  for (const [, summary] of vendorSummary) {
    vendorSummaryData.push([
      summary.name,
      summary.trade,
      formatCurrencyValue(summary.total),
      formatCurrencyValue(summary.paid),
      formatCurrencyValue(summary.total - summary.paid),
    ]);
  }

  // Summary by milestone sheet
  const milestoneSummary = new Map<string, { total: number; paid: number; count: number }>();
  for (const draw of draws) {
    const milestone = draw.milestone || 'unassigned';
    const existing = milestoneSummary.get(milestone) || { total: 0, paid: 0, count: 0 };
    existing.total += draw.amount || 0;
    existing.count += 1;
    if (draw.status === 'paid') {
      existing.paid += draw.amount || 0;
    }
    milestoneSummary.set(milestone, existing);
  }

  const milestoneSummaryData: WorksheetData = [
    ['Draws by Milestone'],
    [],
    ['Milestone', 'Draw Count', 'Total Amount', 'Amount Paid', 'Outstanding'],
  ];

  for (const [milestone, summary] of milestoneSummary) {
    milestoneSummaryData.push([
      MILESTONE_LABELS[milestone] || milestone,
      summary.count,
      formatCurrencyValue(summary.total),
      formatCurrencyValue(summary.paid),
      formatCurrencyValue(summary.total - summary.paid),
    ]);
  }

  // Create worksheets
  const sheets: WorksheetConfig[] = [
    {
      name: 'Draw Schedule',
      data: scheduleData,
      columnWidths: [8, 20, 18, 15, 30, 12, 12, 12, 14, 14, 15, 15, 30],
    },
    {
      name: 'By Vendor',
      data: vendorSummaryData,
      columnWidths: [25, 20, 15, 15, 15],
    },
    {
      name: 'By Milestone',
      data: milestoneSummaryData,
      columnWidths: [20, 12, 15, 15, 15],
    },
  ];

  // Create and download workbook
  const workbook = createWorkbook(sheets);
  const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Draw_Schedule`;
  downloadWorkbook(workbook, filename);
}
