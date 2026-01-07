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
  type RoiMethod,
  ROI_METHOD_LABELS,
  ROI_METHOD_DESCRIPTIONS,
} from '@/types';
import { IconChartLine, IconInfoCircle, IconPalette } from '@tabler/icons-react';

interface RoiSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function RoiSettingsSection({ settings, onUpdate }: RoiSettingsSectionProps) {
  const roiMethods: RoiMethod[] = ['simple', 'annualized', 'cash_on_cash', 'irr_simplified'];

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconChartLine className="h-5 w-5" />
            ROI Calculation Method
          </CardTitle>
          <CardDescription>
            Choose how to measure your return on investment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selector */}
          <div className="space-y-3">
            <Label>Calculation Method</Label>
            <Select
              value={settings.roi_method}
              onValueChange={(value: RoiMethod) => onUpdate({ roi_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roiMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex flex-col">
                      <span>{ROI_METHOD_LABELS[method]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconInfoCircle className="h-3 w-3" />
              {ROI_METHOD_DESCRIPTIONS[settings.roi_method]}
            </p>
          </div>

          {/* Formula Display */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <h4 className="font-medium text-sm">Formula</h4>
            {settings.roi_method === 'simple' && (
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">ROI = </span>
                <span className="text-green-500">Gross Profit</span>
                <span className="text-muted-foreground"> ÷ </span>
                <span className="text-blue-500">Total Investment</span>
                <span className="text-muted-foreground"> × 100</span>
              </div>
            )}
            {settings.roi_method === 'annualized' && (
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">ROI = </span>
                <span className="text-green-500">(Profit ÷ Investment)</span>
                <span className="text-muted-foreground"> × </span>
                <span className="text-orange-500">(12 ÷ Hold Months)</span>
                <span className="text-muted-foreground"> × 100</span>
              </div>
            )}
            {settings.roi_method === 'cash_on_cash' && (
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">CoC = </span>
                <span className="text-green-500">Annual Cash Flow</span>
                <span className="text-muted-foreground"> ÷ </span>
                <span className="text-blue-500">Cash Invested</span>
                <span className="text-muted-foreground"> × 100</span>
              </div>
            )}
            {settings.roi_method === 'irr_simplified' && (
              <div className="p-3 bg-background rounded-md border font-mono text-sm">
                <span className="text-muted-foreground">IRR ≈ </span>
                <span className="text-green-500">Annualized Return</span>
                <span className="text-muted-foreground"> adjusted for </span>
                <span className="text-orange-500">Time Value</span>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Annualize Short-Term Returns</Label>
                <p className="text-xs text-muted-foreground">
                  Project ROI to annual rate for comparison
                </p>
              </div>
              <Switch
                checked={settings.roi_annualize}
                onCheckedChange={(checked) => onUpdate({ roi_annualize: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Label>Include Opportunity Cost</Label>
                <p className="text-xs text-muted-foreground">
                  Compare against alternative investment returns
                </p>
              </div>
              <Switch
                checked={settings.roi_include_opportunity_cost}
                onCheckedChange={(checked) => onUpdate({ roi_include_opportunity_cost: checked })}
              />
            </div>

            {settings.roi_include_opportunity_cost && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <div className="flex items-center justify-between">
                  <Label>Alternative Return Rate</Label>
                  <span className="text-sm font-medium tabular-nums">
                    {settings.roi_opportunity_rate.toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[settings.roi_opportunity_rate]}
                  onValueChange={([value]) => onUpdate({ roi_opportunity_rate: value })}
                  min={0}
                  max={15}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  Expected return if money was invested elsewhere (e.g., S&P 500)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ROI Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPalette className="h-5 w-5" />
            ROI Color Thresholds
          </CardTitle>
          <CardDescription>
            Define what ROI levels trigger color indicators in the UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Excellent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <Label>Excellent ROI</Label>
              </div>
              <span className="text-sm font-medium tabular-nums text-green-600">
                ≥ {settings.roi_threshold_excellent.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.roi_threshold_excellent]}
              onValueChange={([value]) => onUpdate({ roi_threshold_excellent: value })}
              min={15}
              max={50}
              step={1}
            />
          </div>

          {/* Good */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <Label>Good ROI</Label>
              </div>
              <span className="text-sm font-medium tabular-nums text-blue-600">
                ≥ {settings.roi_threshold_good.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.roi_threshold_good]}
              onValueChange={([value]) => onUpdate({ roi_threshold_good: value })}
              min={8}
              max={30}
              step={1}
            />
          </div>

          {/* Fair */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <Label>Fair ROI</Label>
              </div>
              <span className="text-sm font-medium tabular-nums text-yellow-600">
                ≥ {settings.roi_threshold_fair.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.roi_threshold_fair]}
              onValueChange={([value]) => onUpdate({ roi_threshold_fair: value })}
              min={3}
              max={20}
              step={1}
            />
          </div>

          {/* Poor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <Label>Poor ROI</Label>
              </div>
              <span className="text-sm font-medium tabular-nums text-red-600">
                &lt; {settings.roi_threshold_poor.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.roi_threshold_poor]}
              onValueChange={([value]) => onUpdate({ roi_threshold_poor: value })}
              min={0}
              max={15}
              step={1}
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-3">Preview</h4>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-700">
                ≥{settings.roi_threshold_excellent}% Excellent
              </span>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-700">
                ≥{settings.roi_threshold_good}% Good
              </span>
              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-700">
                ≥{settings.roi_threshold_fair}% Fair
              </span>
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-700">
                &lt;{settings.roi_threshold_poor}% Poor
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
