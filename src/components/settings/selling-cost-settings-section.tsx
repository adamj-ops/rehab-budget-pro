'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { type CalculationSettingsInput } from '@/types';
import { IconPercentage, IconCurrencyDollar } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface SellingCostSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function SellingCostSettingsSection({ settings, onUpdate }: SellingCostSettingsSectionProps) {
  const totalPercent =
    settings.selling_cost_agent_commission +
    settings.selling_cost_buyer_concessions +
    settings.selling_cost_closing_percent;

  return (
    <div className="space-y-6">
      {/* Selling Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPercentage className="h-5 w-5" />
            Selling Cost Breakdown
          </CardTitle>
          <CardDescription>
            Configure the percentage-based costs of selling the property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Commission */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Agent Commission</Label>
                <p className="text-xs text-muted-foreground">Listing + buyer agent fees</p>
              </div>
              <span className="text-lg font-semibold tabular-nums text-primary">
                {settings.selling_cost_agent_commission.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.selling_cost_agent_commission]}
              onValueChange={([value]) => onUpdate({ selling_cost_agent_commission: value })}
              min={0}
              max={7}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% (FSBO)</span>
              <span>5-6% (Standard)</span>
              <span>7% (Full Service)</span>
            </div>
          </div>

          {/* Buyer Concessions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Buyer Concessions</Label>
                <p className="text-xs text-muted-foreground">Closing cost assistance, repairs</p>
              </div>
              <span className="text-lg font-semibold tabular-nums text-primary">
                {settings.selling_cost_buyer_concessions.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.selling_cost_buyer_concessions]}
              onValueChange={([value]) => onUpdate({ selling_cost_buyer_concessions: value })}
              min={0}
              max={5}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0% (No Concessions)</span>
              <span>2-3% (Typical)</span>
              <span>5% (Generous)</span>
            </div>
          </div>

          {/* Seller Closing Costs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Seller Closing Costs</Label>
                <p className="text-xs text-muted-foreground">Title, transfer taxes, escrow</p>
              </div>
              <span className="text-lg font-semibold tabular-nums text-primary">
                {settings.selling_cost_closing_percent.toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.selling_cost_closing_percent]}
              onValueChange={([value]) => onUpdate({ selling_cost_closing_percent: value })}
              min={0}
              max={3}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>1% (Average)</span>
              <span>3% (High Tax Area)</span>
            </div>
          </div>

          {/* Total */}
          <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Selling Costs</span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {totalPercent.toFixed(1)}% of ARV
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              On a $350,000 ARV: {formatCurrency(350000 * (totalPercent / 100))}
            </p>
          </div>

          {/* Formula Preview */}
          <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
            <span className="text-muted-foreground">Selling Costs = </span>
            <span className="text-blue-500">ARV</span>
            <span className="text-muted-foreground"> × (</span>
            <span className="text-green-500">{settings.selling_cost_agent_commission}%</span>
            <span className="text-muted-foreground"> + </span>
            <span className="text-orange-500">{settings.selling_cost_buyer_concessions}%</span>
            <span className="text-muted-foreground"> + </span>
            <span className="text-purple-500">{settings.selling_cost_closing_percent}%</span>
            <span className="text-muted-foreground">)</span>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconCurrencyDollar className="h-5 w-5" />
            Additional Fixed Costs
          </CardTitle>
          <CardDescription>
            One-time costs that don't scale with sale price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Fixed Selling Costs</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.selling_cost_fixed_amount}
                onChange={(e) => onUpdate({ selling_cost_fixed_amount: Number(e.target.value) })}
                className="pl-7 tabular-nums"
                step={500}
                min={0}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Home warranty, staging, photography, marketing, etc.
            </p>
          </div>

          {/* Common presets */}
          <div className="flex flex-wrap gap-2">
            {[0, 1000, 2500, 5000, 7500].map((amount) => (
              <button
                key={amount}
                onClick={() => onUpdate({ selling_cost_fixed_amount: amount })}
                className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                  settings.selling_cost_fixed_amount === amount
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {amount === 0 ? 'None' : formatCurrency(amount)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Presets</CardTitle>
          <CardDescription>
            Common selling cost configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onUpdate({
                selling_cost_agent_commission: 6,
                selling_cost_buyer_concessions: 2,
                selling_cost_closing_percent: 1,
                selling_cost_fixed_amount: 2500,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Conservative</h4>
              <p className="text-sm text-muted-foreground">11.5% total (6+2+1%) + $2,500</p>
            </button>

            <button
              onClick={() => onUpdate({
                selling_cost_agent_commission: 5,
                selling_cost_buyer_concessions: 2,
                selling_cost_closing_percent: 1,
                selling_cost_fixed_amount: 0,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Standard</h4>
              <p className="text-sm text-muted-foreground">8% total (5+2+1%)</p>
            </button>

            <button
              onClick={() => onUpdate({
                selling_cost_agent_commission: 4,
                selling_cost_buyer_concessions: 1,
                selling_cost_closing_percent: 1,
                selling_cost_fixed_amount: 0,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Aggressive</h4>
              <p className="text-sm text-muted-foreground">6% total (4+1+1%)</p>
            </button>

            <button
              onClick={() => onUpdate({
                selling_cost_agent_commission: 0,
                selling_cost_buyer_concessions: 2,
                selling_cost_closing_percent: 1,
                selling_cost_fixed_amount: 5000,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">FSBO</h4>
              <p className="text-sm text-muted-foreground">3% (no agent) + $5,000 marketing</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
