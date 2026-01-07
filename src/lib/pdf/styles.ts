/**
 * Shared PDF styles - inline CSS for PDF rendering
 * These styles are designed to work well with print media
 */

export const pdfStyles = {
  // Base styles
  page: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '10pt',
    lineHeight: '1.4',
    color: '#1a1a1a',
  },

  // Typography
  h1: {
    fontSize: '24pt',
    fontWeight: '700',
    marginBottom: '8pt',
    color: '#0f172a',
  },
  h2: {
    fontSize: '16pt',
    fontWeight: '600',
    marginBottom: '6pt',
    color: '#1e293b',
  },
  h3: {
    fontSize: '12pt',
    fontWeight: '600',
    marginBottom: '4pt',
    color: '#334155',
  },
  small: {
    fontSize: '8pt',
    color: '#64748b',
  },

  // Layout
  flexRow: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '12pt',
  },
  flexCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8pt',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12pt',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12pt',
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '12pt',
  },

  // Components
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '6pt',
    padding: '12pt',
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8pt',
    marginBottom: '8pt',
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '9pt',
  },
  th: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    padding: '6pt 8pt',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#475569',
  },
  td: {
    borderBottom: '1px solid #f1f5f9',
    padding: '6pt 8pt',
    verticalAlign: 'top' as const,
  },
  tdRight: {
    borderBottom: '1px solid #f1f5f9',
    padding: '6pt 8pt',
    verticalAlign: 'top' as const,
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums',
  },

  // Metrics
  metricValue: {
    fontSize: '20pt',
    fontWeight: '700',
    color: '#0f172a',
    fontVariantNumeric: 'tabular-nums',
  },
  metricLabel: {
    fontSize: '9pt',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5pt',
  },

  // Status colors
  positive: { color: '#16a34a' },
  negative: { color: '#dc2626' },
  neutral: { color: '#64748b' },
  primary: { color: '#2563eb' },

  // Badges
  badge: {
    display: 'inline-block',
    padding: '2pt 6pt',
    borderRadius: '4pt',
    fontSize: '8pt',
    fontWeight: '500',
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeBlue: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeYellow: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
  },
  badgeRed: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  badgeGray: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
  },

  // Spacing
  mt1: { marginTop: '4pt' },
  mt2: { marginTop: '8pt' },
  mt3: { marginTop: '12pt' },
  mt4: { marginTop: '16pt' },
  mb1: { marginBottom: '4pt' },
  mb2: { marginBottom: '8pt' },
  mb3: { marginBottom: '12pt' },
  mb4: { marginBottom: '16pt' },

  // Dividers
  divider: {
    borderTop: '1px solid #e2e8f0',
    marginTop: '12pt',
    marginBottom: '12pt',
  },
  dividerThick: {
    borderTop: '2px solid #cbd5e1',
    marginTop: '16pt',
    marginBottom: '16pt',
  },
} as const;

/**
 * CSS string for embedding in PDF documents
 */
export const pdfCssString = `
  * {
    box-sizing: border-box;
  }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 10pt;
    line-height: 1.4;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }
  h1 { font-size: 24pt; font-weight: 700; margin: 0 0 8pt 0; color: #0f172a; }
  h2 { font-size: 16pt; font-weight: 600; margin: 0 0 6pt 0; color: #1e293b; }
  h3 { font-size: 12pt; font-weight: 600; margin: 0 0 4pt 0; color: #334155; }
  p { margin: 0 0 8pt 0; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  th {
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    padding: 6pt 8pt;
    text-align: left;
    font-weight: 600;
    color: #475569;
  }
  td {
    border-bottom: 1px solid #f1f5f9;
    padding: 6pt 8pt;
    vertical-align: top;
  }
  .text-right { text-align: right; }
  .tabular-nums { font-variant-numeric: tabular-nums; }
  .text-positive { color: #16a34a; }
  .text-negative { color: #dc2626; }
  .text-muted { color: #64748b; }
  .font-bold { font-weight: 700; }
  .font-semibold { font-weight: 600; }
`;
