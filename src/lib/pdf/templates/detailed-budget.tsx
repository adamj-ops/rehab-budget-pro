import { PageBreak } from '@fileforge/react-print';
import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  Section,
  StatusBadge,
  Divider,
} from '@/components/pdf/shared';
import type { ProjectSummary, BudgetItem, Vendor } from '@/types';
import { BUDGET_CATEGORIES, STATUS_LABELS } from '@/types';

interface DetailedBudgetProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  vendors: Vendor[];
}

export function DetailedBudgetReport({
  project,
  budgetItems,
  vendors,
}: DetailedBudgetProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Create vendor lookup
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // Group items by category
  const itemsByCategory = BUDGET_CATEGORIES.map((cat) => {
    const items = budgetItems
      .filter((item) => item.category === cat.value)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return {
      ...cat,
      items,
      underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
      forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
      actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
    };
  }).filter((cat) => cat.items.length > 0);

  // Calculate totals
  const totals = {
    underwriting: budgetItems.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
    forecast: budgetItems.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
    actual: budgetItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
  };

  return (
    <div style={pdfStyles.page}>
      <PdfHeader
        title="Detailed Budget Report"
        subtitle={`${project.address || project.name}${project.city ? `, ${project.city}` : ''}`}
        date={generatedDate}
      />

      <PdfFooter projectName={project.name} confidential />

      {/* Summary Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12pt',
          marginBottom: '16pt',
          padding: '12pt',
          backgroundColor: '#f8fafc',
          borderRadius: '6pt',
        }}
      >
        <div>
          <div style={pdfStyles.metricLabel}>Underwriting</div>
          <div style={{ fontSize: '16pt', fontWeight: '700', color: '#1e40af' }}>
            {fmt.currency(totals.underwriting)}
          </div>
        </div>
        <div>
          <div style={pdfStyles.metricLabel}>Forecast</div>
          <div style={{ fontSize: '16pt', fontWeight: '700', color: '#059669' }}>
            {fmt.currency(totals.forecast)}
          </div>
        </div>
        <div>
          <div style={pdfStyles.metricLabel}>Actual</div>
          <div style={{ fontSize: '16pt', fontWeight: '700', color: '#7c3aed' }}>
            {fmt.currency(totals.actual)}
          </div>
        </div>
        <div>
          <div style={pdfStyles.metricLabel}>Total Variance</div>
          <div
            style={{
              fontSize: '16pt',
              fontWeight: '700',
              color: totals.actual - totals.forecast > 0 ? pdfStyles.negative.color : pdfStyles.positive.color,
            }}
          >
            {totals.actual - totals.forecast >= 0 ? '+' : ''}
            {fmt.currency(totals.actual - totals.forecast)}
          </div>
        </div>
      </div>

      {/* Budget Detail by Category */}
      {itemsByCategory.map((category, catIndex) => {
        const catForecastVar = category.forecast - category.underwriting;
        const catActualVar = category.actual - (category.forecast || category.underwriting);

        return (
          <div key={category.value}>
            {catIndex > 0 && catIndex % 3 === 0 && <PageBreak />}

            <Section title={category.label}>
              <table style={pdfStyles.table}>
                <thead>
                  <tr>
                    <th style={{ ...pdfStyles.th, width: '25%' }}>Item</th>
                    <th style={{ ...pdfStyles.th, width: '15%' }}>Vendor</th>
                    <th style={{ ...pdfStyles.th, textAlign: 'right', width: '12%' }}>Underwriting</th>
                    <th style={{ ...pdfStyles.th, textAlign: 'right', width: '12%' }}>Forecast</th>
                    <th style={{ ...pdfStyles.th, textAlign: 'right', width: '12%' }}>Actual</th>
                    <th style={{ ...pdfStyles.th, textAlign: 'right', width: '12%' }}>Variance</th>
                    <th style={{ ...pdfStyles.th, width: '12%' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {category.items.map((item) => {
                    const vendor = item.vendor_id ? vendorMap.get(item.vendor_id) : null;
                    const variance = (item.actual_amount || 0) - ((item.forecast_amount || item.underwriting_amount) || 0);

                    return (
                      <tr key={item.id}>
                        <td style={pdfStyles.td}>
                          <div style={{ fontWeight: '500' }}>{item.item}</div>
                          {item.description && (
                            <div style={{ fontSize: '8pt', color: '#64748b' }}>{item.description}</div>
                          )}
                        </td>
                        <td style={{ ...pdfStyles.td, fontSize: '8pt' }}>
                          {vendor?.name || '-'}
                        </td>
                        <td style={pdfStyles.tdRight}>{fmt.currency(item.underwriting_amount)}</td>
                        <td style={pdfStyles.tdRight}>{fmt.currency(item.forecast_amount)}</td>
                        <td style={pdfStyles.tdRight}>{fmt.currency(item.actual_amount || 0)}</td>
                        <td
                          style={{
                            ...pdfStyles.tdRight,
                            color: variance > 0 ? pdfStyles.negative.color : variance < 0 ? pdfStyles.positive.color : 'inherit',
                          }}
                        >
                          {variance >= 0 ? '+' : ''}{fmt.currency(variance)}
                        </td>
                        <td style={pdfStyles.td}>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <td
                      style={{ ...pdfStyles.td, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}
                      colSpan={2}
                    >
                      {category.label} Total
                    </td>
                    <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                      {fmt.currency(category.underwriting)}
                    </td>
                    <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                      {fmt.currency(category.forecast)}
                    </td>
                    <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                      {fmt.currency(category.actual)}
                    </td>
                    <td
                      style={{
                        ...pdfStyles.tdRight,
                        fontWeight: '600',
                        borderTop: '2px solid #e2e8f0',
                        color: catActualVar > 0 ? pdfStyles.negative.color : catActualVar < 0 ? pdfStyles.positive.color : 'inherit',
                      }}
                    >
                      {catActualVar >= 0 ? '+' : ''}{fmt.currency(catActualVar)}
                    </td>
                    <td style={{ ...pdfStyles.td, borderTop: '2px solid #e2e8f0' }}></td>
                  </tr>
                </tfoot>
              </table>
            </Section>
          </div>
        );
      })}

      <Divider />

      {/* Grand Total */}
      <div
        style={{
          padding: '16pt',
          backgroundColor: '#0f172a',
          color: 'white',
          borderRadius: '6pt',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16pt' }}>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
              Underwriting Total
            </div>
            <div style={{ fontSize: '18pt', fontWeight: '700' }}>{fmt.currency(totals.underwriting)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
              Forecast Total
            </div>
            <div style={{ fontSize: '18pt', fontWeight: '700' }}>{fmt.currency(totals.forecast)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
              Actual Total
            </div>
            <div style={{ fontSize: '18pt', fontWeight: '700' }}>{fmt.currency(totals.actual)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
              Net Variance
            </div>
            <div
              style={{
                fontSize: '18pt',
                fontWeight: '700',
                color: totals.actual - totals.forecast > 0 ? '#fca5a5' : '#86efac',
              }}
            >
              {totals.actual - totals.forecast >= 0 ? '+' : ''}
              {fmt.currency(totals.actual - totals.forecast)}
            </div>
          </div>
        </div>
      </div>

      {/* Contingency Note */}
      <div style={{ marginTop: '12pt', ...pdfStyles.small, textAlign: 'center' }}>
        Contingency of {project.contingency_percent}% ({fmt.currency(project.contingency_amount)}) not included in line items above.
        Total budget with contingency: {fmt.currency(project.rehab_budget_with_contingency)}
      </div>
    </div>
  );
}
