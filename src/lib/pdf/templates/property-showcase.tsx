import { PageBreak } from '@fileforge/react-print';
import { pdfStyles } from '@/lib/pdf/styles';
import { pdfFormatters } from '@/lib/pdf/compile';
import {
  PdfHeader,
  PdfFooter,
  Section,
  Divider,
} from '@/components/pdf/shared';
import type { ProjectSummary, BudgetItem, LineItemPhoto } from '@/types';
import { BUDGET_CATEGORIES } from '@/types';

export interface PhotoWithUrl extends LineItemPhoto {
  signedUrl: string | null;
}

interface PropertyShowcaseProps {
  project: ProjectSummary;
  budgetItems: BudgetItem[];
  photos: PhotoWithUrl[];
  companyName?: string;
  companyContact?: string;
  companyWebsite?: string;
}

export function PropertyShowcaseReport({
  project,
  budgetItems,
  photos,
  companyName = 'Rehab Budget Pro',
  companyContact,
  companyWebsite,
}: PropertyShowcaseProps) {
  const fmt = pdfFormatters;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Group photos by type
  const beforePhotos = photos.filter((p) => p.photo_type === 'before' && p.signedUrl);
  const afterPhotos = photos.filter((p) => p.photo_type === 'after' && p.signedUrl);
  const progressPhotos = photos.filter((p) => p.photo_type === 'progress' && p.signedUrl);

  // Group photos by line item for room-by-room comparisons
  const photosByLineItem = new Map<string, { before: PhotoWithUrl[]; after: PhotoWithUrl[]; itemName: string }>();

  budgetItems.forEach((item) => {
    const itemPhotos = photos.filter((p) => p.line_item_id === item.id);
    const before = itemPhotos.filter((p) => p.photo_type === 'before' && p.signedUrl);
    const after = itemPhotos.filter((p) => p.photo_type === 'after' && p.signedUrl);

    if (before.length > 0 || after.length > 0) {
      photosByLineItem.set(item.id, { before, after, itemName: item.item });
    }
  });

  // Calculate key stats
  const totalRehab = project.rehab_budget_with_contingency;
  const roi = project.total_investment > 0 ? (project.gross_profit / project.total_investment) * 100 : 0;

  // Get scope highlights (top completed items by value)
  const completedItems = budgetItems
    .filter((item) => item.status === 'complete')
    .sort((a, b) => (b.actual_amount || b.forecast_amount || 0) - (a.actual_amount || a.forecast_amount || 0));

  // Group completed work by category
  const scopeByCategory = BUDGET_CATEGORIES.map((cat) => {
    const items = completedItems.filter((item) => item.category === cat.value);
    const total = items.reduce((sum, item) => sum + (item.actual_amount || item.forecast_amount || 0), 0);
    return { category: cat.label, items, total };
  }).filter((cat) => cat.items.length > 0);

  return (
    <div style={pdfStyles.page}>
      {/* Hero Section */}
      <div
        style={{
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '32pt 24pt',
          marginBottom: '24pt',
          borderRadius: '8pt',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '10pt',
            textTransform: 'uppercase',
            letterSpacing: '2pt',
            opacity: 0.7,
            marginBottom: '8pt',
          }}
        >
          Property Transformation
        </div>
        <h1
          style={{
            fontSize: '28pt',
            fontWeight: '700',
            margin: '0 0 8pt 0',
            lineHeight: 1.2,
          }}
        >
          {project.address || project.name}
        </h1>
        <div style={{ fontSize: '12pt', opacity: 0.8 }}>
          {project.city && `${project.city}, `}{project.state} {project.zip}
        </div>

        {/* Key Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16pt',
            marginTop: '24pt',
            paddingTop: '24pt',
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.6, textTransform: 'uppercase' }}>Purchase</div>
            <div style={{ fontSize: '18pt', fontWeight: '700' }}>{fmt.currency(project.purchase_price)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.6, textTransform: 'uppercase' }}>Rehab Investment</div>
            <div style={{ fontSize: '18pt', fontWeight: '700' }}>{fmt.currency(totalRehab)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.6, textTransform: 'uppercase' }}>ARV</div>
            <div style={{ fontSize: '18pt', fontWeight: '700', color: '#4ade80' }}>{fmt.currency(project.arv)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9pt', opacity: 0.6, textTransform: 'uppercase' }}>Profit</div>
            <div style={{ fontSize: '18pt', fontWeight: '700', color: '#4ade80' }}>{fmt.currency(project.gross_profit)}</div>
          </div>
        </div>
      </div>

      <PdfFooter projectName={project.name} confidential={false} />

      {/* Property Details */}
      <Section title="Property Details">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12pt',
          }}
        >
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>Type</div>
            <div style={{ fontSize: '14pt', fontWeight: '600' }}>{project.property_type?.toUpperCase() || 'SFH'}</div>
          </div>
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>Beds</div>
            <div style={{ fontSize: '14pt', fontWeight: '600' }}>{project.beds || '-'}</div>
          </div>
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>Baths</div>
            <div style={{ fontSize: '14pt', fontWeight: '600' }}>{project.baths || '-'}</div>
          </div>
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>Sq Ft</div>
            <div style={{ fontSize: '14pt', fontWeight: '600' }}>{fmt.number(project.sqft || 0)}</div>
          </div>
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>Year Built</div>
            <div style={{ fontSize: '14pt', fontWeight: '600' }}>{project.year_built || '-'}</div>
          </div>
          <div style={pdfStyles.card}>
            <div style={pdfStyles.metricLabel}>ROI</div>
            <div style={{ fontSize: '14pt', fontWeight: '600', color: pdfStyles.positive.color }}>
              {fmt.percent(roi)}
            </div>
          </div>
        </div>
      </Section>

      <Divider />

      {/* Before & After Gallery */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <>
          <Section title="The Transformation">
            {/* Side by side comparison grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16pt',
              }}
            >
              {/* Before Column */}
              <div>
                <div
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '8pt 12pt',
                    borderRadius: '4pt 4pt 0 0',
                    fontWeight: '600',
                    fontSize: '11pt',
                    textAlign: 'center',
                  }}
                >
                  BEFORE
                </div>
                <div
                  style={{
                    border: '2px solid #fecaca',
                    borderTop: 'none',
                    borderRadius: '0 0 4pt 4pt',
                    padding: '8pt',
                    minHeight: '200pt',
                    backgroundColor: '#fef2f2',
                  }}
                >
                  {beforePhotos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                      {beforePhotos.slice(0, 4).map((photo, i) => (
                        <div key={photo.id} style={{ position: 'relative' }}>
                          <img
                            src={photo.signedUrl!}
                            alt={photo.caption || `Before ${i + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '150pt',
                              objectFit: 'cover',
                              borderRadius: '4pt',
                            }}
                          />
                          {photo.caption && (
                            <div
                              style={{
                                fontSize: '8pt',
                                color: '#64748b',
                                marginTop: '2pt',
                                textAlign: 'center',
                              }}
                            >
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '180pt',
                        color: '#94a3b8',
                        fontSize: '10pt',
                      }}
                    >
                      No before photos uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* After Column */}
              <div>
                <div
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '8pt 12pt',
                    borderRadius: '4pt 4pt 0 0',
                    fontWeight: '600',
                    fontSize: '11pt',
                    textAlign: 'center',
                  }}
                >
                  AFTER
                </div>
                <div
                  style={{
                    border: '2px solid #bbf7d0',
                    borderTop: 'none',
                    borderRadius: '0 0 4pt 4pt',
                    padding: '8pt',
                    minHeight: '200pt',
                    backgroundColor: '#f0fdf4',
                  }}
                >
                  {afterPhotos.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                      {afterPhotos.slice(0, 4).map((photo, i) => (
                        <div key={photo.id} style={{ position: 'relative' }}>
                          <img
                            src={photo.signedUrl!}
                            alt={photo.caption || `After ${i + 1}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: '150pt',
                              objectFit: 'cover',
                              borderRadius: '4pt',
                            }}
                          />
                          {photo.caption && (
                            <div
                              style={{
                                fontSize: '8pt',
                                color: '#64748b',
                                marginTop: '2pt',
                                textAlign: 'center',
                              }}
                            >
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '180pt',
                        color: '#94a3b8',
                        fontSize: '10pt',
                      }}
                    >
                      No after photos uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>

          <PageBreak />
        </>
      )}

      {/* Scope of Work */}
      <Section title="Scope of Work">
        <div style={{ fontSize: '10pt', color: '#64748b', marginBottom: '12pt' }}>
          Full renovation including the following improvements:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16pt' }}>
          {scopeByCategory.slice(0, 8).map((cat) => (
            <div key={cat.category} style={{ marginBottom: '8pt' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4pt',
                }}
              >
                <span style={{ fontWeight: '600', fontSize: '10pt' }}>{cat.category}</span>
                <span style={{ fontSize: '10pt', color: '#64748b' }}>{fmt.currency(cat.total)}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '16pt', fontSize: '9pt', color: '#475569' }}>
                {cat.items.slice(0, 3).map((item) => (
                  <li key={item.id} style={{ marginBottom: '2pt' }}>{item.item}</li>
                ))}
                {cat.items.length > 3 && (
                  <li style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                    +{cat.items.length - 3} more items
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Investment Summary */}
      <Section title="Investment Summary">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16pt',
          }}
        >
          <div
            style={{
              ...pdfStyles.card,
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9pt', color: '#1e40af', textTransform: 'uppercase', marginBottom: '4pt' }}>
              Total Investment
            </div>
            <div style={{ fontSize: '20pt', fontWeight: '700', color: '#1e40af' }}>
              {fmt.currency(project.total_investment)}
            </div>
            <div style={{ fontSize: '8pt', color: '#3b82f6', marginTop: '4pt' }}>
              Purchase + Rehab + Costs
            </div>
          </div>

          <div
            style={{
              ...pdfStyles.card,
              backgroundColor: '#f0fdf4',
              borderColor: '#bbf7d0',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9pt', color: '#166534', textTransform: 'uppercase', marginBottom: '4pt' }}>
              After Repair Value
            </div>
            <div style={{ fontSize: '20pt', fontWeight: '700', color: '#166534' }}>
              {fmt.currency(project.arv)}
            </div>
            <div style={{ fontSize: '8pt', color: '#22c55e', marginTop: '4pt' }}>
              Estimated Market Value
            </div>
          </div>

          <div
            style={{
              ...pdfStyles.card,
              backgroundColor: '#faf5ff',
              borderColor: '#e9d5ff',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '9pt', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '4pt' }}>
              Gross Profit
            </div>
            <div style={{ fontSize: '20pt', fontWeight: '700', color: '#7c3aed' }}>
              {fmt.currency(project.gross_profit)}
            </div>
            <div style={{ fontSize: '8pt', color: '#a855f7', marginTop: '4pt' }}>
              {fmt.percent(roi)} ROI
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div style={{ marginTop: '16pt' }}>
          <table style={{ ...pdfStyles.table, fontSize: '9pt' }}>
            <tbody>
              <tr>
                <td style={pdfStyles.td}>Purchase Price</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.purchase_price)}</td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>Closing Costs</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.closing_costs)}</td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>Rehab Budget</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.rehab_budget)}</td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>Contingency ({project.contingency_percent}%)</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.contingency_amount)}</td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>Holding Costs ({project.hold_months} mo)</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.holding_costs_total)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <td style={{ ...pdfStyles.td, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                  Total Investment
                </td>
                <td style={{ ...pdfStyles.tdRight, fontWeight: '600', borderTop: '2px solid #e2e8f0' }}>
                  {fmt.currency(project.total_investment)}
                </td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>ARV (Sale Price)</td>
                <td style={pdfStyles.tdRight}>{fmt.currency(project.arv)}</td>
              </tr>
              <tr>
                <td style={pdfStyles.td}>Selling Costs ({project.selling_cost_percent}%)</td>
                <td style={pdfStyles.tdRight}>({fmt.currency(project.selling_costs)})</td>
              </tr>
              <tr style={{ backgroundColor: '#f0fdf4' }}>
                <td style={{ ...pdfStyles.td, fontWeight: '600', color: pdfStyles.positive.color, borderTop: '2px solid #e2e8f0' }}>
                  Gross Profit
                </td>
                <td style={{ ...pdfStyles.tdRight, fontWeight: '600', color: pdfStyles.positive.color, borderTop: '2px solid #e2e8f0' }}>
                  {fmt.currency(project.gross_profit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Progress Photos Gallery (if available) */}
      {progressPhotos.length > 0 && (
        <>
          <PageBreak />
          <Section title="Progress Documentation">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12pt',
              }}
            >
              {progressPhotos.slice(0, 9).map((photo) => (
                <div key={photo.id}>
                  <img
                    src={photo.signedUrl!}
                    alt={photo.caption || 'Progress photo'}
                    style={{
                      width: '100%',
                      height: '120pt',
                      objectFit: 'cover',
                      borderRadius: '4pt',
                    }}
                  />
                  {photo.caption && (
                    <div
                      style={{
                        fontSize: '8pt',
                        color: '#64748b',
                        marginTop: '4pt',
                        textAlign: 'center',
                      }}
                    >
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* Contact / CTA Section */}
      <div
        style={{
          marginTop: '24pt',
          padding: '20pt',
          backgroundColor: '#0f172a',
          color: 'white',
          borderRadius: '8pt',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14pt', fontWeight: '600', marginBottom: '8pt' }}>
          {companyName}
        </div>
        {companyContact && (
          <div style={{ fontSize: '11pt', opacity: 0.8, marginBottom: '4pt' }}>
            {companyContact}
          </div>
        )}
        {companyWebsite && (
          <div style={{ fontSize: '10pt', color: '#60a5fa' }}>
            {companyWebsite}
          </div>
        )}
        <div style={{ fontSize: '9pt', opacity: 0.5, marginTop: '12pt' }}>
          Generated {generatedDate}
        </div>
      </div>
    </div>
  );
}
