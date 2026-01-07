'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CalculationSettingsInput,
  type HoldingCostMethod,
  HOLDING_COST_METHOD_LABELS,
  HOLDING_COST_METHOD_DESCRIPTIONS,
} from '@/types';
import { IconCash, IconInfoCircle, IconReceipt } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface HoldingCostSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function HoldingCostSettingsSection({ settings, onUpdate }: HoldingCostSettingsSectionProps) {
  const holdingCostMethods: HoldingCostMethod[] = ['flat_monthly', 'itemized', 'percentage_of_loan', 'hybrid'];

  const updateHoldingCostItem = (item: keyof typeof settings.holding_cost_items, value: number) => {
    onUpdate({
      holding_cost_items: {
        ...settings.holding_cost_items,
        [item]: value,
      },
    });
  };

  const totalItemizedCost = Object.values(settings.holding_cost_items).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCash className="h-5 w-5" />
            Holding Cost Calculation
          </CardTitle>
          <CardDescription>
            Choose how to calculate monthly carrying costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selector */}
          <div className="space-y-3">
            <Label>Calculation Method</Label>
            <Select
              value={settings.holding_cost_method}
              onValueChange={(value: HoldingCostMethod) => onUpdate({ holding_cost_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {holdingCostMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex flex-col">
                      <span>{HOLDING_COST_METHOD_LABELS[method]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconInfoCircle className="h-3 w-3" />
              {HOLDING_COST_METHOD_DESCRIPTIONS[settings.holding_cost_method]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flat Monthly Settings */}
      {settings.holding_cost_method === 'flat_monthly' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flat Monthly Rate</CardTitle>
            <CardDescription>
              Set a fixed monthly amount for all holding costs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Monthly Holding Cost</Label>
                <span className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(settings.holding_cost_default_monthly)}
                </span>
              </div>
              <Slider
                value={[settings.holding_cost_default_monthly]}
                onValueChange={([value]) => onUpdate({ holding_cost_default_monthly: value })}
                min={500}
                max={5000}
                step={100}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$500/mo</span>
                <span>$2,500/mo</span>
                <span>$5,000/mo</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[1000, 1500, 2000, 2500, 3000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => onUpdate({ holding_cost_default_monthly: amount })}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    settings.holding_cost_default_monthly === amount
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {/* Formula Preview */}
            <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
              <span className="text-muted-foreground">Total Holding = </span>
              <span className="text-green-500">{formatCurrency(settings.holding_cost_default_monthly)}</span>
              <span className="text-muted-foreground"> × </span>
              <span className="text-blue-500">Hold Months</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itemized Settings */}
      {(settings.holding_cost_method === 'itemized' || settings.holding_cost_method === 'hybrid') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconReceipt className="h-4 w-4" />
              Itemized Monthly Costs
            </CardTitle>
            <CardDescription>
              Break down your monthly holding costs by category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Loan Interest */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <Label>Loan Interest</Label>
                  <p className="text-xs text-muted-foreground">Monthly interest payment</p>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.loan_interest}
                    onChange={(e) => updateHoldingCostItem('loan_interest', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    step={50}
                    min={0}
                  />
                </div>
              </div>

              {/* Property Taxes */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.holding_cost_include_taxes}
                    onCheckedChange={(checked) => onUpdate({ holding_cost_include_taxes: checked })}
                  />
                  <div>
                    <Label>Property Taxes</Label>
                    <p className="text-xs text-muted-foreground">Monthly tax escrow</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.taxes}
                    onChange={(e) => updateHoldingCostItem('taxes', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    disabled={!settings.holding_cost_include_taxes}
                    step={25}
                    min={0}
                  />
                </div>
              </div>

              {/* Insurance */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.holding_cost_include_insurance}
                    onCheckedChange={(checked) => onUpdate({ holding_cost_include_insurance: checked })}
                  />
                  <div>
                    <Label>Insurance</Label>
                    <p className="text-xs text-muted-foreground">Builder's risk / hazard</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.insurance}
                    onChange={(e) => updateHoldingCostItem('insurance', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    disabled={!settings.holding_cost_include_insurance}
                    step={25}
                    min={0}
                  />
                </div>
              </div>

              {/* Utilities */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.holding_cost_include_utilities}
                    onCheckedChange={(checked) => onUpdate({ holding_cost_include_utilities: checked })}
                  />
                  <div>
                    <Label>Utilities</Label>
                    <p className="text-xs text-muted-foreground">Electric, gas, water</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.utilities}
                    onChange={(e) => updateHoldingCostItem('utilities', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    disabled={!settings.holding_cost_include_utilities}
                    step={25}
                    min={0}
                  />
                </div>
              </div>

              {/* HOA */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.holding_cost_include_hoa}
                    onCheckedChange={(checked) => onUpdate({ holding_cost_include_hoa: checked })}
                  />
                  <div>
                    <Label>HOA Fees</Label>
                    <p className="text-xs text-muted-foreground">Association dues</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.hoa}
                    onChange={(e) => updateHoldingCostItem('hoa', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    disabled={!settings.holding_cost_include_hoa}
                    step={25}
                    min={0}
                  />
                </div>
              </div>

              {/* Lawn Care */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <Label>Lawn Care / Maintenance</Label>
                  <p className="text-xs text-muted-foreground">Yard upkeep during rehab</p>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.lawn_care}
                    onChange={(e) => updateHoldingCostItem('lawn_care', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    step={25}
                    min={0}
                  />
                </div>
              </div>

              {/* Other */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div>
                  <Label>Other</Label>
                  <p className="text-xs text-muted-foreground">Miscellaneous costs</p>
                </div>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    value={settings.holding_cost_items.other}
                    onChange={(e) => updateHoldingCostItem('other', Number(e.target.value))}
                    className="w-24 pl-5 tabular-nums"
                    step={25}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <span className="font-medium">Monthly Total</span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {formatCurrency(totalItemizedCost)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Percentage of Loan Settings */}
      {settings.holding_cost_method === 'percentage_of_loan' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Loan-Based Calculation</CardTitle>
            <CardDescription>
              Calculate monthly costs as a percentage of the purchase price
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Annual Interest Rate</Label>
                <span className="text-lg font-semibold tabular-nums text-primary">
                  {settings.holding_cost_loan_rate_annual.toFixed(1)}%
                </span>
              </div>
              <Slider
                value={[settings.holding_cost_loan_rate_annual]}
                onValueChange={([value]) => onUpdate({ holding_cost_loan_rate_annual: value })}
                min={6}
                max={18}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6% (Bank)</span>
                <span>12% (Hard Money)</span>
                <span>18% (Private)</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2">
              {[8, 10, 12, 14, 15].map((rate) => (
                <button
                  key={rate}
                  onClick={() => onUpdate({ holding_cost_loan_rate_annual: rate })}
                  className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                    settings.holding_cost_loan_rate_annual === rate
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>

            {/* Formula Preview */}
            <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
              <span className="text-muted-foreground">Monthly Interest = </span>
              <span className="text-blue-500">Purchase Price</span>
              <span className="text-muted-foreground"> × </span>
              <span className="text-green-500">{settings.holding_cost_loan_rate_annual}%</span>
              <span className="text-muted-foreground"> ÷ 12</span>
            </div>

            {/* Example calculation */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Example</h4>
              <p className="text-sm text-muted-foreground">
                On a $200,000 purchase: {formatCurrency(200000 * (settings.holding_cost_loan_rate_annual / 100) / 12)}/month in interest
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
