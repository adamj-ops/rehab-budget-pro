'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { type CalculationSettingsInput } from '@/types';
import { IconAlertTriangle, IconBell, IconBellOff } from '@tabler/icons-react';

interface VarianceSettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function VarianceSettingsSection({ settings, onUpdate }: VarianceSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.variance_alert_enabled ? (
              <IconBell className="h-5 w-5 text-primary" />
            ) : (
              <IconBellOff className="h-5 w-5 text-muted-foreground" />
            )}
            Variance Alerts
          </CardTitle>
          <CardDescription>
            Get notified when actual costs deviate from your budget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base">Enable Variance Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Show visual warnings when costs exceed thresholds
              </p>
            </div>
            <Switch
              checked={settings.variance_alert_enabled}
              onCheckedChange={(checked) => onUpdate({ variance_alert_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Thresholds */}
      {settings.variance_alert_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <IconAlertTriangle className="h-5 w-5" />
              Alert Thresholds
            </CardTitle>
            <CardDescription>
              Set the percentage variance that triggers each alert level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Warning Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <Label>Warning Level</Label>
                    <p className="text-xs text-muted-foreground">Yellow indicator</p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums text-yellow-600">
                  {settings.variance_warning_percent.toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[settings.variance_warning_percent]}
                onValueChange={([value]) => onUpdate({ variance_warning_percent: value })}
                min={1}
                max={15}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Alert when variance exceeds {settings.variance_warning_percent}% of budget
              </p>
            </div>

            {/* Critical Level */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <Label>Critical Level</Label>
                    <p className="text-xs text-muted-foreground">Red indicator</p>
                  </div>
                </div>
                <span className="text-lg font-semibold tabular-nums text-red-600">
                  {settings.variance_critical_percent.toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[settings.variance_critical_percent]}
                onValueChange={([value]) => onUpdate({ variance_critical_percent: value })}
                min={5}
                max={30}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Alert when variance exceeds {settings.variance_critical_percent}% of budget
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-3">Example: $10,000 Budget Item</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Within budget</span>
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-700">
                    Up to $10,000
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Warning ({settings.variance_warning_percent}%)</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-700">
                    ${(10000 * (1 + settings.variance_warning_percent / 100)).toLocaleString()} - ${(10000 * (1 + settings.variance_critical_percent / 100)).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Critical ({settings.variance_critical_percent}%)</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-700">
                    &gt;${(10000 * (1 + settings.variance_critical_percent / 100)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Triggers */}
      {settings.variance_alert_enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alert Triggers</CardTitle>
            <CardDescription>
              Choose which variance comparisons trigger alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div>
                <Label>Forecast vs Underwriting</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when forecast deviates from initial estimate
                </p>
              </div>
              <Switch
                checked={settings.variance_alert_on_forecast}
                onCheckedChange={(checked) => onUpdate({ variance_alert_on_forecast: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div>
                <Label>Actual vs Forecast</Label>
                <p className="text-xs text-muted-foreground">
                  Alert when actual spend deviates from forecast
                </p>
              </div>
              <Switch
                checked={settings.variance_alert_on_actual}
                onCheckedChange={(checked) => onUpdate({ variance_alert_on_actual: checked })}
              />
            </div>

            {/* Info box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200 mb-2">
                How Variance Alerts Work
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Alerts appear on budget items and category summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Color-coded indicators highlight problem areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Both positive (under) and negative (over) variances are tracked</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disabled State */}
      {!settings.variance_alert_enabled && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <IconBellOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              Variance Alerts Disabled
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Enable variance alerts above to configure thresholds and get notified when your
              actual costs deviate from your budget.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
