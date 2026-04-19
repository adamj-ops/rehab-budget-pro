/**
 * Project Summary Excel Export
 *
 * Exports project financials, metrics, and deal summary.
 */

import type { ProjectSummary, BudgetItem } from '@/types';
import { BUDGET_CATEGORIES } from '@/types';
import {
  createWorkbook,
  downloadWorkbook,
  formatCurrencyValue,
  formatDateValue,
  type WorksheetConfig,
  type WorksheetData,
} from '../index';

interface ProjectSummaryExportOptions {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
}

// Create a map for category labels
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<string, string>
);

/**
 * Generates and downloads a project summary Excel file
 */
export function exportProjectSummaryToExcel({
  project,
  budgetItems,
}: ProjectSummaryExportOptions): void {
  // Calculate category totals
  const categoryTotals = BUDGET_CATEGORIES.map((cat) => {
    const items = budgetItems.filter((item) => item.category === cat.value);
    return {
      category: cat.label,
      underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
      forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
      actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
    };
  }).filter((cat) => cat.underwriting > 0 || cat.forecast > 0 || cat.actual > 0);

  // Summary sheet data
  const summaryData: WorksheetData = [
    [`Project Summary - ${project.name}`],
    [project.address || ''],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['PROPERTY DETAILS'],
    ['Property Type', project.property_type?.toUpperCase() || 'N/A'],
    ['Square Feet', project.sqft || 'N/A'],
    ['Year Built', project.year_built || 'N/A'],
    ['Bedrooms', project.beds || 'N/A'],
    ['Bathrooms', project.baths || 'N/A'],
    [],
    ['KEY DATES'],
    ['Status', project.status?.replace(/_/g, ' ').toUpperCase() || 'N/A'],
    ['Under Contract Date', formatDateValue(project.under_contract_date)],
    ['Closing Date', formatDateValue(project.closing_date)],
    ['Rehab Start Date', formatDateValue(project.rehab_start_date)],
    ['Rehab End Date', formatDateValue(project.rehab_end_date)],
    ['List Date', formatDateValue(project.list_date)],
    ['Sale Date', formatDateValue(project.sale_date)],
    [],
    ['FINANCIAL SUMMARY'],
    ['', 'Amount'],
    ['ARV (After Repair Value)', formatCurrencyValue(project.arv)],
    ['Purchase Price', formatCurrencyValue(project.purchase_price)],
    ['Closing Costs', formatCurrencyValue(project.closing_costs)],
    [],
    ['Rehab Budget (Underwriting)', formatCurrencyValue(project.underwriting_total)],
    ['Rehab Budget (Forecast)', formatCurrencyValue(project.forecast_total)],
    ['Rehab Budget (Actual)', formatCurrencyValue(project.actual_total)],
    ['Contingency', formatCurrencyValue(project.contingency_amount)],
    [],
    ['Holding Costs (Monthly)', formatCurrencyValue(project.holding_costs_monthly)],
    ['Holding Costs (Total)', formatCurrencyValue(project.holding_costs_total)],
    ['Selling Costs', formatCurrencyValue(project.selling_costs)],
    [],
    ['INVESTMENT METRICS'],
    ['Total Investment', formatCurrencyValue(project.total_investment)],
    ['MAO (Maximum Allowable Offer)', formatCurrencyValue(project.mao)],
    ['Gross Profit', formatCurrencyValue(project.gross_profit)],
    ['ROI (%)', project.roi ? `${project.roi.toFixed(1)}%` : 'N/A'],
    ['Profit/Month', formatCurrencyValue(project.profit_per_month)],
  ];

  // Category breakdown sheet
  const categoryData: WorksheetData = [
    ['Budget by Category'],
    [],
    ['Category', 'Underwriting', 'Forecast', 'Actual', 'Variance'],
    ...categoryTotals.map((cat) => [
      cat.category,
      formatCurrencyValue(cat.underwriting),
      formatCurrencyValue(cat.forecast),
      formatCurrencyValue(cat.actual),
      formatCurrencyValue(cat.actual - cat.underwriting),
    ]),
    [],
    [
      'TOTAL',
      formatCurrencyValue(categoryTotals.reduce((sum, cat) => sum + cat.underwriting, 0)),
      formatCurrencyValue(categoryTotals.reduce((sum, cat) => sum + cat.forecast, 0)),
      formatCurrencyValue(categoryTotals.reduce((sum, cat) => sum + cat.actual, 0)),
      formatCurrencyValue(
        categoryTotals.reduce((sum, cat) => sum + (cat.actual - cat.underwriting), 0)
      ),
    ],
  ];

  // Create worksheets
  const sheets: WorksheetConfig[] = [
    {
      name: 'Summary',
      data: summaryData,
      columnWidths: [30, 20],
    },
    {
      name: 'Budget by Category',
      data: categoryData,
      columnWidths: [25, 15, 15, 15, 15],
    },
  ];

  // Create and download workbook
  const workbook = createWorkbook(sheets);
  const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Project_Summary`;
  downloadWorkbook(workbook, filename);
}
