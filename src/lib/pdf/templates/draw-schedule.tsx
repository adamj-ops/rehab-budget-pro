import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  MetricRow,
  Section,
  StatusBadge,
  Divider,
} from '@/components/pdf/shared';
import type { ProjectSummary, Draw, Vendor } from '@/types';

interface DrawScheduleProps {
  project: ProjectSummary;
  draws: Draw[];
  vendors: Vendor[];
}

const MILESTONE_LABELS: Record<string, string> = {
  project_start: 'Project Start',
  demo_complete: 'Demo Complete',
  rough_in: 'Rough-In',
  drywall: 'Drywall',
  finishes: 'Finishes',
  final: 'Final',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  check: 'Check',
  zelle: 'Zelle',
  venmo: 'Venmo',
  wire: 'Wire Transfer',
  cash: 'Cash',
  credit_card: 'Credit Card',
  other: 'Other',
};

export function DrawScheduleReport({
  project,
  draws,
  vendors,
}: DrawScheduleProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Create vendor lookup
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  // Sort draws by number
  const sortedDraws = [...draws].sort((a, b) => a.draw_number - b.draw_number);

  // Calculate totals
  const totalRequested = draws.reduce((sum, d) => sum + d.amount, 0);
  const paidDraws = draws.filter((d) => d.status === 'paid');
  const approvedDraws = draws.filter((d) => d.status === 'approved');
  const pendingDraws = draws.filter((d) => d.status === 'pending');

  const totalPaid = paidDraws.reduce((sum, d) => sum + d.amount, 0);
  const totalApproved = approvedDraws.reduce((sum, d) => sum + d.amount, 0);
  const totalPending = pendingDraws.reduce((sum, d) => sum + d.amount, 0);

  // Calculate progress
  const budgetProgress = project.rehab_budget_with_contingency > 0
    ? Math.round((totalPaid / project.rehab_budget_with_contingency) * 100)
    : 0;

  return (
    <div style={pdfStyles.page}>
      <PdfHeader
        title="Draw Schedule"
        subtitle={`${project.address || project.name}${project.city ? `, ${project.city}` : ''}`}
        date={generatedDate}
      />

      <PdfFooter projectName={project.name} confidential />

      {/* Summary Metrics */}
      <Section title="Draw Summary">
        <MetricRow
          items={[
            { label: 'Total Budget', value: fmt.currency(project.rehab_budget_with_contingency), sublabel: 'With contingency' },
            { label: 'Total Paid', value: fmt.currency(totalPaid), variant: 'positive' },
            { label: 'Approved', value: fmt.currency(totalApproved), variant: totalApproved > 0 ? 'primary' : 'default' },
            { label: 'Pending', value: fmt.currency(totalPending), variant: totalPending > 0 ? 'default' : 'positive' },
          ]}
        />
        <div style={{ marginTop: '12pt' }}>
          <MetricRow
            items={[
              { label: 'Total Draws', value: draws.length.toString() },
              { label: 'Paid', value: paidDraws.length.toString(), sublabel: 'draws' },
              { label: 'Remaining', value: fmt.currency(project.rehab_budget_with_contingency - totalPaid), sublabel: 'to fund' },
              { label: 'Budget Funded', value: `${budgetProgress}%` },
            ]}
          />
        </div>
      </Section>

      <Divider />

      {/* Progress Bar */}
      <div style={{ marginBottom: '16pt' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
          <span style={pdfStyles.small}>Funding Progress</span>
          <span style={{ ...pdfStyles.small, fontWeight: '600' }}>{budgetProgress}%</span>
        </div>
        <div
          style={{
            height: '12pt',
            backgroundColor: '#e2e8f0',
            borderRadius: '6pt',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(budgetProgress, 100)}%`,
              backgroundColor: '#22c55e',
              borderRadius: '6pt',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4pt' }}>
          <span style={pdfStyles.small}>{fmt.currency(totalPaid)} paid</span>
          <span style={pdfStyles.small}>{fmt.currency(project.rehab_budget_with_contingency - totalPaid)} remaining</span>
        </div>
      </div>

      <Divider />

      {/* Draw Details Table */}
      <Section title="Draw Details">
        {draws.length === 0 ? (
          <div style={{ ...pdfStyles.card, textAlign: 'center', color: '#64748b' }}>
            No draws have been created yet.
          </div>
        ) : (
          <table style={pdfStyles.table}>
            <thead>
              <tr>
                <th style={pdfStyles.th}>#</th>
                <th style={pdfStyles.th}>Milestone</th>
                <th style={pdfStyles.th}>Vendor</th>
                <th style={{ ...pdfStyles.th, textAlign: 'right' }}>Amount</th>
                <th style={pdfStyles.th}>Status</th>
                <th style={pdfStyles.th}>Requested</th>
                <th style={pdfStyles.th}>Paid</th>
                <th style={pdfStyles.th}>Method</th>
              </tr>
            </thead>
            <tbody>
              {sortedDraws.map((draw) => {
                const vendor = draw.vendor_id ? vendorMap.get(draw.vendor_id) : null;
                return (
                  <tr key={draw.id}>
                    <td style={{ ...pdfStyles.td, fontWeight: '600' }}>
                      #{draw.draw_number}
                    </td>
                    <td style={pdfStyles.td}>
                      {draw.milestone ? MILESTONE_LABELS[draw.milestone] || draw.milestone : '-'}
                    </td>
                    <td style={{ ...pdfStyles.td, fontSize: '8pt' }}>
                      {vendor?.name || '-'}
                    </td>
                    <td style={pdfStyles.tdRight}>{fmt.currency(draw.amount)}</td>
                    <td style={pdfStyles.td}>
                      <StatusBadge status={draw.status} />
                    </td>
                    <td style={pdfStyles.td}>{fmt.date(draw.date_requested)}</td>
                    <td style={pdfStyles.td}>{fmt.date(draw.date_paid)}</td>
                    <td style={{ ...pdfStyles.td, fontSize: '8pt' }}>
                      {draw.payment_method ? PAYMENT_METHOD_LABELS[draw.payment_method] || draw.payment_method : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td
                  colSpan={3}
                  style={{ ...pdfStyles.td, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}
                >
                  Total
                </td>
                <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                  {fmt.currency(totalRequested)}
                </td>
                <td colSpan={4} style={{ ...pdfStyles.td, borderTop: '2px solid #e2e8f0' }}></td>
              </tr>
            </tfoot>
          </table>
        )}
      </Section>

      {/* Draw Notes */}
      {sortedDraws.some((d) => d.notes || d.description) && (
        <>
          <Divider />
          <Section title="Draw Notes">
            {sortedDraws
              .filter((d) => d.notes || d.description)
              .map((draw) => (
                <div key={draw.id} style={{ ...pdfStyles.card, marginBottom: '8pt' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4pt' }}>
                    Draw #{draw.draw_number}
                    {draw.milestone && ` - ${MILESTONE_LABELS[draw.milestone] || draw.milestone}`}
                  </div>
                  {draw.description && (
                    <div style={{ marginBottom: '4pt' }}>{draw.description}</div>
                  )}
                  {draw.notes && (
                    <div style={{ ...pdfStyles.small, fontStyle: 'italic' }}>{draw.notes}</div>
                  )}
                </div>
              ))}
          </Section>
        </>
      )}

      {/* Status Legend */}
      <div style={{ marginTop: '16pt' }}>
        <div style={{ ...pdfStyles.small, marginBottom: '8pt', fontWeight: '600' }}>Status Legend</div>
        <div style={{ display: 'flex', gap: '16pt' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4pt' }}>
            <StatusBadge status="pending" />
            <span style={pdfStyles.small}>Awaiting approval</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4pt' }}>
            <StatusBadge status="approved" />
            <span style={pdfStyles.small}>Approved, awaiting payment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4pt' }}>
            <StatusBadge status="paid" />
            <span style={pdfStyles.small}>Payment completed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
