import { pdfStyles } from '@/lib/pdf/styles';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Section({ title, subtitle, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '16pt' }}>
      <h2 style={pdfStyles.h2}>{title}</h2>
      {subtitle && <div style={{ ...pdfStyles.small, marginBottom: '8pt' }}>{subtitle}</div>}
      {children}
    </div>
  );
}

interface SubsectionProps {
  title: string;
  children: React.ReactNode;
}

export function Subsection({ title, children }: SubsectionProps) {
  return (
    <div style={{ marginBottom: '12pt' }}>
      <h3 style={pdfStyles.h3}>{title}</h3>
      {children}
    </div>
  );
}

export function Divider() {
  return <div style={pdfStyles.divider} />;
}

export function ThickDivider() {
  return <div style={pdfStyles.dividerThick} />;
}
