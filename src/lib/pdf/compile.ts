import { compile } from '@fileforge/react-print';

/**
 * Compiles a React component to HTML for PDF rendering
 */
export async function compileToPdf(component: React.ReactElement): Promise<string> {
  const html = await compile(component);
  return html;
}

/**
 * Generates and downloads a PDF in the browser
 * Uses the browser's print functionality for client-side PDF generation
 */
export function downloadPdf(html: string, filename: string) {
  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups for this site.');
  }

  // Write the HTML with print-optimized styles
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Opens HTML in a new tab for preview before printing
 */
export function previewPdf(html: string, title: string) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) {
    throw new Error('Could not open preview window. Please allow popups for this site.');
  }

  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - Preview</title>
        <style>
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
          }
          .pdf-content {
            background: white;
            padding: 0.5in;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .preview-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #1a1a1a;
            color: white;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 1000;
          }
          .preview-toolbar button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
          }
          .preview-toolbar button:hover {
            background: #2563eb;
          }
          .content-wrapper {
            margin-top: 60px;
          }
          @media print {
            .preview-toolbar {
              display: none;
            }
            .content-wrapper {
              margin-top: 0;
            }
            body {
              background: white;
              padding: 0;
            }
            .pdf-content {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <span>${title}</span>
          <button onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="content-wrapper">
          <div class="pdf-content">
            ${html}
          </div>
        </div>
      </body>
    </html>
  `);
  previewWindow.document.close();
}

/**
 * Format helpers for PDF content
 */
export const pdfFormatters = {
  currency: (value: number | null | undefined) => {
    if (value == null) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },

  percent: (value: number | null | undefined) => {
    if (value == null) return '0%';
    return `${value.toFixed(1)}%`;
  },

  date: (value: string | null | undefined) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  },

  number: (value: number | null | undefined) => {
    if (value == null) return '0';
    return new Intl.NumberFormat('en-US').format(value);
  },
};
