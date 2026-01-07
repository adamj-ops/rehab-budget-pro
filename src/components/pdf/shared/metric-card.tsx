import { pdfStyles } from '@/lib/pdf/styles';

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: 'default' | 'positive' | 'negative' | 'primary';
  size?: 'small' | 'medium' | 'large';
}

export function MetricCard({
  label,
  value,
  sublabel,
  variant = 'default',
  size = 'medium',
}: MetricCardProps) {
  const getValueColor = () => {
    switch (variant) {
      case 'positive':
        return pdfStyles.positive.color;
      case 'negative':
        return pdfStyles.negative.color;
      case 'primary':
        return pdfStyles.primary.color;
      default:
        return pdfStyles.metricValue.color;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return '14pt';
      case 'large':
        return '28pt';
      default:
        return '20pt';
    }
  };

  return (
    <div style={pdfStyles.card}>
      <div style={pdfStyles.metricLabel}>{label}</div>
      <div
        style={{
          ...pdfStyles.metricValue,
          fontSize: getFontSize(),
          color: getValueColor(),
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div style={{ ...pdfStyles.small, marginTop: '2pt' }}>{sublabel}</div>
      )}
    </div>
  );
}

interface MetricRowProps {
  items: Array<{
    label: string;
    value: string;
    sublabel?: string;
    variant?: 'default' | 'positive' | 'negative' | 'primary';
  }>;
}

export function MetricRow({ items }: MetricRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: '12pt',
      }}
    >
      {items.map((item, i) => (
        <MetricCard
          key={i}
          label={item.label}
          value={item.value}
          sublabel={item.sublabel}
          variant={item.variant}
        />
      ))}
    </div>
  );
}
