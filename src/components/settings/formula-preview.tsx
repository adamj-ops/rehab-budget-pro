'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type CalculationSettingsInput,
  MAO_METHOD_LABELS,
  ROI_METHOD_LABELS,
  CONTINGENCY_METHOD_LABELS,
  HOLDING_COST_METHOD_LABELS,
} from '@/types';
import { IconCode } from '@tabler/icons-react';

interface FormulaPreviewProps {
  settings: CalculationSettingsInput;
  activeTab: string;
}

export function FormulaPreview({ settings, activeTab }: FormulaPreviewProps) {
  const getMaoFormula = () => {
    switch (settings.mao_method) {
      case 'seventy_rule':
        return {
          name: '70% Rule',
          formula: `MAO = ARV × ${(settings.mao_arv_multiplier * 100).toFixed(0)}% - Costs`,
          expanded: `MAO = ARV × ${settings.mao_arv_multiplier.toFixed(2)} - (Rehab + Contingency${settings.mao_include_holding_costs ? ' + Holding' : ''}${settings.mao_include_selling_costs ? ' + Selling' : ''}${settings.mao_include_closing_costs ? ' + Closing' : ''})`,
        };
      case 'custom_percentage':
        return {
          name: 'Custom %',
          formula: `MAO = ARV × ${(settings.mao_arv_multiplier * 100).toFixed(0)}% - Costs`,
          expanded: `MAO = ARV × ${settings.mao_arv_multiplier.toFixed(2)} - TotalCosts`,
        };
      case 'arv_minus_all':
        return {
          name: 'ARV Minus All',
          formula: `MAO = ARV - AllCosts - $${settings.mao_target_profit.toLocaleString()}`,
          expanded: `MAO = ARV - TotalCosts - TargetProfit`,
        };
      case 'gross_margin':
        return {
          name: 'Gross Margin',
          formula: `MAO = ARV × ${(100 - settings.mao_target_profit_percent).toFixed(0)}% - Costs`,
          expanded: `MAO = ARV × (1 - ${settings.mao_target_profit_percent}%) - TotalCosts`,
        };
      case 'net_profit_target':
        return {
          name: 'Net Profit Target',
          formula: `MAO = ARV - Costs - $${settings.mao_target_profit.toLocaleString()}`,
          expanded: `Working backward from desired profit`,
        };
      default:
        return {
          name: 'Standard',
          formula: 'MAO = ARV × 70% - Rehab',
          expanded: '',
        };
    }
  };

  const getRoiFormula = () => {
    switch (settings.roi_method) {
      case 'simple':
        return {
          name: 'Simple ROI',
          formula: 'ROI = Profit / Investment × 100',
          expanded: 'ROI = (ARV - TotalInvestment) / TotalInvestment × 100',
        };
      case 'annualized':
        return {
          name: 'Annualized ROI',
          formula: 'ROI = (Profit / Investment) × (12 / Months) × 100',
          expanded: 'Projects return to annual rate for comparison',
        };
      case 'cash_on_cash':
        return {
          name: 'Cash-on-Cash',
          formula: 'CoC = Annual Cash Flow / Cash Invested × 100',
          expanded: 'Measures return relative to cash deployed',
        };
      case 'irr_simplified':
        return {
          name: 'IRR (Simplified)',
          formula: 'IRR ≈ Annualized Return',
          expanded: 'Approximated internal rate of return',
        };
      default:
        return {
          name: 'ROI',
          formula: 'ROI = Profit / Investment × 100',
          expanded: '',
        };
    }
  };

  const getContingencyFormula = () => {
    switch (settings.contingency_method) {
      case 'flat_percent':
        return {
          name: 'Flat Percentage',
          formula: `Contingency = Budget × ${settings.contingency_default_percent}%`,
          expanded: 'Single rate applied to entire rehab budget',
        };
      case 'category_weighted':
        return {
          name: 'Category-Weighted',
          formula: 'Contingency = Σ(Category × Rate)',
          expanded: 'Different rates for high/medium/low risk categories',
        };
      case 'tiered':
        return {
          name: 'Budget-Tiered',
          formula: 'Contingency = Budget × TierRate',
          expanded: `Rate varies: ${settings.contingency_tiers.map(t =>
            t.max_budget ? `≤$${(t.max_budget/1000).toFixed(0)}k: ${t.percent}%` : `Above: ${t.percent}%`
          ).join(', ')}`,
        };
      case 'scope_based':
        return {
          name: 'Scope-Based',
          formula: `Contingency = Budget × (${settings.contingency_default_percent}% ± Adjustments)`,
          expanded: 'Adjusted for property age, type, and scope',
        };
      default:
        return {
          name: 'Standard',
          formula: 'Contingency = Budget × 10%',
          expanded: '',
        };
    }
  };

  const getHoldingFormula = () => {
    switch (settings.holding_cost_method) {
      case 'flat_monthly':
        return {
          name: 'Flat Monthly',
          formula: `Holding = $${settings.holding_cost_default_monthly.toLocaleString()}/mo × Months`,
          expanded: 'Fixed monthly amount for all carrying costs',
        };
      case 'itemized':
        const total = Object.values(settings.holding_cost_items).reduce((a, b) => a + b, 0);
        return {
          name: 'Itemized',
          formula: `Holding = $${total.toLocaleString()}/mo × Months`,
          expanded: 'Sum of: taxes, insurance, utilities, interest, etc.',
        };
      case 'percentage_of_loan':
        return {
          name: 'Loan-Based',
          formula: `Holding = Purchase × ${settings.holding_cost_loan_rate_annual}% / 12 × Months`,
          expanded: 'Based on annual interest rate of loan',
        };
      case 'hybrid':
        return {
          name: 'Hybrid',
          formula: 'Holding = (Base + Variable) × Months',
          expanded: 'Base rate plus variable components',
        };
      default:
        return {
          name: 'Standard',
          formula: 'Holding = Monthly × Months',
          expanded: '',
        };
    }
  };

  const getSellingFormula = () => {
    const total = settings.selling_cost_agent_commission +
                  settings.selling_cost_buyer_concessions +
                  settings.selling_cost_closing_percent;
    return {
      name: `${total.toFixed(1)}% + Fixed`,
      formula: `Selling = ARV × ${total.toFixed(1)}%${settings.selling_cost_fixed_amount > 0 ? ` + $${settings.selling_cost_fixed_amount.toLocaleString()}` : ''}`,
      expanded: `Agent ${settings.selling_cost_agent_commission}% + Concessions ${settings.selling_cost_buyer_concessions}% + Closing ${settings.selling_cost_closing_percent}%`,
    };
  };

  const getActiveFormula = () => {
    switch (activeTab) {
      case 'mao':
        return getMaoFormula();
      case 'roi':
        return getRoiFormula();
      case 'contingency':
        return getContingencyFormula();
      case 'holding':
        return getHoldingFormula();
      case 'selling':
        return getSellingFormula();
      case 'profit':
        return {
          name: 'Profit Analysis',
          formula: 'Profit = ARV - Total Investment',
          expanded: `Min: $${settings.profit_min_acceptable.toLocaleString()} | Target: $${settings.profit_target.toLocaleString()} | Excellent: $${settings.profit_excellent.toLocaleString()}`,
        };
      case 'alerts':
        return {
          name: 'Variance Alerts',
          formula: settings.variance_alert_enabled
            ? `Warning: ${settings.variance_warning_percent}% | Critical: ${settings.variance_critical_percent}%`
            : 'Alerts Disabled',
          expanded: settings.variance_alert_enabled
            ? `Monitoring: ${[
                settings.variance_alert_on_forecast ? 'Forecast vs Underwriting' : '',
                settings.variance_alert_on_actual ? 'Actual vs Forecast' : '',
              ].filter(Boolean).join(', ') || 'None'}`
            : 'Enable to set thresholds',
        };
      default:
        return { name: '', formula: '', expanded: '' };
    }
  };

  const formula = getActiveFormula();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <IconCode className="h-4 w-4" />
          Current Formula
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 bg-muted rounded-md">
          <div className="text-xs text-muted-foreground mb-1">{formula.name}</div>
          <code className="text-sm font-mono text-primary">{formula.formula}</code>
        </div>
        {formula.expanded && (
          <p className="text-xs text-muted-foreground">
            {formula.expanded}
          </p>
        )}

        {/* All Formulas Summary */}
        <div className="pt-3 border-t mt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            Your Algorithm
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">MAO:</span>
              <span className="font-medium">{MAO_METHOD_LABELS[settings.mao_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ROI:</span>
              <span className="font-medium">{ROI_METHOD_LABELS[settings.roi_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Buffer:</span>
              <span className="font-medium">{CONTINGENCY_METHOD_LABELS[settings.contingency_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holding:</span>
              <span className="font-medium">{HOLDING_COST_METHOD_LABELS[settings.holding_cost_method]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selling:</span>
              <span className="font-medium">{(settings.selling_cost_agent_commission + settings.selling_cost_buyer_concessions + settings.selling_cost_closing_percent).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
