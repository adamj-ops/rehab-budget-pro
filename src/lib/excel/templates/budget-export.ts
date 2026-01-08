/**
 * Budget Detail Excel Export
 *
 * Exports the full three-column budget with categories and line items.
 */

import type { ProjectSummary, BudgetItem, Vendor } from '@/types';
import { BUDGET_CATEGORIES, VENDOR_TRADE_LABELS, STATUS_LABELS } from '@/types';
import {
  createWorkbook,
  downloadWorkbook,
  formatCurrencyValue,
  type WorksheetConfig,
  type WorksheetData,
} from '../index';

interface BudgetExportOptions {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  vendors: Vendor[];
}

// Create a map for category labels
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<string, string>
);

/**
 * Generates and downloads a budget detail Excel file
 */
export function exportBudgetToExcel({ project, budgetItems, vendors }: BudgetExportOptions): void {
  // Create vendor lookup map
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // Group items by category
  const itemsByCategory = BUDGET_CATEGORIES.map((cat) => ({
    category: cat.value,
    label: cat.label,
    items: budgetItems
      .filter((item) => item.category === cat.value)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  })).filter((group) => group.items.length > 0);

  // Calculate totals
  const underwritingTotal = budgetItems.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);
  const forecastTotal = budgetItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0);
  const actualTotal = budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  // Build worksheet data
  const data: WorksheetData = [
    // Title
    [`Budget Detail - ${project.name}`],
    [project.address || ''],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    // Summary
    ['BUDGET SUMMARY'],
    ['', 'Underwriting', 'Forecast', 'Actual', 'Variance'],
    [
      'Total Budget',
      formatCurrencyValue(underwritingTotal),
      formatCurrencyValue(forecastTotal),
      formatCurrencyValue(actualTotal),
      formatCurrencyValue(actualTotal - underwritingTotal),
    ],
    [],
    // Headers
    [
      'Category',
      'Item',
      'Description',
      'Qty',
      'Unit',
      'Rate',
      'Underwriting',
      'Forecast',
      'Actual',
      'Forecast Var',
      'Actual Var',
      'Status',
      'Vendor',
    ],
  ];

  // Add items by category
  for (const group of itemsByCategory) {
    // Category subtotal row
    const categoryUnderwriting = group.items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);
    const categoryForecast = group.items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0);
    const categoryActual = group.items.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

    data.push([
      group.label,
      '',
      '',
      '',
      '',
      '',
      formatCurrencyValue(categoryUnderwriting),
      formatCurrencyValue(categoryForecast),
      formatCurrencyValue(categoryActual),
      formatCurrencyValue(categoryForecast - categoryUnderwriting),
      formatCurrencyValue(categoryActual - categoryForecast),
      '',
      '',
    ]);

    // Individual items
    for (const item of group.items) {
      const vendor = item.vendor_id ? vendorMap.get(item.vendor_id) : null;

      data.push([
        '',
        item.item,
        item.description || '',
        item.qty || '',
        item.unit || '',
        formatCurrencyValue(item.rate),
        formatCurrencyValue(item.underwriting_amount),
        formatCurrencyValue(item.forecast_amount),
        formatCurrencyValue(item.actual_amount),
        formatCurrencyValue(item.forecast_variance),
        formatCurrencyValue(item.actual_variance),
        item.status ? STATUS_LABELS[item.status] : '',
        vendor ? vendor.name : '',
      ]);
    }
  }

  // Add totals row
  data.push([]);
  data.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    formatCurrencyValue(underwritingTotal),
    formatCurrencyValue(forecastTotal),
    formatCurrencyValue(actualTotal),
    formatCurrencyValue(forecastTotal - underwritingTotal),
    formatCurrencyValue(actualTotal - forecastTotal),
    '',
    '',
  ]);

  // Create worksheet config
  const sheets: WorksheetConfig[] = [
    {
      name: 'Budget Detail',
      data,
      columnWidths: [20, 30, 40, 8, 8, 12, 14, 14, 14, 14, 14, 15, 25],
    },
  ];

  // Create and download workbook
  const workbook = createWorkbook(sheets);
  const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Budget_Detail`;
  downloadWorkbook(workbook, filename);
}
