/**
 * Excel Export Utilities
 *
 * Provides functions for generating and downloading Excel workbooks
 * using the xlsx (SheetJS) library.
 */

import * as XLSX from 'xlsx';

export type WorksheetData = (string | number | null | undefined)[][];

export interface WorksheetConfig {
  name: string;
  data: WorksheetData;
  columnWidths?: number[];
}

/**
 * Creates an Excel workbook with multiple sheets
 */
export function createWorkbook(sheets: WorksheetConfig[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data);

    // Set column widths if provided
    if (sheet.columnWidths) {
      worksheet['!cols'] = sheet.columnWidths.map((width) => ({ wch: width }));
    }

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  return workbook;
}

/**
 * Downloads an Excel workbook as a file
 */
export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  // Ensure filename has .xlsx extension
  const fullFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // Write and download
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Helper to format currency values for Excel
 */
export function formatCurrencyValue(value: number | null | undefined): number {
  return value ?? 0;
}

/**
 * Helper to format date values for Excel
 */
export function formatDateValue(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

/**
 * Helper to create a header row with styling info
 * (Note: Basic xlsx doesn't support styling, but this helps identify headers)
 */
export function createHeaderRow(headers: string[]): string[] {
  return headers;
}

// Re-export templates
export * from './templates/budget-export';
export * from './templates/project-summary-export';
export * from './templates/vendor-export';
export * from './templates/draw-export';
