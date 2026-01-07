import { PageBreak } from '@fileforge/react-print';
import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  MetricRow,
  Section,
  StatusBadge,
  Badge,
  Divider,
} from '@/components/pdf/shared';
import type { ProjectSummary, BudgetItem, Draw, Vendor } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';

interface VendorSummaryProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  draws: Draw[];
  vendors: Vendor[];
}

export function VendorSummaryReport({
  project,
  budgetItems,
  draws,
  vendors,
}: VendorSummaryProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Get vendors assigned to this project's budget items
  const assignedVendorIds = new Set(
    budgetItems.filter((item) => item.vendor_id).map((item) => item.vendor_id)
  );
  const projectVendors = vendors.filter((v) => assignedVendorIds.has(v.id));

  // Calculate vendor stats
  const vendorStats = projectVendors.map((vendor) => {
    const vendorItems = budgetItems.filter((item) => item.vendor_id === vendor.id);
    const vendorDraws = draws.filter((d) => d.vendor_id === vendor.id);

    const budgetTotal = vendorItems.reduce(
      (sum, item) => sum + (item.forecast_amount || item.underwriting_amount || 0),
      0
    );
    const actualTotal = vendorItems.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    const paidAmount = vendorDraws
      .filter((d) => d.status === 'paid')
      .reduce((sum, d) => sum + d.amount, 0);
    const pendingAmount = vendorDraws
      .filter((d) => d.status !== 'paid')
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      vendor,
      items: vendorItems,
      draws: vendorDraws,
      budgetTotal,
      actualTotal,
      paidAmount,
      pendingAmount,
      itemCount: vendorItems.length,
      completedCount: vendorItems.filter((i) => i.status === 'complete').length,
    };
  });

  // Sort by budget total descending
  vendorStats.sort((a, b) => b.budgetTotal - a.budgetTotal);

  // Group vendors by trade
  const vendorsByTrade = vendorStats.reduce(
    (acc, vs) => {
      const trade = vs.vendor.trade;
      if (!acc[trade]) acc[trade] = [];
      acc[trade].push(vs);
      return acc;
    },
    {} as Record<string, typeof vendorStats>
  );

  // Calculate totals
  const totalBudget = vendorStats.reduce((sum, vs) => sum + vs.budgetTotal, 0);
  const totalActual = vendorStats.reduce((sum, vs) => sum + vs.actualTotal, 0);
  const totalPaid = vendorStats.reduce((sum, vs) => sum + vs.paidAmount, 0);
  const totalPending = vendorStats.reduce((sum, vs) => sum + vs.pendingAmount, 0);

  // Render star rating
  const renderRating = (rating: number | null) => {
    if (!rating) return <span style={{ color: '#94a3b8' }}>No rating</span>;
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    return (
      <span style={{ color: '#f59e0b', letterSpacing: '1pt' }}>
        {stars} <span style={{ color: '#64748b', fontSize: '8pt' }}>({rating.toFixed(1)})</span>
      </span>
    );
  };

  return (
    <div style={pdfStyles.page}>
      <PdfHeader
        title="Vendor Summary"
        subtitle={`${project.address || project.name}${project.city ? `, ${project.city}` : ''}`}
        date={generatedDate}
      />

      <PdfFooter projectName={project.name} confidential />

      {/* Overview Metrics */}
      <Section title="Vendor Overview">
        <MetricRow
          items={[
            { label: 'Total Vendors', value: projectVendors.length.toString(), sublabel: 'Assigned to project' },
            { label: 'Budget Assigned', value: fmt.currency(totalBudget) },
            { label: 'Actual Spent', value: fmt.currency(totalActual) },
            { label: 'Total Paid', value: fmt.currency(totalPaid), variant: 'positive' },
          ]}
        />
        <div style={{ marginTop: '12pt' }}>
          <MetricRow
            items={[
              { label: 'Pending Payments', value: fmt.currency(totalPending), variant: totalPending > 0 ? 'negative' : 'positive' },
              { label: 'Trades Represented', value: Object.keys(vendorsByTrade).length.toString() },
              { label: 'Line Items', value: budgetItems.filter((i) => i.vendor_id).length.toString(), sublabel: 'With vendors assigned' },
              {
                label: 'Completion Rate',
                value: fmt.percent(
                  vendorStats.reduce((sum, vs) => sum + vs.completedCount, 0) /
                    Math.max(vendorStats.reduce((sum, vs) => sum + vs.itemCount, 0), 1) *
                    100
                ),
              },
            ]}
          />
        </div>
      </Section>

      <Divider />

      {/* Vendor Rankings */}
      <Section title="Vendor Rankings by Budget">
        <table style={pdfStyles.table}>
          <thead>
            <tr>
              <th style={pdfStyles.th}>Vendor</th>
              <th style={pdfStyles.th}>Trade</th>
              <th style={{ ...pdfStyles.th, textAlign: 'center' }}>Items</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Budget</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Actual</th>
              <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Paid</th>
              <th style={pdfStyles.th}>Rating</th>
            </tr>
          </thead>
          <tbody>
            {vendorStats.slice(0, 10).map((vs, i) => (
              <tr key={vs.vendor.id}>
                <td style={pdfStyles.td}>
                  <div style={{ fontWeight: '500' }}>{vs.vendor.name}</div>
                  {vs.vendor.contact_name && (
                    <div style={{ fontSize: '8pt', color: '#64748b' }}>{vs.vendor.contact_name}</div>
                  )}
                </td>
                <td style={{ ...pdfStyles.td, fontSize: '9pt' }}>
                  {VENDOR_TRADE_LABELS[vs.vendor.trade] || vs.vendor.trade}
                </td>
                <td style={{ ...pdfStyles.td, textAlign: 'center' }}>
                  {vs.completedCount}/{vs.itemCount}
                </td>
                <td style={pdfStyles.tdRight}>{fmt.currency(vs.budgetTotal)}</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(vs.actualTotal)}</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(vs.paidAmount)}</td>
                <td style={pdfStyles.td}>{renderRating(vs.vendor.rating)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td colSpan={3} style={{ ...pdfStyles.td, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                Total ({vendorStats.length} vendors)
              </td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(totalBudget)}
              </td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(totalActual)}
              </td>
              <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                {fmt.currency(totalPaid)}
              </td>
              <td style={{ ...pdfStyles.td, borderTop: '2px solid #e2e8f0' }}></td>
            </tr>
          </tfoot>
        </table>
      </Section>

      <PageBreak />

      {/* Detailed Vendor Profiles */}
      <Section title="Vendor Profiles">
        {vendorStats.map((vs, index) => (
          <div
            key={vs.vendor.id}
            style={{
              ...pdfStyles.card,
              marginBottom: '12pt',
              pageBreakInside: 'avoid',
            }}
          >
            {/* Vendor Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8pt',
                paddingBottom: '8pt',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <div>
                <div style={{ fontSize: '12pt', fontWeight: '600' }}>{vs.vendor.name}</div>
                <div style={{ fontSize: '9pt', color: '#64748b' }}>
                  {VENDOR_TRADE_LABELS[vs.vendor.trade] || vs.vendor.trade}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={vs.vendor.status} />
                <div style={{ marginTop: '4pt' }}>{renderRating(vs.vendor.rating)}</div>
              </div>
            </div>

            {/* Contact & Qualifications */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt', marginBottom: '8pt' }}>
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>
                  Contact
                </div>
                {vs.vendor.contact_name && <div style={{ fontSize: '9pt' }}>{vs.vendor.contact_name}</div>}
                {vs.vendor.phone && <div style={{ fontSize: '9pt' }}>{vs.vendor.phone}</div>}
                {vs.vendor.email && <div style={{ fontSize: '9pt', color: '#2563eb' }}>{vs.vendor.email}</div>}
              </div>
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase', marginBottom: '2pt' }}>
                  Qualifications
                </div>
                <div style={{ display: 'flex', gap: '4pt', flexWrap: 'wrap' }}>
                  {vs.vendor.licensed && <Badge variant="green">Licensed</Badge>}
                  {vs.vendor.insured && <Badge variant="blue">Insured</Badge>}
                  {vs.vendor.w9_on_file && <Badge variant="gray">W9</Badge>}
                  {vs.vendor.price_level && (
                    <Badge variant="yellow">{vs.vendor.price_level}</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8pt',
                padding: '8pt',
                backgroundColor: '#f8fafc',
                borderRadius: '4pt',
              }}
            >
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Budget</div>
                <div style={{ fontSize: '11pt', fontWeight: '600' }}>{fmt.currency(vs.budgetTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Actual</div>
                <div style={{ fontSize: '11pt', fontWeight: '600' }}>{fmt.currency(vs.actualTotal)}</div>
              </div>
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Paid</div>
                <div style={{ fontSize: '11pt', fontWeight: '600', color: pdfStyles.positive.color }}>
                  {fmt.currency(vs.paidAmount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '8pt', color: '#64748b' }}>Pending</div>
                <div
                  style={{
                    fontSize: '11pt',
                    fontWeight: '600',
                    color: vs.pendingAmount > 0 ? pdfStyles.negative.color : 'inherit',
                  }}
                >
                  {fmt.currency(vs.pendingAmount)}
                </div>
              </div>
            </div>

            {/* Assigned Items */}
            {vs.items.length > 0 && (
              <div style={{ marginTop: '8pt' }}>
                <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase', marginBottom: '4pt' }}>
                  Assigned Items ({vs.items.length})
                </div>
                <table style={{ ...pdfStyles.table, fontSize: '8pt' }}>
                  <thead>
                    <tr>
                      <th style={{ ...pdfStyles.th, fontSize: '8pt', padding: '4pt' }}>Item</th>
                      <th style={{ ...pdfStyles.th, fontSize: '8pt', padding: '4pt', textAlign: 'right' }}>Budget</th>
                      <th style={{ ...pdfStyles.th, fontSize: '8pt', padding: '4pt', textAlign: 'right' }}>Actual</th>
                      <th style={{ ...pdfStyles.th, fontSize: '8pt', padding: '4pt' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vs.items.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td style={{ ...pdfStyles.td, padding: '4pt' }}>{item.item}</td>
                        <td style={{ ...pdfStyles.tdRight, padding: '4pt' }}>
                          {fmt.currency(item.forecast_amount || item.underwriting_amount)}
                        </td>
                        <td style={{ ...pdfStyles.tdRight, padding: '4pt' }}>
                          {fmt.currency(item.actual_amount || 0)}
                        </td>
                        <td style={{ ...pdfStyles.td, padding: '4pt' }}>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vs.items.length > 5 && (
                  <div style={{ fontSize: '8pt', color: '#64748b', marginTop: '4pt', textAlign: 'center' }}>
                    + {vs.items.length - 5} more items
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Unassigned Work */}
      {budgetItems.filter((i) => !i.vendor_id).length > 0 && (
        <>
          <Divider />
          <Section title="Unassigned Work">
            <div style={{ ...pdfStyles.card, backgroundColor: '#fef3c7' }}>
              <div style={{ fontWeight: '600', marginBottom: '8pt' }}>
                {budgetItems.filter((i) => !i.vendor_id).length} line items without vendor assignment
              </div>
              <div style={{ fontSize: '9pt', color: '#92400e' }}>
                Total unassigned budget:{' '}
                {fmt.currency(
                  budgetItems
                    .filter((i) => !i.vendor_id)
                    .reduce((sum, i) => sum + (i.forecast_amount || i.underwriting_amount || 0), 0)
                )}
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
