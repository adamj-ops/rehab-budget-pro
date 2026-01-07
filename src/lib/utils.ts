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

import type {
  CalculationSettingsInput,
  MaoMethod,
  RoiMethod,
  ContingencyMethod,
  HoldingCostMethod,
  BudgetCategory,
  ContingencyCategoryRates,
  ContingencyTier,
  HoldingCostItems,
} from '@/types';

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
// CONFIGURABLE CALCULATIONS
// ============================================================================

export interface DealInputs {
  arv: number;
  purchasePrice: number;
  rehabBudget: number;
  closingCosts: number;
  holdMonths: number;
  holdingCostsMonthly?: number;
  categoryBudgets?: Partial<Record<BudgetCategory, number>>;
}

/**
 * Calculate MAO using configurable settings
 */
export function calculateMAOWithSettings(
  inputs: DealInputs,
  settings: CalculationSettingsInput
): number {
  const { arv, rehabBudget, closingCosts, holdMonths, holdingCostsMonthly = 0, categoryBudgets } = inputs;

  // Calculate contingency
  const contingency = calculateContingencyWithSettings(rehabBudget, settings, categoryBudgets);
  const rehabWithContingency = rehabBudget + contingency;

  // Calculate holding costs
  const holdingCosts = calculateHoldingCostsWithSettings(
    inputs.purchasePrice,
    holdMonths,
    settings
  );

  // Calculate selling costs
  const sellingCosts = calculateSellingCostsWithSettings(arv, settings);

  // Build total costs based on what's included
  let totalCosts = rehabWithContingency;
  if (settings.mao_include_holding_costs) totalCosts += holdingCosts;
  if (settings.mao_include_selling_costs) totalCosts += sellingCosts;
  if (settings.mao_include_closing_costs) totalCosts += closingCosts;

  // Calculate MAO based on method
  switch (settings.mao_method) {
    case 'seventy_rule':
    case 'custom_percentage':
      return arv * settings.mao_arv_multiplier - totalCosts;

    case 'arv_minus_all':
    case 'net_profit_target':
      return arv - totalCosts - settings.mao_target_profit;

    case 'gross_margin':
      return arv * (1 - settings.mao_target_profit_percent / 100) - totalCosts;

    default:
      return arv * 0.70 - totalCosts;
  }
}

/**
 * Calculate ROI using configurable settings
 */
export function calculateROIWithSettings(
  grossProfit: number,
  totalInvestment: number,
  holdMonths: number,
  settings: CalculationSettingsInput
): number {
  if (totalInvestment === 0) return 0;

  let roi = (grossProfit / totalInvestment) * 100;

  // Annualize if using annualized method or if setting is enabled
  if (settings.roi_method === 'annualized' || settings.roi_annualize) {
    roi = roi * (12 / holdMonths);
  }

  // Subtract opportunity cost if enabled
  if (settings.roi_include_opportunity_cost) {
    const opportunityReturn = settings.roi_opportunity_rate * (holdMonths / 12);
    roi = roi - opportunityReturn;
  }

  return roi;
}

/**
 * Calculate contingency using configurable settings
 */
export function calculateContingencyWithSettings(
  rehabBudget: number,
  settings: CalculationSettingsInput,
  categoryBudgets?: Partial<Record<BudgetCategory, number>>
): number {
  switch (settings.contingency_method) {
    case 'flat_percent':
      return rehabBudget * (settings.contingency_default_percent / 100);

    case 'category_weighted':
      if (categoryBudgets) {
        return calculateWeightedContingency(categoryBudgets, settings.contingency_category_rates);
      }
      return rehabBudget * (settings.contingency_default_percent / 100);

    case 'tiered':
      return calculateTieredContingency(rehabBudget, settings.contingency_tiers);

    case 'scope_based':
      // Base rate with potential adjustments (simplified)
      return rehabBudget * (settings.contingency_default_percent / 100);

    default:
      return rehabBudget * 0.10;
  }
}

/**
 * Calculate category-weighted contingency
 */
