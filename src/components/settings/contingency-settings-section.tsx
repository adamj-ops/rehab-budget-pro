'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type CalculationSettingsInput,
  type ContingencyMethod,
  type BudgetCategory,
  CONTINGENCY_METHOD_LABELS,
  CONTINGENCY_METHOD_DESCRIPTIONS,
  BUDGET_CATEGORIES,
} from '@/types';
import { IconAlertTriangle, IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-react';

interface ContingencySettingsSectionProps {
  settings: CalculationSettingsInput;
  onUpdate: (updates: Partial<CalculationSettingsInput>) => void;
}

export function ContingencySettingsSection({ settings, onUpdate }: ContingencySettingsSectionProps) {
  const contingencyMethods: ContingencyMethod[] = ['flat_percent', 'category_weighted', 'tiered', 'scope_based'];

  const updateCategoryRate = (category: BudgetCategory, rate: number) => {
    onUpdate({
      contingency_category_rates: {
        ...settings.contingency_category_rates,
        [category]: rate,
      },
    });
  };

  const updateTier = (index: number, updates: Partial<{ max_budget: number | null; percent: number }>) => {
    const newTiers = [...settings.contingency_tiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    onUpdate({ contingency_tiers: newTiers });
  };

  const addTier = () => {
    const newTiers = [...settings.contingency_tiers];
    const lastTier = newTiers[newTiers.length - 1];
    // Insert before the unlimited tier
    newTiers.splice(newTiers.length - 1, 0, {
      max_budget: (lastTier.max_budget || 100000) + 50000,
      percent: Math.max(5, (lastTier.percent || 10) - 2),
    });
    onUpdate({ contingency_tiers: newTiers });
  };

  const removeTier = (index: number) => {
    if (settings.contingency_tiers.length > 2) {
      const newTiers = settings.contingency_tiers.filter((_, i) => i !== index);
      onUpdate({ contingency_tiers: newTiers });
    }
  };

  // Group categories by risk level
  const highRiskCategories: BudgetCategory[] = ['structural', 'plumbing', 'hvac', 'electrical', 'exterior', 'bathrooms'];
  const mediumRiskCategories: BudgetCategory[] = ['demo', 'insulation_drywall', 'tile', 'kitchen', 'doors_windows'];
  const lowRiskCategories: BudgetCategory[] = ['soft_costs', 'interior_paint', 'flooring', 'interior_trim', 'landscaping', 'finishing', 'contingency'];

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5" />
            Contingency Calculation Method
          </CardTitle>
          <CardDescription>
            Choose how to calculate your contingency buffer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selector */}
          <div className="space-y-3">
            <Label>Calculation Method</Label>
            <Select
              value={settings.contingency_method}
              onValueChange={(value: ContingencyMethod) => onUpdate({ contingency_method: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contingencyMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    <div className="flex flex-col">
                      <span>{CONTINGENCY_METHOD_LABELS[method]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconInfoCircle className="h-3 w-3" />
              {CONTINGENCY_METHOD_DESCRIPTIONS[settings.contingency_method]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Flat Percentage Settings */}
      {settings.contingency_method === 'flat_percent' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flat Contingency Rate</CardTitle>
            <CardDescription>
              Apply a single percentage to your entire rehab budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Contingency Percentage</Label>
                <span className="text-lg font-semibold tabular-nums text-primary">
                  {settings.contingency_default_percent.toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[settings.contingency_default_percent]}
                onValueChange={([value]) => onUpdate({ contingency_default_percent: value })}
                min={0}
                max={25}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0% (No Buffer)</span>
                <span>10% (Standard)</span>
                <span>25% (Conservative)</span>
              </div>
            </div>

            {/* Formula Preview */}
            <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
              <span className="text-muted-foreground">Contingency = </span>
              <span className="text-blue-500">Rehab Budget</span>
              <span className="text-muted-foreground"> × </span>
              <span className="text-green-500">{settings.contingency_default_percent}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category-Weighted Settings */}
      {settings.contingency_method === 'category_weighted' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category-Specific Rates</CardTitle>
            <CardDescription>
              Set different contingency rates based on risk level of each category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* High Risk */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                High Risk Categories
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {highRiskCategories.map((category) => {
                  const categoryConfig = BUDGET_CATEGORIES.find((c) => c.value === category);
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                      <span className="text-sm">{categoryConfig?.label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.contingency_category_rates[category]}
                          onChange={(e) => updateCategoryRate(category, Number(e.target.value))}
                          className="w-16 h-7 text-sm tabular-nums"
                          min={0}
                          max={30}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medium Risk */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Medium Risk Categories
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {mediumRiskCategories.map((category) => {
                  const categoryConfig = BUDGET_CATEGORIES.find((c) => c.value === category);
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                      <span className="text-sm">{categoryConfig?.label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.contingency_category_rates[category]}
                          onChange={(e) => updateCategoryRate(category, Number(e.target.value))}
                          className="w-16 h-7 text-sm tabular-nums"
                          min={0}
                          max={30}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Low Risk */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Low Risk Categories
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {lowRiskCategories.map((category) => {
                  const categoryConfig = BUDGET_CATEGORIES.find((c) => c.value === category);
                  return (
                    <div key={category} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                      <span className="text-sm">{categoryConfig?.label}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={settings.contingency_category_rates[category]}
                          onChange={(e) => updateCategoryRate(category, Number(e.target.value))}
                          className="w-16 h-7 text-sm tabular-nums"
                          min={0}
                          max={30}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Formula Preview */}
            <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
              <span className="text-muted-foreground">Contingency = Σ(</span>
              <span className="text-blue-500">Category Budget</span>
              <span className="text-muted-foreground"> × </span>
              <span className="text-green-500">Category Rate</span>
              <span className="text-muted-foreground">)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tiered Settings */}
      {settings.contingency_method === 'tiered' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget-Based Tiers</CardTitle>
            <CardDescription>
              Lower contingency percentage as budget size increases
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.contingency_tiers.map((tier, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                <div className="flex-1">
                  {tier.max_budget === null ? (
                    <span className="text-sm font-medium">Above previous tier</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Up to</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          value={tier.max_budget}
                          onChange={(e) => updateTier(index, { max_budget: Number(e.target.value) })}
                          className="w-28 h-8 pl-5 text-sm tabular-nums"
                          step={5000}
                          min={0}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={tier.percent}
                    onChange={(e) => updateTier(index, { percent: Number(e.target.value) })}
                    className="w-16 h-8 text-sm tabular-nums"
                    min={0}
                    max={30}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                {index < settings.contingency_tiers.length - 1 && settings.contingency_tiers.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTier(index)}
                    className="h-8 w-8 p-0"
                  >
                    <IconTrash className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addTier} className="w-full">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>

            {/* Formula Preview */}
            <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
              <span className="text-muted-foreground">Contingency = </span>
              <span className="text-blue-500">Rehab Budget</span>
              <span className="text-muted-foreground"> × </span>
              <span className="text-green-500">Tier Rate</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope-Based Settings */}
      {settings.contingency_method === 'scope_based' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope-Based Contingency</CardTitle>
            <CardDescription>
              Adjust contingency based on project complexity and property type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Base Contingency Rate</Label>
                <span className="text-lg font-semibold tabular-nums text-primary">
                  {settings.contingency_default_percent.toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[settings.contingency_default_percent]}
                onValueChange={([value]) => onUpdate({ contingency_default_percent: value })}
                min={5}
                max={20}
                step={1}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Automatic Adjustments</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• +5% for properties built before 1960</li>
                <li>• +3% for multi-family properties</li>
                <li>• +2% for full gut rehabs</li>
                <li>• -2% for cosmetic-only rehabs</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
