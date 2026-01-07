import { PageTop } from '@fileforge/react-print';
import { pdfStyles } from '@/lib/pdf/styles';

interface PdfHeaderProps {
  title: string;
  subtitle?: string;
  date?: string;
  logoText?: string;
}

export function PdfHeader({ title, subtitle, date, logoText = 'REHAB BUDGET PRO' }: PdfHeaderProps) {
  return (
    <PageTop>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #0f172a',
          paddingBottom: '8pt',
          marginBottom: '16pt',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '8pt',
              fontWeight: '700',
              letterSpacing: '2pt',
              color: '#2563eb',
              marginBottom: '2pt',
            }}
          >
            {logoText}
          </div>
          <h1 style={{ ...pdfStyles.h1, marginBottom: '0' }}>{title}</h1>
          {subtitle && (
            <div style={{ ...pdfStyles.small, marginTop: '4pt' }}>{subtitle}</div>
          )}
        </div>
        {date && (
          <div style={{ textAlign: 'right' }}>
            <div style={pdfStyles.small}>Generated</div>
            <div style={{ fontSize: '10pt', fontWeight: '500' }}>{date}</div>
          </div>
        )}
      </div>
    </PageTop>
  );
}
