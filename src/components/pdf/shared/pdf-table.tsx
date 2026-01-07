import { pdfStyles } from '@/lib/pdf/styles';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface PdfTableProps<T> {
  columns: Column<T>[];
  data: T[];
  showHeader?: boolean;
  striped?: boolean;
  compact?: boolean;
  footer?: React.ReactNode;
}

export function PdfTable<T extends Record<string, unknown>>({
  columns,
  data,
  showHeader = true,
  striped = false,
  compact = false,
  footer,
}: PdfTableProps<T>) {
  const getCellValue = (row: T, accessor: Column<T>['accessor']) => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor] as React.ReactNode;
  };

  const cellPadding = compact ? '4pt 6pt' : '6pt 8pt';

  return (
    <table style={pdfStyles.table}>
      {showHeader && (
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{
                  ...pdfStyles.th,
                  textAlign: col.align || 'left',
                  width: col.width,
                  padding: cellPadding,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {data.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            style={{
              backgroundColor: striped && rowIndex % 2 === 1 ? '#f8fafc' : 'transparent',
            }}
          >
            {columns.map((col, colIndex) => (
              <td
                key={colIndex}
                style={{
                  ...(col.align === 'right' ? pdfStyles.tdRight : pdfStyles.td),
                  textAlign: col.align || 'left',
                  padding: cellPadding,
                }}
              >
                {getCellValue(row, col.accessor)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer && (
        <tfoot>
          <tr>
            <td
              colSpan={columns.length}
              style={{
                borderTop: '2px solid #e2e8f0',
                padding: cellPadding,
                fontWeight: '600',
              }}
            >
              {footer}
            </td>
          </tr>
        </tfoot>
      )}
    </table>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  bold?: boolean;
  variant?: 'default' | 'positive' | 'negative';
}

export function SummaryTable({ rows }: { rows: SummaryRowProps[] }) {
  return (
    <table style={{ ...pdfStyles.table, fontSize: '10pt' }}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td
              style={{
                ...pdfStyles.td,
                fontWeight: row.bold ? '600' : '400',
                borderBottom: row.bold ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
              }}
            >
              {row.label}
            </td>
            <td
              style={{
                ...pdfStyles.tdRight,
                fontWeight: row.bold ? '600' : '400',
                color:
                  row.variant === 'positive'
                    ? pdfStyles.positive.color
                    : row.variant === 'negative'
                      ? pdfStyles.negative.color
                      : 'inherit',
                borderBottom: row.bold ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
