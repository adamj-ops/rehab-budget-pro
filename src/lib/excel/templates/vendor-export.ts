/**
 * Vendor List Excel Export
 *
 * Exports vendor directory with contact information and payment totals.
 */

import type { ProjectSummary, Vendor, BudgetItem, Draw } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import {
  createWorkbook,
  downloadWorkbook,
  formatCurrencyValue,
  type WorksheetConfig,
  type WorksheetData,
} from '../index';

interface VendorExportOptions {
  project: ProjectSummary;
  vendors: Vendor[];
  budgetItems: BudgetItem[];
  draws: Draw[];
}

/**
 * Generates and downloads a vendor list Excel file
 */
export function exportVendorsToExcel({
  project,
  vendors,
  budgetItems,
  draws,
}: VendorExportOptions): void {
  // Calculate vendor totals from draws
  const vendorPayments = new Map<string, { requested: number; paid: number }>();
  for (const draw of draws) {
    if (draw.vendor_id) {
      const existing = vendorPayments.get(draw.vendor_id) || { requested: 0, paid: 0 };
      existing.requested += draw.amount || 0;
      if (draw.status === 'paid') {
        existing.paid += draw.amount || 0;
      }
      vendorPayments.set(draw.vendor_id, existing);
    }
  }

  // Calculate vendor assignments from budget items
  const vendorAssignments = new Map<string, number>();
  for (const item of budgetItems) {
    if (item.vendor_id) {
      const current = vendorAssignments.get(item.vendor_id) || 0;
      vendorAssignments.set(item.vendor_id, current + (item.underwriting_amount || 0));
    }
  }

  // Get vendors assigned to this project
  const projectVendorIds = new Set([
    ...budgetItems.filter((i) => i.vendor_id).map((i) => i.vendor_id!),
    ...draws.filter((d) => d.vendor_id).map((d) => d.vendor_id!),
  ]);

  const projectVendors = vendors.filter((v) => projectVendorIds.has(v.id));

  // Build vendor list data
  const vendorListData: WorksheetData = [
    [`Vendor List - ${project.name}`],
    [project.address || ''],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    [
      'Vendor Name',
      'Trade',
      'Phone',
      'Email',
      'Licensed',
      'Insured',
      'Rating',
      'Budget Assigned',
      'Draws Requested',
      'Amount Paid',
    ],
  ];

  for (const vendor of projectVendors) {
    const payments = vendorPayments.get(vendor.id) || { requested: 0, paid: 0 };
    const assigned = vendorAssignments.get(vendor.id) || 0;

    vendorListData.push([
      vendor.name,
      VENDOR_TRADE_LABELS[vendor.trade] || vendor.trade,
      vendor.phone || '',
      vendor.email || '',
      vendor.is_licensed ? 'Yes' : 'No',
      vendor.is_insured ? 'Yes' : 'No',
      vendor.rating || '',
      formatCurrencyValue(assigned),
      formatCurrencyValue(payments.requested),
      formatCurrencyValue(payments.paid),
    ]);
  }

  // Add totals row
  const totalAssigned = Array.from(vendorAssignments.values()).reduce((sum, v) => sum + v, 0);
  const totalRequested = Array.from(vendorPayments.values()).reduce((sum, v) => sum + v.requested, 0);
  const totalPaid = Array.from(vendorPayments.values()).reduce((sum, v) => sum + v.paid, 0);

  vendorListData.push([]);
  vendorListData.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    formatCurrencyValue(totalAssigned),
    formatCurrencyValue(totalRequested),
    formatCurrencyValue(totalPaid),
  ]);

  // Full vendor directory (all vendors)
  const directoryData: WorksheetData = [
    ['Full Vendor Directory'],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    [
      'Vendor Name',
      'Trade',
      'Phone',
      'Email',
      'Address',
      'Licensed',
      'License #',
      'Insured',
      'Rating',
      'Notes',
    ],
  ];

  for (const vendor of vendors) {
    directoryData.push([
      vendor.name,
      VENDOR_TRADE_LABELS[vendor.trade] || vendor.trade,
      vendor.phone || '',
      vendor.email || '',
      vendor.address || '',
      vendor.is_licensed ? 'Yes' : 'No',
      vendor.license_number || '',
      vendor.is_insured ? 'Yes' : 'No',
      vendor.rating || '',
      vendor.notes || '',
    ]);
  }

  // Create worksheets
  const sheets: WorksheetConfig[] = [
    {
      name: 'Project Vendors',
      data: vendorListData,
      columnWidths: [25, 20, 15, 25, 10, 10, 8, 15, 15, 15],
    },
    {
      name: 'Full Directory',
      data: directoryData,
      columnWidths: [25, 20, 15, 25, 35, 10, 15, 10, 8, 40],
    },
  ];

  // Create and download workbook
  const workbook = createWorkbook(sheets);
  const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Vendors`;
  downloadWorkbook(workbook, filename);
}
