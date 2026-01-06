import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATTING
// ============================================================================

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyDetailed(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================================================
// CALCULATIONS
// ============================================================================

export function calculateBudget(qty: number, rate: number): number {
  return qty * rate;
}

export function calculateVariance(budget: number, actual: number | null): number {
  return budget - (actual || 0);
}

export function calculateVariancePercent(budget: number, actual: number | null): number {
  if (budget === 0) return 0;
  return ((budget - (actual || 0)) / budget) * 100;
}

export function calculateTotalInvestment(
  purchasePrice: number,
  rehabBudget: number,
  closingCosts: number,
  holdingCostsMonthly: number,
  holdMonths: number,
  arv: number,
  sellingCostPercent: number
): number {
  const holdingCostsTotal = holdingCostsMonthly * holdMonths;
  const sellingCosts = arv * (sellingCostPercent / 100);
  return purchasePrice + rehabBudget + closingCosts + holdingCostsTotal + sellingCosts;
}

export function calculateGrossProfit(arv: number, totalInvestment: number): number {
  return arv - totalInvestment;
}

export function calculateROI(grossProfit: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0;
  return (grossProfit / totalInvestment) * 100;
}

export function calculateMAO(arv: number, rehabBudget: number, rule: number = 0.7): number {
  return arv * rule - rehabBudget;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\s\-\(\)\+]+$/.test(phone);
}

// ============================================================================
// HELPERS
// ============================================================================

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
