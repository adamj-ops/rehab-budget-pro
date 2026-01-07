'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconCalculator,
  IconPercentage,
  IconCash,
  IconHome,
  IconAlertTriangle,
  IconChartLine,
  IconSettings,
  IconCode,
  IconPlayerPlay,
  IconDeviceFloppy,
  IconRefresh,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MaoSettingsSection } from '@/components/settings/mao-settings-section';
import { RoiSettingsSection } from '@/components/settings/roi-settings-section';
import { ContingencySettingsSection } from '@/components/settings/contingency-settings-section';
import { HoldingCostSettingsSection } from '@/components/settings/holding-cost-settings-section';
import { SellingCostSettingsSection } from '@/components/settings/selling-cost-settings-section';
import { ProfitSettingsSection } from '@/components/settings/profit-settings-section';
import { VarianceSettingsSection } from '@/components/settings/variance-settings-section';
import { FormulaPreview } from '@/components/settings/formula-preview';
import { DEFAULT_CALCULATION_SETTINGS, type CalculationSettingsInput } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { toast } from 'sonner';

export default function CalculationsSettingsPage() {
  const [settings, setSettings] = useState<CalculationSettingsInput>(DEFAULT_CALCULATION_SETTINGS);
  const [activeTab, setActiveTab] = useState('mao');
  const [hasChanges, setHasChanges] = useState(false);

  // Sample deal for preview calculations
  const sampleDeal = {
    arv: 350000,
    purchasePrice: 200000,
    rehabBudget: 50000,
    closingCosts: 5000,
    holdMonths: 4,
  };

  const updateSettings = (updates: Partial<CalculationSettingsInput>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // TODO: Save to Supabase
    toast.success('Calculation settings saved successfully');
    setHasChanges(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_CALCULATION_SETTINGS);
    setHasChanges(false);
    toast.info('Settings reset to defaults');
  };

  // Calculate preview values based on current settings
  const calculatePreview = () => {
    const { arv, purchasePrice, rehabBudget, closingCosts, holdMonths } = sampleDeal;

    // Holding costs
    let holdingCostsTotal = 0;
    if (settings.holding_cost_method === 'flat_monthly') {
      holdingCostsTotal = settings.holding_cost_default_monthly * holdMonths;
    } else if (settings.holding_cost_method === 'itemized') {
      const items = settings.holding_cost_items;
      holdingCostsTotal = (items.taxes + items.insurance + items.utilities + items.loan_interest + items.hoa + items.lawn_care + items.other) * holdMonths;
    } else if (settings.holding_cost_method === 'percentage_of_loan') {
      holdingCostsTotal = (purchasePrice * (settings.holding_cost_loan_rate_annual / 100) / 12) * holdMonths;
    }

    // Selling costs
    const sellingCosts = arv * (settings.selling_cost_default_percent / 100) + settings.selling_cost_fixed_amount;

    // Contingency
    let contingency = 0;
    if (settings.contingency_method === 'flat_percent') {
      contingency = rehabBudget * (settings.contingency_default_percent / 100);
    } else if (settings.contingency_method === 'tiered') {
      const tier = settings.contingency_tiers.find((t) => t.max_budget === null || rehabBudget <= t.max_budget);
      contingency = rehabBudget * ((tier?.percent || 10) / 100);
    }

    const rehabWithContingency = rehabBudget + contingency;

    // MAO calculation
    let mao = 0;
    const totalCostsForMao =
      rehabWithContingency +
      (settings.mao_include_holding_costs ? holdingCostsTotal : 0) +
      (settings.mao_include_selling_costs ? sellingCosts : 0) +
      (settings.mao_include_closing_costs ? closingCosts : 0);

    switch (settings.mao_method) {
      case 'seventy_rule':
      case 'custom_percentage':
        mao = arv * settings.mao_arv_multiplier - totalCostsForMao;
        break;
      case 'arv_minus_all':
      case 'net_profit_target':
        mao = arv - totalCostsForMao - settings.mao_target_profit;
        break;
      case 'gross_margin':
        mao = arv * (1 - settings.mao_target_profit_percent / 100) - totalCostsForMao;
        break;
    }

    // Total Investment
    const totalInvestment = purchasePrice + rehabWithContingency + closingCosts + holdingCostsTotal + sellingCosts;

    // Profit
    const grossProfit = arv - totalInvestment;

    // ROI
    let roi = 0;
    if (settings.roi_method === 'simple') {
      roi = totalInvestment > 0 ? (grossProfit / totalInvestment) * 100 : 0;
    } else if (settings.roi_method === 'annualized') {
      roi = totalInvestment > 0 ? ((grossProfit / totalInvestment) * (12 / holdMonths)) * 100 : 0;
    }

    return {
      holdingCostsTotal,
      sellingCosts,
      contingency,
      rehabWithContingency,
      mao,
      totalInvestment,
      grossProfit,
      roi,
    };
  };

  const preview = calculatePreview();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <IconCalculator className="h-5 w-5" />
                  Calculation Settings
                </h1>
                <p className="text-sm text-muted-foreground">
                  Customize your deal analysis algorithms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
                <IconDeviceFloppy className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto p-1">
                <TabsTrigger value="mao" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconHome className="h-4 w-4" />
                  <span className="hidden sm:inline">MAO</span>
                </TabsTrigger>
                <TabsTrigger value="roi" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconChartLine className="h-4 w-4" />
                  <span className="hidden sm:inline">ROI</span>
                </TabsTrigger>
                <TabsTrigger value="contingency" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconAlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Buffer</span>
                </TabsTrigger>
                <TabsTrigger value="holding" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconCash className="h-4 w-4" />
                  <span className="hidden sm:inline">Holding</span>
                </TabsTrigger>
                <TabsTrigger value="selling" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconPercentage className="h-4 w-4" />
                  <span className="hidden sm:inline">Selling</span>
                </TabsTrigger>
                <TabsTrigger value="profit" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconCalculator className="h-4 w-4" />
                  <span className="hidden sm:inline">Profit</span>
                </TabsTrigger>
                <TabsTrigger value="alerts" className="flex flex-col gap-1 py-2 px-2 text-xs">
                  <IconSettings className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mao" className="space-y-4">
                <MaoSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="roi" className="space-y-4">
                <RoiSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="contingency" className="space-y-4">
                <ContingencySettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="holding" className="space-y-4">
                <HoldingCostSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="selling" className="space-y-4">
                <SellingCostSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="profit" className="space-y-4">
                <ProfitSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <VarianceSettingsSection settings={settings} onUpdate={updateSettings} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IconPlayerPlay className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <CardDescription className="text-xs">
                  Sample deal: {formatCurrency(sampleDeal.arv)} ARV, {formatCurrency(sampleDeal.rehabBudget)} rehab
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview Stats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">MAO</span>
                    <span className="text-lg font-semibold text-primary tabular-nums">
                      {formatCurrency(preview.mao)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Gross Profit</span>
                    <span className={`text-lg font-semibold tabular-nums ${preview.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(preview.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">ROI</span>
                    <span className={`text-lg font-semibold tabular-nums ${
                      preview.roi >= settings.roi_threshold_excellent ? 'text-green-600' :
                      preview.roi >= settings.roi_threshold_good ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {preview.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Cost Breakdown</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-muted-foreground">Purchase:</span>
                    <span className="text-right tabular-nums">{formatCurrency(sampleDeal.purchasePrice)}</span>
                    <span className="text-muted-foreground">Rehab:</span>
                    <span className="text-right tabular-nums">{formatCurrency(sampleDeal.rehabBudget)}</span>
                    <span className="text-muted-foreground">Contingency:</span>
                    <span className="text-right tabular-nums">{formatCurrency(preview.contingency)}</span>
                    <span className="text-muted-foreground">Closing:</span>
                    <span className="text-right tabular-nums">{formatCurrency(sampleDeal.closingCosts)}</span>
                    <span className="text-muted-foreground">Holding ({sampleDeal.holdMonths}mo):</span>
                    <span className="text-right tabular-nums">{formatCurrency(preview.holdingCostsTotal)}</span>
                    <span className="text-muted-foreground">Selling:</span>
                    <span className="text-right tabular-nums">{formatCurrency(preview.sellingCosts)}</span>
                    <span className="font-medium border-t pt-1">Total:</span>
                    <span className="text-right font-medium tabular-nums border-t pt-1">{formatCurrency(preview.totalInvestment)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formula Preview */}
            <FormulaPreview settings={settings} activeTab={activeTab} />
          </div>
        </div>
      </main>
    </div>
  );
}
