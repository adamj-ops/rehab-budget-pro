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
  type MaoMethod,
  MAO_METHOD_LABELS,
  MAO_METHOD_DESCRIPTIONS,
} from '@/types';
import { IconHome, IconInfoCircle } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface MaoSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function MaoSettingsSection({ settings, onUpdate }: MaoSettingsSectionProps) {
  const maoMethods: MaoMethod[] = ['seventy_rule', 'custom_percentage', 'arv_minus_all', 'gross_margin', 'net_profit_target'];

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHome className="h-5 w-5" />
            MAO Calculation Method
          </CardTitle>
          <CardDescription>
            Choose how to calculate your Maximum Allowable Offer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selector */}
          <div className="space-y-3">
            <Label>Calculation Method</Label>
            <Select
              value={settings.mao_method}
              onValueChange={(value: MaoMethod) => onUpdate({ mao_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {maoMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex flex-col">
                      <span>{MAO_METHOD_LABELS[method]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconInfoCircle className="h-3 w-3" />
              {MAO_METHOD_DESCRIPTIONS[settings.mao_method]}
            </p>
          </div>

          {/* Method-specific inputs */}
          {(settings.mao_method === 'seventy_rule' || settings.mao_method === 'custom_percentage') && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>ARV Multiplier</Label>
                  <span className="text-sm font-medium tabular-nums">
                    {(settings.mao_arv_multiplier * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[settings.mao_arv_multiplier * 100]}
                  onValueChange={([value]) => onUpdate({ mao_arv_multiplier: value / 100 })}
                  min={50}
                  max={90}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50% (Conservative)</span>
                  <span>90% (Aggressive)</span>
                </div>
              </div>

              {/* Formula Preview */}
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">MAO = </span>
                <span className="text-blue-500">ARV</span>
                <span className="text-muted-foreground"> × </span>
                <span className="text-green-500">{(settings.mao_arv_multiplier * 100).toFixed(0)}%</span>
                <span className="text-muted-foreground"> − </span>
                <span className="text-orange-500">Costs</span>
              </div>
            </div>
          )}

          {(settings.mao_method === 'arv_minus_all' || settings.mao_method === 'net_profit_target') && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-3">
                <Label>Target Profit (Fixed Amount)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={settings.mao_target_profit}
                    onChange={(e) => onUpdate({ mao_target_profit: Number(e.target.value) })}
                    className="pl-7 tabular-nums"
                    step={5000}
                    min={0}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your minimum acceptable profit on each deal
                </p>
              </div>

              {/* Formula Preview */}
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">MAO = </span>
                <span className="text-blue-500">ARV</span>
                <span className="text-muted-foreground"> − </span>
                <span className="text-orange-500">All Costs</span>
                <span className="text-muted-foreground"> − </span>
                <span className="text-green-500">{formatCurrency(settings.mao_target_profit)}</span>
              </div>
            </div>
          )}

          {settings.mao_method === 'gross_margin' && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Target Profit Margin</Label>
                  <span className="text-sm font-medium tabular-nums">
                    {settings.mao_target_profit_percent.toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[settings.mao_target_profit_percent]}
                  onValueChange={([value]) => onUpdate({ mao_target_profit_percent: value })}
                  min={5}
                  max={40}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5% (Tight)</span>
                  <span>40% (Generous)</span>
                </div>
              </div>

              {/* Formula Preview */}
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">MAO = </span>
                <span className="text-blue-500">ARV</span>
                <span className="text-muted-foreground"> × </span>
                <span className="text-green-500">(1 - {settings.mao_target_profit_percent}%)</span>
                <span className="text-muted-foreground"> − </span>
                <span className="text-orange-500">Costs</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Inclusions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costs to Include in MAO</CardTitle>
          <CardDescription>
            Select which costs to subtract when calculating your max offer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Holding Costs</Label>
              <p className="text-xs text-muted-foreground">Monthly carrying costs × hold period</p>
            </div>
            <Switch
              checked={settings.mao_include_holding_costs}
              onCheckedChange={(checked) => onUpdate({ mao_include_holding_costs: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Selling Costs</Label>
              <p className="text-xs text-muted-foreground">Agent commissions, closing, concessions</p>
            </div>
            <Switch
              checked={settings.mao_include_selling_costs}
              onCheckedChange={(checked) => onUpdate({ mao_include_selling_costs: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Closing Costs (Purchase)</Label>
              <p className="text-xs text-muted-foreground">Title, escrow, and acquisition fees</p>
            </div>
            <Switch
              checked={settings.mao_include_closing_costs}
              onCheckedChange={(checked) => onUpdate({ mao_include_closing_costs: checked })}
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <span className="text-muted-foreground">Costs included: </span>
            <span className="font-medium">
              Rehab + Contingency
              {settings.mao_include_holding_costs && ' + Holding'}
              {settings.mao_include_selling_costs && ' + Selling'}
              {settings.mao_include_closing_costs && ' + Closing'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
