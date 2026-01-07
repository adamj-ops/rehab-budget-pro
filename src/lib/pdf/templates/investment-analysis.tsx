import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  MetricRow,
  Section,
  SummaryTable,
  Divider,
  ThickDivider,
} from '@/components/pdf/shared';
import type { ProjectSummary, BudgetItem } from '@/types';
import { PROJECT_STATUS_LABELS, BUDGET_CATEGORIES } from '@/types';

interface InvestmentAnalysisProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
}

export function InvestmentAnalysisReport({
  project,
  budgetItems,
}: InvestmentAnalysisProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate key metrics
  const arv = project.arv || 0;
  const purchasePrice = project.purchase_price || 0;
  const rehabBudget = project.rehab_budget_with_contingency;
  const totalInvestment = project.total_investment;
  const grossProfit = project.gross_profit;
  const sellingCosts = project.selling_costs;
  const holdingCosts = project.holding_costs_total;

  // ROI Calculations
  const roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const cashOnCash = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
  const annualizedROI = project.hold_months > 0 ? (roi / project.hold_months) * 12 : 0;

  // MAO Calculations with different profit targets
  const calculateMAO = (targetProfitPercent: number) => {
    const targetProfit = arv * (targetProfitPercent / 100);
    return arv - sellingCosts - holdingCosts - rehabBudget - targetProfit;
  };

  const mao70 = arv * 0.70 - rehabBudget; // Classic 70% rule
  const maoConservative = calculateMAO(25); // 25% profit target
  const maoModerate = calculateMAO(20); // 20% profit target
  const maoAggressive = calculateMAO(15); // 15% profit target

  // Price per square foot analysis
  const pricePerSqft = project.sqft ? purchasePrice / project.sqft : 0;
  const arvPerSqft = project.sqft ? arv / project.sqft : 0;
  const rehabPerSqft = project.sqft ? rehabBudget / project.sqft : 0;

  // Risk metrics
  const rehabToArvRatio = arv > 0 ? (rehabBudget / arv) * 100 : 0;
  const purchaseToArvRatio = arv > 0 ? (purchasePrice / arv) * 100 : 0;
  const totalCostToArvRatio = arv > 0 ? (totalInvestment / arv) * 100 : 0;

  // Budget variance risk
  const budgetVariance = project.actual_total - project.forecast_total;
  const variancePercent = project.forecast_total > 0
    ? (budgetVariance / project.forecast_total) * 100
    : 0;

  // Category breakdown for risk analysis
  const categoryTotals = BUDGET_CATEGORIES.map((cat) => {
    const items = budgetItems.filter((item) => item.category === cat.value);
    const total = items.reduce((sum, item) => sum + (item.forecast_amount || item.underwriting_amount || 0), 0);
    return { category: cat.label, total, percent: rehabBudget > 0 ? (total / rehabBudget) * 100 : 0 };
  })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Risk assessment
  const getRiskLevel = () => {
    let riskScore = 0;
    if (rehabToArvRatio > 30) riskScore += 2;
    else if (rehabToArvRatio > 20) riskScore += 1;
    if (purchaseToArvRatio > 75) riskScore += 2;
    else if (purchaseToArvRatio > 65) riskScore += 1;
    if (roi < 15) riskScore += 2;
    else if (roi < 20) riskScore += 1;
    if (variancePercent > 10) riskScore += 1;

    if (riskScore >= 5) return { level: 'High', color: '#dc2626' };
    if (riskScore >= 3) return { level: 'Medium', color: '#f59e0b' };
    return { level: 'Low', color: '#16a34a' };
  };

  const risk = getRiskLevel();

  return (
    <div style={pdfStyles.page}>
      <PdfHeader
        title="Investment Analysis"
        subtitle={`${project.address || project.name}${project.city ? `, ${project.city}` : ''}`}
        date={generatedDate}
      />

      <PdfFooter projectName={project.name} confidential />

      {/* Executive Summary */}
      <Section title="Deal Overview">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16pt' }}>
          <div>
            <SummaryTable
              rows={[
                { label: 'Property', value: project.name },
                { label: 'Address', value: `${project.address || ''}, ${project.city || ''} ${project.state || ''}`.trim() },
                { label: 'Type', value: `${project.property_type?.toUpperCase() || 'SFH'} | ${project.beds || '-'} BD / ${project.baths || '-'} BA | ${fmt.number(project.sqft || 0)} SF` },
                { label: 'Year Built', value: project.year_built?.toString() || 'N/A' },
                { label: 'Status', value: PROJECT_STATUS_LABELS[project.status] || project.status },
              ]}
            />
          </div>
          <div
            style={{
              ...pdfStyles.card,
              backgroundColor: risk.level === 'High' ? '#fef2f2' : risk.level === 'Medium' ? '#fffbeb' : '#f0fdf4',
              borderColor: risk.color,
              borderWidth: '2pt',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9pt', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5pt' }}>
              Risk Assessment
            </div>
            <div style={{ fontSize: '24pt', fontWeight: '700', color: risk.color, marginTop: '4pt' }}>
              {risk.level}
            </div>
            <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '4pt' }}>
              Based on ROI, rehab ratio, and purchase price
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* Key Investment Metrics */}
      <Section title="Key Investment Metrics">
        <MetricRow
          items={[
            { label: 'ARV', value: fmt.currency(arv), sublabel: 'After Repair Value' },
            { label: 'Purchase Price', value: fmt.currency(purchasePrice), sublabel: `${purchaseToArvRatio.toFixed(1)}% of ARV` },
            { label: 'Rehab Budget', value: fmt.currency(rehabBudget), sublabel: `${rehabToArvRatio.toFixed(1)}% of ARV` },
            { label: 'Total Investment', value: fmt.currency(totalInvestment), variant: 'primary' },
          ]}
        />
        <div style={{ marginTop: '12pt' }}>
          <MetricRow
            items={[
              {
                label: 'Gross Profit',
                value: fmt.currency(grossProfit),
                variant: grossProfit >= 0 ? 'positive' : 'negative',
              },
              {
                label: 'ROI',
                value: fmt.percent(roi),
                sublabel: `${fmt.percent(annualizedROI)} annualized`,
                variant: roi >= 20 ? 'positive' : roi >= 15 ? 'default' : 'negative',
              },
              { label: 'Hold Period', value: `${project.hold_months} mo`, sublabel: `${fmt.currency(project.holding_costs_monthly)}/mo` },
              { label: 'Profit/SF', value: project.sqft ? fmt.currency(grossProfit / project.sqft) : 'N/A' },
            ]}
          />
        </div>
      </Section>

      <ThickDivider />

      {/* MAO Analysis */}
      <Section title="Maximum Allowable Offer (MAO) Analysis">
        <div style={{ marginBottom: '12pt' }}>
          <div style={{ fontSize: '9pt', color: '#64748b', marginBottom: '8pt' }}>
            MAO calculations based on different profit targets and the classic 70% rule.
          </div>
        </div>

        <table style={pdfStyles.table}>
          <thead>
            <tr>
              <th style={pdfStyles.th}>Method</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Target Profit</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>MAO</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>vs Current Price</th>
              <th style={pdfStyles.th}>Assessment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={pdfStyles.td}>
                <div style={{ fontWeight: '500' }}>70% Rule (Classic)</div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>ARV × 70% − Rehab</div>
              </td>
              <td style={pdfStyles.tdRight}>30%</td>
              <td style={pdfStyles.tdRight}>{fmt.currency(mao70)}</td>
              <td
                style={{
                  ...pdfStyles.tdRight,
                  color: purchasePrice <= mao70 ? pdfStyles.positive.color : pdfStyles.negative.color,
                }}
              >
                {purchasePrice <= mao70 ? '✓ ' : '✗ '}
                {fmt.currency(purchasePrice - mao70)}
              </td>
              <td style={pdfStyles.td}>
                {purchasePrice <= mao70 ? (
                  <span style={{ color: pdfStyles.positive.color, fontWeight: '500' }}>Under MAO</span>
                ) : (
                  <span style={{ color: pdfStyles.negative.color, fontWeight: '500' }}>Over MAO</span>
                )}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={pdfStyles.td}>
                <div style={{ fontWeight: '500' }}>Conservative</div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>25% profit target</div>
              </td>
              <td style={pdfStyles.tdRight}>{fmt.currency(arv * 0.25)}</td>
              <td style={pdfStyles.tdRight}>{fmt.currency(maoConservative)}</td>
              <td
                style={{
                  ...pdfStyles.tdRight,
                  color: purchasePrice <= maoConservative ? pdfStyles.positive.color : pdfStyles.negative.color,
                }}
              >
                {fmt.currency(purchasePrice - maoConservative)}
              </td>
              <td style={pdfStyles.td}>
                {purchasePrice <= maoConservative ? 'Strong Buy' : 'Pass'}
              </td>
            </tr>
            <tr>
              <td style={pdfStyles.td}>
                <div style={{ fontWeight: '500' }}>Moderate</div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>20% profit target</div>
              </td>
              <td style={pdfStyles.tdRight}>{fmt.currency(arv * 0.20)}</td>
              <td style={pdfStyles.tdRight}>{fmt.currency(maoModerate)}</td>
              <td
                style={{
                  ...pdfStyles.tdRight,
                  color: purchasePrice <= maoModerate ? pdfStyles.positive.color : pdfStyles.negative.color,
                }}
              >
                {fmt.currency(purchasePrice - maoModerate)}
              </td>
              <td style={pdfStyles.td}>
                {purchasePrice <= maoModerate ? 'Buy' : 'Negotiate'}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td style={pdfStyles.td}>
                <div style={{ fontWeight: '500' }}>Aggressive</div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>15% profit target</div>
              </td>
              <td style={pdfStyles.tdRight}>{fmt.currency(arv * 0.15)}</td>
              <td style={pdfStyles.tdRight}>{fmt.currency(maoAggressive)}</td>
              <td
                style={{
                  ...pdfStyles.tdRight,
                  color: purchasePrice <= maoAggressive ? pdfStyles.positive.color : pdfStyles.negative.color,
                }}
              >
                {fmt.currency(purchasePrice - maoAggressive)}
              </td>
              <td style={pdfStyles.td}>
                {purchasePrice <= maoAggressive ? 'Consider' : 'High Risk'}
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Divider />

      {/* Investment Breakdown */}
      <Section title="Investment Breakdown">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16pt' }}>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: '600', marginBottom: '8pt' }}>Sources of Funds</div>
            <SummaryTable
              rows={[
                { label: 'Purchase Price', value: fmt.currency(purchasePrice) },
                { label: 'Closing Costs', value: fmt.currency(project.closing_costs) },
                { label: `Holding Costs (${project.hold_months} mo)`, value: fmt.currency(holdingCosts) },
                { label: 'Rehab Budget', value: fmt.currency(project.rehab_budget) },
                { label: `Contingency (${project.contingency_percent}%)`, value: fmt.currency(project.contingency_amount) },
                { label: 'Total Investment', value: fmt.currency(totalInvestment), bold: true },
              ]}
            />
          </div>
          <div>
            <div style={{ fontSize: '10pt', fontWeight: '600', marginBottom: '8pt' }}>Uses of Funds (Exit)</div>
            <SummaryTable
              rows={[
                { label: 'ARV (Sale Price)', value: fmt.currency(arv) },
                { label: `Selling Costs (${project.selling_cost_percent}%)`, value: `(${fmt.currency(sellingCosts)})` },
                { label: 'Net Proceeds', value: fmt.currency(arv - sellingCosts), bold: true },
                { label: '', value: '' },
                { label: 'Less: Total Investment', value: `(${fmt.currency(totalInvestment)})` },
                {
                  label: 'Gross Profit',
                  value: fmt.currency(grossProfit),
                  bold: true,
                  variant: grossProfit >= 0 ? 'positive' : 'negative',
                },
              ]}
            />
          </div>
        </div>
      </Section>

      <Divider />

      {/* Price Per Square Foot Analysis */}
      {project.sqft && (
        <Section title="Per Square Foot Analysis">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12pt' }}>
            <div style={pdfStyles.card}>
              <div style={pdfStyles.metricLabel}>Purchase $/SF</div>
              <div style={{ fontSize: '16pt', fontWeight: '700' }}>{fmt.currency(pricePerSqft)}</div>
            </div>
            <div style={pdfStyles.card}>
              <div style={pdfStyles.metricLabel}>ARV $/SF</div>
              <div style={{ fontSize: '16pt', fontWeight: '700' }}>{fmt.currency(arvPerSqft)}</div>
            </div>
            <div style={pdfStyles.card}>
              <div style={pdfStyles.metricLabel}>Rehab $/SF</div>
              <div style={{ fontSize: '16pt', fontWeight: '700' }}>{fmt.currency(rehabPerSqft)}</div>
            </div>
            <div style={pdfStyles.card}>
              <div style={pdfStyles.metricLabel}>Profit $/SF</div>
              <div
                style={{
                  fontSize: '16pt',
                  fontWeight: '700',
                  color: grossProfit >= 0 ? pdfStyles.positive.color : pdfStyles.negative.color,
                }}
              >
                {fmt.currency(grossProfit / project.sqft)}
              </div>
            </div>
          </div>
        </Section>
      )}

      <Divider />

      {/* Rehab Budget Breakdown */}
      <Section title="Rehab Budget by Category">
        <table style={pdfStyles.table}>
          <thead>
            <tr>
              <th style={pdfStyles.th}>Category</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Amount</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>% of Budget</th>
              <th style={pdfStyles.th}>Distribution</th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.slice(0, 8).map((cat) => (
              <tr key={cat.category}>
                <td style={pdfStyles.td}>{cat.category}</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(cat.total)}</td>
                <td style={pdfStyles.tdRight}>{cat.percent.toFixed(1)}%</td>
                <td style={pdfStyles.td}>
                  <div
                    style={{
                      height: '8pt',
                      backgroundColor: '#e2e8f0',
                      borderRadius: '4pt',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(cat.percent, 100)}%`,
                        backgroundColor: '#3b82f6',
                        borderRadius: '4pt',
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categoryTotals.length > 8 && (
          <div style={{ ...pdfStyles.small, marginTop: '4pt', textAlign: 'center' }}>
            + {categoryTotals.length - 8} more categories totaling{' '}
            {fmt.currency(categoryTotals.slice(8).reduce((sum, c) => sum + c.total, 0))}
          </div>
        )}
      </Section>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: '16pt',
          padding: '12pt',
          backgroundColor: '#f8fafc',
          borderRadius: '4pt',
          fontSize: '8pt',
          color: '#64748b',
        }}
      >
        <strong>Disclaimer:</strong> This investment analysis is based on estimates and projections. Actual results may
        vary. MAO calculations assume all costs are accurately estimated. Conduct independent due diligence before
        making investment decisions.
      </div>
    </div>
  );
}
