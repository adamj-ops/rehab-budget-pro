'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { type CalculationSettingsInput } from '@/types';
import { IconCalculator, IconTrophy, IconTargetArrow, IconAlertTriangle } from '@tabler/icons-react';
import { formatCurrency } from '@/lib/utils';

interface ProfitSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function ProfitSettingsSection({ settings, onUpdate }: ProfitSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Fixed Dollar Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCalculator className="h-5 w-5" />
            Profit Thresholds (Fixed Dollar)
          </CardTitle>
          <CardDescription>
            Define your profit targets in absolute dollar amounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Minimum Acceptable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <Label>Minimum Acceptable Profit</Label>
                  <p className="text-xs text-muted-foreground">Walk away if profit is below this</p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums text-yellow-600">
                {formatCurrency(settings.profit_min_acceptable)}
              </span>
            </div>
            <Slider
              value={[settings.profit_min_acceptable]}
              onValueChange={([value]) => onUpdate({ profit_min_acceptable: value })}
              min={5000}
              max={50000}
              step={1000}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.profit_min_acceptable}
                onChange={(e) => onUpdate({ profit_min_acceptable: Number(e.target.value) })}
                className="pl-7 tabular-nums"
                step={1000}
                min={0}
              />
            </div>
          </div>

          {/* Target Profit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconTargetArrow className="h-4 w-4 text-blue-500" />
                <div>
                  <Label>Target Profit</Label>
                  <p className="text-xs text-muted-foreground">Your standard profit goal</p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums text-blue-600">
                {formatCurrency(settings.profit_target)}
              </span>
            </div>
            <Slider
              value={[settings.profit_target]}
              onValueChange={([value]) => onUpdate({ profit_target: value })}
              min={15000}
              max={75000}
              step={1000}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.profit_target}
                onChange={(e) => onUpdate({ profit_target: Number(e.target.value) })}
                className="pl-7 tabular-nums"
                step={1000}
                min={0}
              />
            </div>
          </div>

          {/* Excellent Profit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconTrophy className="h-4 w-4 text-green-500" />
                <div>
                  <Label>Excellent Profit</Label>
                  <p className="text-xs text-muted-foreground">Home run deal threshold</p>
                </div>
              </div>
              <span className="text-lg font-semibold tabular-nums text-green-600">
                {formatCurrency(settings.profit_excellent)}
              </span>
            </div>
            <Slider
              value={[settings.profit_excellent]}
              onValueChange={([value]) => onUpdate({ profit_excellent: value })}
              min={30000}
              max={150000}
              step={5000}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={settings.profit_excellent}
                onChange={(e) => onUpdate({ profit_excellent: Number(e.target.value) })}
                className="pl-7 tabular-nums"
                step={5000}
                min={0}
              />
            </div>
          </div>

          {/* Visual Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-3">Deal Scoring</h4>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="px-3 py-1.5 rounded-md bg-red-500/20 text-red-700 border border-red-200">
                &lt;{formatCurrency(settings.profit_min_acceptable)} Pass
              </span>
              <span className="px-3 py-1.5 rounded-md bg-yellow-500/20 text-yellow-700 border border-yellow-200">
                {formatCurrency(settings.profit_min_acceptable)}+ Acceptable
              </span>
              <span className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-700 border border-blue-200">
                {formatCurrency(settings.profit_target)}+ Good
              </span>
              <span className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-700 border border-green-200">
                {formatCurrency(settings.profit_excellent)}+ Excellent
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Percentage-Based Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profit Thresholds (Percentage of ARV)</CardTitle>
          <CardDescription>
            Alternative way to evaluate deals based on profit margin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Min Percent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Acceptable Margin</Label>
              <span className="text-lg font-semibold tabular-nums text-yellow-600">
                {settings.profit_min_percent.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.profit_min_percent]}
              onValueChange={([value]) => onUpdate({ profit_min_percent: value })}
              min={5}
              max={20}
              step={1}
            />
          </div>

          {/* Target Percent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Target Margin</Label>
              <span className="text-lg font-semibold tabular-nums text-blue-600">
                {settings.profit_target_percent.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.profit_target_percent]}
              onValueChange={([value]) => onUpdate({ profit_target_percent: value })}
              min={10}
              max={30}
              step={1}
            />
          </div>

          {/* Excellent Percent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Excellent Margin</Label>
              <span className="text-lg font-semibold tabular-nums text-green-600">
                {settings.profit_excellent_percent.toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.profit_excellent_percent]}
              onValueChange={([value]) => onUpdate({ profit_excellent_percent: value })}
              min={15}
              max={40}
              step={1}
            />
          </div>

          {/* Example */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Example: $350,000 ARV</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Min:</span>
                <p className="font-medium tabular-nums">{formatCurrency(350000 * settings.profit_min_percent / 100)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>
                <p className="font-medium tabular-nums">{formatCurrency(350000 * settings.profit_target_percent / 100)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Excellent:</span>
                <p className="font-medium tabular-nums">{formatCurrency(350000 * settings.profit_excellent_percent / 100)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Investment Profiles</CardTitle>
          <CardDescription>
            Quick presets for different investment strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onUpdate({
                profit_min_acceptable: 15000,
                profit_target: 25000,
                profit_excellent: 40000,
                profit_min_percent: 8,
                profit_target_percent: 12,
                profit_excellent_percent: 18,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Volume Flipper</h4>
              <p className="text-sm text-muted-foreground">Lower margins, higher turnover</p>
              <p className="text-xs text-muted-foreground mt-1">Min: $15k / 8%</p>
            </button>

            <button
              onClick={() => onUpdate({
                profit_min_acceptable: 25000,
                profit_target: 40000,
                profit_excellent: 60000,
                profit_min_percent: 10,
                profit_target_percent: 15,
                profit_excellent_percent: 22,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Balanced</h4>
              <p className="text-sm text-muted-foreground">Standard profit expectations</p>
              <p className="text-xs text-muted-foreground mt-1">Min: $25k / 10%</p>
            </button>

            <button
              onClick={() => onUpdate({
                profit_min_acceptable: 40000,
                profit_target: 60000,
                profit_excellent: 100000,
                profit_min_percent: 15,
                profit_target_percent: 20,
                profit_excellent_percent: 30,
              })}
              className="p-4 text-left rounded-lg border hover:border-primary/50 transition-colors"
            >
              <h4 className="font-medium">Cherry Picker</h4>
              <p className="text-sm text-muted-foreground">Only the best deals</p>
              <p className="text-xs text-muted-foreground mt-1">Min: $40k / 15%</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
