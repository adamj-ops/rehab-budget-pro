import { PageBottom } from '@fileforge/react-print';

interface PdfFooterProps {
  projectName?: string;
  showPageNumbers?: boolean;
  confidential?: boolean;
}

export function PdfFooter({
  projectName,
  showPageNumbers = true,
  confidential = true,
}: PdfFooterProps) {
  return (
    <PageBottom>
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '8pt',
          marginTop: '16pt',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '8pt',
          color: '#64748b',
        }}
      >
        <div>
          {confidential && (
            <span style={{ fontWeight: '600', marginRight: '8pt' }}>CONFIDENTIAL</span>
          )}
          {projectName && <span>{projectName}</span>}
        </div>
        <div>
          {showPageNumbers && <span>Page </span>}
        </div>
      </div>
    </PageBottom>
  );
}
