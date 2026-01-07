import { PageBreak } from '@fileforge/react-print';
import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  MetricRow,
  Section,
  SummaryTable,
  StatusBadge,
  Divider,
} from '@/components/pdf/shared';
import type { ProjectSummary, BudgetItem, Draw, Vendor } from '@/types';
import { BUDGET_CATEGORIES, PROJECT_STATUS_LABELS } from '@/types';

interface ExecutiveSummaryProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  draws: Draw[];
  vendors: Vendor[];
}

export function ExecutiveSummaryReport({
  project,
  budgetItems,
  draws,
}: ExecutiveSummaryProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate category totals for budget breakdown
  const categoryTotals = BUDGET_CATEGORIES.map((cat) => {
    const items = budgetItems.filter((item) => item.category === cat.value);
    return {
      category: cat.label,
      underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
      forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
      actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
      itemCount: items.length,
    };
  }).filter((cat) => cat.itemCount > 0);

  // Calculate draw totals
  const totalDrawsRequested = draws.reduce((sum, d) => sum + d.amount, 0);
  const totalDrawsPaid = draws.filter((d) => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);
  const pendingDraws = draws.filter((d) => d.status === 'pending' || d.status === 'approved');

  // ROI calculation
  const roi = project.arv && project.total_investment > 0
    ? ((project.gross_profit / project.total_investment) * 100)
    : 0;

  // Progress percentage
  const progressPercent = project.total_items > 0
    ? Math.round((project.completed_items / project.total_items) * 100)
    : 0;

  return (
    <div style={pdfStyles.page}>
      <PdfHeader
        title="Executive Summary"
        subtitle={`${project.address || project.name}${project.city ? `, ${project.city}` : ''}`}
        date={generatedDate}
      />

      <PdfFooter projectName={project.name} confidential />

      {/* Property Overview */}
      <Section title="Property Overview">
        <div style={pdfStyles.grid2}>
          <div>
            <SummaryTable
              rows={[
                { label: 'Property', value: project.name },
                { label: 'Address', value: project.address || 'N/A' },
                { label: 'City/State', value: `${project.city || ''}, ${project.state || ''}`.trim() || 'N/A' },
                { label: 'Type', value: project.property_type?.toUpperCase() || 'SFH' },
                { label: 'Status', value: PROJECT_STATUS_LABELS[project.status] || project.status },
              ]}
            />
          </div>
          <div>
            <SummaryTable
              rows={[
                { label: 'Beds / Baths', value: `${project.beds || '-'} / ${project.baths || '-'}` },
                { label: 'Square Feet', value: project.sqft ? fmt.number(project.sqft) : 'N/A' },
                { label: 'Year Built', value: project.year_built?.toString() || 'N/A' },
                { label: 'Contract Date', value: fmt.date(project.contract_date) },
                { label: 'Target Complete', value: fmt.date(project.target_complete_date) },
              ]}
            />
          </div>
        </div>
      </Section>

      <Divider />

      {/* Key Financial Metrics */}
      <Section title="Key Financial Metrics">
        <MetricRow
          items={[
            { label: 'ARV', value: fmt.currency(project.arv), sublabel: 'After Repair Value' },
            { label: 'Purchase Price', value: fmt.currency(project.purchase_price) },
            { label: 'Rehab Budget', value: fmt.currency(project.rehab_budget_with_contingency), sublabel: `Includes ${project.contingency_percent}% contingency` },
            { label: 'Total Investment', value: fmt.currency(project.total_investment), variant: 'primary' },
          ]}
        />
        <div style={{ marginTop: '12pt' }}>
          <MetricRow
            items={[
              {
                label: 'Gross Profit',
                value: fmt.currency(project.gross_profit),
                variant: project.gross_profit >= 0 ? 'positive' : 'negative',
              },
              {
                label: 'ROI',
                value: fmt.percent(roi),
                variant: roi >= 15 ? 'positive' : roi >= 0 ? 'default' : 'negative',
              },
              { label: 'MAO', value: fmt.currency(project.mao), sublabel: 'Maximum Allowable Offer' },
              {
                label: 'Progress',
                value: `${progressPercent}%`,
                sublabel: `${project.completed_items}/${project.total_items} items complete`,
              },
            ]}
          />
        </div>
      </Section>

      <Divider />

      {/* Investment Breakdown */}
      <Section title="Investment Breakdown">
        <SummaryTable
          rows={[
            { label: 'Purchase Price', value: fmt.currency(project.purchase_price) },
            { label: 'Closing Costs', value: fmt.currency(project.closing_costs) },
            { label: 'Holding Costs', value: fmt.currency(project.holding_costs_total), bold: false },
            { label: 'Rehab Budget', value: fmt.currency(project.rehab_budget) },
            { label: `Contingency (${project.contingency_percent}%)`, value: fmt.currency(project.contingency_amount) },
            { label: 'Total Investment', value: fmt.currency(project.total_investment), bold: true },
            { label: '', value: '' },
            { label: 'ARV', value: fmt.currency(project.arv) },
            { label: `Selling Costs (${project.selling_cost_percent}%)`, value: `(${fmt.currency(project.selling_costs)})` },
            { label: 'Net Proceeds', value: fmt.currency((project.arv || 0) - project.selling_costs), bold: true },
            { label: '', value: '' },
            {
              label: 'Gross Profit',
              value: fmt.currency(project.gross_profit),
              bold: true,
              variant: project.gross_profit >= 0 ? 'positive' : 'negative',
            },
          ]}
        />
      </Section>

      <PageBreak />

      {/* Budget Summary by Category */}
      <Section title="Budget Summary by Category">
        <table style={pdfStyles.table}>
          <thead>
            <tr>
              <th style={pdfStyles.th}>Category</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Underwriting</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Forecast</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Actual</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Variance</th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.map((cat, i) => {
              const variance = cat.actual - (cat.forecast || cat.underwriting);
              return (
                <tr key={i}>
                  <td style={pdfStyles.td}>{cat.category}</td>
                  <td style={pdfStyles.tdRight}>{fmt.currency(cat.underwriting)}</td>
                  <td style={pdfStyles.tdRight}>{fmt.currency(cat.forecast)}</td>
                  <td style={pdfStyles.tdRight}>{fmt.currency(cat.actual)}</td>
                  <td
                    style={{
                      ...pdfStyles.tdRight,
                      color: variance > 0 ? pdfStyles.negative.color : variance < 0 ? pdfStyles.positive.color : 'inherit',
                    }}
                  >
                    {variance >= 0 ? '+' : ''}{fmt.currency(variance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={{ ...pdfStyles.td, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>TOTAL</td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(project.underwriting_total)}
              </td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(project.forecast_total)}
              </td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(project.actual_total)}
              </td>
              <td
                style={{
                  ...pdfStyles.tdRight,
                  fontWeight: '600',
                  borderTop: '2px solid #e2e8f0',
                  color: (project.actual_total - project.forecast_total) > 0 ? pdfStyles.negative.color : pdfStyles.positive.color,
                }}
              >
                {(project.actual_total - project.forecast_total) >= 0 ? '+' : ''}
                {fmt.currency(project.actual_total - project.forecast_total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </Section>

      <Divider />

      {/* Draw Status */}
      <Section title="Draw Status">
        <MetricRow
          items={[
            { label: 'Total Requested', value: fmt.currency(totalDrawsRequested) },
            { label: 'Total Paid', value: fmt.currency(totalDrawsPaid), variant: 'positive' },
            { label: 'Pending', value: fmt.currency(totalDrawsRequested - totalDrawsPaid), variant: pendingDraws.length > 0 ? 'default' : 'positive' },
            { label: 'Draw Count', value: `${draws.length}`, sublabel: `${pendingDraws.length} pending` },
          ]}
        />
        {draws.length > 0 && (
          <div style={{ marginTop: '12pt' }}>
            <table style={pdfStyles.table}>
              <thead>
                <tr>
                  <th style={pdfStyles.th}>#</th>
                  <th style={pdfStyles.th}>Milestone</th>
                  <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Amount</th>
                  <th style={pdfStyles.th}>Status</th>
                  <th style={pdfStyles.th}>Date Paid</th>
                </tr>
              </thead>
              <tbody>
                {draws.slice(0, 6).map((draw) => (
                  <tr key={draw.id}>
                    <td style={pdfStyles.td}>#{draw.draw_number}</td>
                    <td style={pdfStyles.td}>{draw.milestone?.replace(/_/g, ' ') || '-'}</td>
                    <td style={pdfStyles.tdRight}>{fmt.currency(draw.amount)}</td>
                    <td style={pdfStyles.td}>
                      <StatusBadge status={draw.status} />
                    </td>
                    <td style={pdfStyles.td}>{fmt.date(draw.date_paid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {draws.length > 6 && (
              <div style={{ ...pdfStyles.small, marginTop: '4pt', textAlign: 'center' }}>
                + {draws.length - 6} more draws
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Notes */}
      {project.notes && (
        <>
          <Divider />
          <Section title="Notes">
            <div style={{ ...pdfStyles.card, whiteSpace: 'pre-wrap' }}>{project.notes}</div>
          </Section>
        </>
      )}
    </div>
  );
}