function calculateWeightedContingency(
  categoryBudgets: Partial<Record<BudgetCategory, number>>,
  categoryRates: ContingencyCategoryRates
): number {
  let total = 0;
  for (const [category, budget] of Object.entries(categoryBudgets)) {
    const rate = categoryRates[category as BudgetCategory] || 10;
    total += (budget || 0) * (rate / 100);
  }
  return total;
}

/**
 * Calculate tiered contingency based on budget size
 */
function calculateTieredContingency(
  rehabBudget: number,
  tiers: ContingencyTier[]
): number {
  // Sort tiers by max_budget (nulls last)
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.max_budget === null) return 1;
    if (b.max_budget === null) return -1;
    return a.max_budget - b.max_budget;
  });

  // Find the applicable tier
  const tier = sortedTiers.find(
    (t) => t.max_budget === null || rehabBudget <= t.max_budget
  );

  const rate = tier?.percent || 10;
  return rehabBudget * (rate / 100);
}

/**
 * Calculate holding costs using configurable settings
 */
export function calculateHoldingCostsWithSettings(
  purchasePrice: number,
  holdMonths: number,
  settings: CalculationSettingsInput
): number {
  switch (settings.holding_cost_method) {
    case 'flat_monthly':
      return settings.holding_cost_default_monthly * holdMonths;

    case 'itemized':
      return calculateItemizedHoldingCosts(settings.holding_cost_items, settings) * holdMonths;

    case 'percentage_of_loan':
      const monthlyInterest = purchasePrice * (settings.holding_cost_loan_rate_annual / 100) / 12;
      return monthlyInterest * holdMonths;

    case 'hybrid':
      const baseMonthly = settings.holding_cost_default_monthly;
      const variableMonthly = calculateItemizedHoldingCosts(settings.holding_cost_items, settings);
      return (baseMonthly + variableMonthly) * holdMonths;

    default:
      return settings.holding_cost_default_monthly * holdMonths;
  }
}

/**
 * Calculate itemized holding costs
 */
function calculateItemizedHoldingCosts(
  items: HoldingCostItems,
  settings: CalculationSettingsInput
): number {
  let total = items.loan_interest + items.lawn_care + items.other;

  if (settings.holding_cost_include_taxes) total += items.taxes;
  if (settings.holding_cost_include_insurance) total += items.insurance;
  if (settings.holding_cost_include_utilities) total += items.utilities;
  if (settings.holding_cost_include_hoa) total += items.hoa;

  return total;
}

/**
 * Calculate selling costs using configurable settings
 */
export function calculateSellingCostsWithSettings(
  arv: number,
  settings: CalculationSettingsInput
): number {
  const percentCosts = arv * (
    settings.selling_cost_agent_commission +
    settings.selling_cost_buyer_concessions +
    settings.selling_cost_closing_percent
  ) / 100;

  return percentCosts + settings.selling_cost_fixed_amount;
}

/**
 * Get ROI color class based on settings thresholds
 */
export function getROIColorClass(roi: number, settings: CalculationSettingsInput): string {
  if (roi >= settings.roi_threshold_excellent) return 'text-green-600';
  if (roi >= settings.roi_threshold_good) return 'text-blue-600';
  if (roi >= settings.roi_threshold_fair) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get profit rating based on settings thresholds
 */
export function getProfitRating(
  profit: number,
  settings: CalculationSettingsInput
): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (profit >= settings.profit_excellent) return 'excellent';
  if (profit >= settings.profit_target) return 'good';
  if (profit >= settings.profit_min_acceptable) return 'acceptable';
  return 'poor';
}

/**
 * Check if variance exceeds alert thresholds
 */
export function getVarianceAlertLevel(
  budget: number,
  actual: number,
  settings: CalculationSettingsInput
): 'none' | 'warning' | 'critical' {
  if (!settings.variance_alert_enabled || budget === 0) return 'none';

  const variancePercent = Math.abs((actual - budget) / budget) * 100;

  if (variancePercent >= settings.variance_critical_percent) return 'critical';
  if (variancePercent >= settings.variance_warning_percent) return 'warning';
  return 'none';
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
