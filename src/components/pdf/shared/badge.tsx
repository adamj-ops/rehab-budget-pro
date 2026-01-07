import { pdfStyles } from '@/lib/pdf/styles';

type BadgeVariant = 'green' | 'blue' | 'yellow' | 'red' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: pdfStyles.badgeGreen,
  blue: pdfStyles.badgeBlue,
  yellow: pdfStyles.badgeYellow,
  red: pdfStyles.badgeRed,
  gray: pdfStyles.badgeGray,
};

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span style={{ ...pdfStyles.badge, ...variantStyles[variant] }}>{children}</span>
  );
}

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getVariant = (): BadgeVariant => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'completed':
      case 'paid':
      case 'sold':
      case 'active':
        return 'green';
      case 'in_progress':
      case 'in progress':
      case 'approved':
      case 'in_rehab':
      case 'listed':
        return 'blue';
      case 'pending':
      case 'under_contract':
      case 'analyzing':
        return 'yellow';
      case 'cancelled':
      case 'dead':
      case 'on_hold':
      case 'do_not_use':
        return 'red';
      default:
        return 'gray';
    }
  };

  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return <Badge variant={getVariant()}>{formatStatus(status)}</Badge>;
}
