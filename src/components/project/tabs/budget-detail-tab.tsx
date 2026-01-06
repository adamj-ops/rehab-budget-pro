'use client';

import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconCheck, IconChevronDown, IconChevronRight, IconEdit, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatCurrency, groupBy } from '@/lib/utils';
import type { BudgetItem } from '@/types';
import { BUDGET_CATEGORIES, STATUS_LABELS } from '@/types';

interface BudgetDetailTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  contingencyPercent: number;
}

export function BudgetDetailTab({
  projectId,
  budgetItems,
  contingencyPercent,
}: BudgetDetailTabProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BUDGET_CATEGORIES.map((c) => c.value))
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetItem>>({});

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = groupBy(budgetItems, 'category');
    return BUDGET_CATEGORIES.map((cat) => {
      const items = grouped[cat.value] || [];
      return {
        ...cat,
        items,
        underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
        forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
        actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
      };
    });
  }, [budgetItems]);

  // Calculate totals
  const underwritingTotal = itemsByCategory.reduce((sum, cat) => sum + cat.underwriting, 0);
  const forecastTotal = itemsByCategory.reduce((sum, cat) => sum + cat.forecast, 0);
  const actualTotal = itemsByCategory.reduce((sum, cat) => sum + cat.actual, 0);

  // Use forecast as primary budget if set, otherwise underwriting
  const primaryBudget = forecastTotal > 0 ? forecastTotal : underwritingTotal;
  const contingencyAmount = primaryBudget * (contingencyPercent / 100);

  // Variances
  const forecastVariance = forecastTotal - underwritingTotal;
  const actualVariance = actualTotal - (forecastTotal > 0 ? forecastTotal : underwritingTotal);
  const totalVariance = actualTotal - underwritingTotal;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Mutation for updating budget items
  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<BudgetItem> }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .update(updates.data)
        .eq('id', updates.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Budget item updated');
      setEditingItemId(null);
      setEditValues({});
    },
    onError: (error) => {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update budget item');
    },
  });

  const handleEdit = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditValues({
      underwriting_amount: item.underwriting_amount,
      forecast_amount: item.forecast_amount,
      actual_amount: item.actual_amount,
      status: item.status,
    });
  };

  const handleSave = (itemId: string) => {
    updateMutation.mutate({ id: itemId, data: editValues });
  };

  const handleCancel = () => {
    setEditingItemId(null);
    setEditValues({});
  };

  const handleInputChange = (field: keyof BudgetItem, value: number | string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar - Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted">
        <div>
          <p className="text-sm text-muted-foreground">Underwriting</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(underwritingTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pre-deal estimate</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Forecast</p>
          <p className="text-xl font-semibold text-blue-600 tabular-nums">{formatCurrency(forecastTotal)}</p>
          <p className={cn(
            'text-xs mt-1 tabular-nums',
            forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)} vs UW
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Actual</p>
          <p className="text-xl font-semibold text-purple-600 tabular-nums">{formatCurrency(actualTotal)}</p>
          <p className={cn(
            'text-xs mt-1 tabular-nums',
            actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)} vs Forecast
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Variance</p>
          <p className={cn(
            'text-xl font-semibold tabular-nums',
            totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Actual vs Underwriting</p>
        </div>
      </div>

      {/* Budget Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3 w-8 sticky left-0 bg-muted"></th>
                <th className="text-left p-3 min-w-[200px] sticky left-8 bg-muted">Item</th>
                <th className="text-right p-3 w-28 bg-blue-50">
                  <div className="font-semibold">Underwriting</div>
                  <div className="text-xs font-normal text-muted-foreground">Pre-deal</div>
                </th>
                <th className="text-right p-3 w-28 bg-green-50">
                  <div className="font-semibold">Forecast</div>
                  <div className="text-xs font-normal text-muted-foreground">Post-bid</div>
                </th>
                <th className="text-right p-3 w-28 bg-purple-50">
                  <div className="font-semibold">Actual</div>
                  <div className="text-xs font-normal text-muted-foreground">Real spend</div>
                </th>
                <th className="text-right p-3 w-28">Forecast Var</th>
                <th className="text-right p-3 w-28">Actual Var</th>
                <th className="text-center p-3 w-28">Status</th>
                <th className="text-center p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {itemsByCategory.map((category) => {
                const isExpanded = expandedCategories.has(category.value);
                const catForecastVar = category.forecast - category.underwriting;
                const catActualVar = category.actual - (category.forecast > 0 ? category.forecast : category.underwriting);

                return (
                  <Fragment key={category.value}>
                    {/* Category Header Row */}
                    <tr
                      className="category-header cursor-pointer hover:bg-primary/15"
                      onClick={() => toggleCategory(category.value)}
                    >
                      <td className="p-3 sticky left-0 bg-muted">
                        {isExpanded ? (
                          <IconChevronDown className="h-4 w-4" />
                        ) : (
                          <IconChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="p-3 font-medium sticky left-8 bg-muted">
                        {category.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                          ({category.items.length} items)
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium bg-blue-50/50 tabular-nums">
                        {formatCurrency(category.underwriting)}
                      </td>
                      <td className="p-3 text-right font-medium bg-green-50/50 tabular-nums">
                        {formatCurrency(category.forecast)}
                      </td>
                      <td className="p-3 text-right font-medium bg-purple-50/50 tabular-nums">
                        {formatCurrency(category.actual)}
                      </td>
                      <td className={cn(
                        'p-3 text-right font-medium tabular-nums',
                        catForecastVar >= 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {catForecastVar >= 0 ? '+' : ''}{formatCurrency(catForecastVar)}
                      </td>
                      <td className={cn(
                        'p-3 text-right font-medium tabular-nums',
                        catActualVar >= 0 ? 'text-red-600' : 'text-green-600'
                      )}>
                        {catActualVar >= 0 ? '+' : ''}{formatCurrency(catActualVar)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>

                    {/* Item Rows */}
                    {isExpanded && category.items.map((item) => {
                      const isEditing = editingItemId === item.id;
                      const itemForecastVar = (item.forecast_amount || 0) - (item.underwriting_amount || 0);
                      const itemActualVar = (item.actual_amount || 0) - ((item.forecast_amount || item.underwriting_amount) || 0);

                      return (
                        <tr key={item.id} className="border-t hover:bg-muted/50">
                          <td className="p-3 sticky left-0 bg-background"></td>
                          <td className="p-3 sticky left-8 bg-background">
                            <div>
                              <p className="font-medium">{item.item}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.underwriting_amount ?? ''}
                                onChange={(e) => handleInputChange('underwriting_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.underwriting_amount)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.forecast_amount ?? ''}
                                onChange={(e) => handleInputChange('forecast_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.forecast_amount)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.actual_amount ?? ''}
                                onChange={(e) => handleInputChange('actual_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                                placeholder="0"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.actual_amount || 0)}</span>
                            )}
                          </td>
                          <td className={cn(
                            'p-3 text-right text-sm tabular-nums',
                            itemForecastVar > 0 ? 'text-red-600' : itemForecastVar < 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {itemForecastVar >= 0 ? '+' : ''}{formatCurrency(itemForecastVar)}
                          </td>
                          <td className={cn(
                            'p-3 text-right text-sm tabular-nums',
                            itemActualVar > 0 ? 'text-red-600' : itemActualVar < 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {itemActualVar >= 0 ? '+' : ''}{formatCurrency(itemActualVar)}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <select
                                value={editValues.status || item.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="text-xs p-1 rounded border"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="complete">Complete</option>
                                <option value="on_hold">On Hold</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={cn(
                                'inline-block px-2 py-1 rounded-full text-xs font-medium',
                                item.status === 'complete' && 'bg-green-100 text-green-700',
                                item.status === 'in_progress' && 'bg-blue-100 text-blue-700',
                                item.status === 'not_started' && 'bg-zinc-100 text-zinc-700',
                                item.status === 'on_hold' && 'bg-yellow-100 text-yellow-700',
                                item.status === 'cancelled' && 'bg-red-100 text-red-700'
                              )}>
                                {STATUS_LABELS[item.status]}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSave(item.id)}
                                  className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                                  disabled={updateMutation.isPending}
                                >
                                  <IconCheck className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancel}
                                  className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                  disabled={updateMutation.isPending}
                                >
                                  <IconX className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty State */}
                    {isExpanded && category.items.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-sm text-muted-foreground">
                          No items in this category.{' '}
                          <button type="button" className="text-primary hover:underline">Add one</button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* Contingency Row */}
              <tr className="border-t-2 bg-muted/50">
                <td className="p-3 sticky left-0 bg-muted/50"></td>
                <td className="p-3 font-medium sticky left-8 bg-muted/50">
                  Contingency ({contingencyPercent}%)
                </td>
                <td colSpan={2}></td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(contingencyAmount)}
                </td>
                <td colSpan={4}></td>
              </tr>

              {/* Grand Total Row */}
              <tr className="border-t-2 bg-primary/10">
                <td className="p-3 sticky left-0 bg-primary/10"></td>
                <td className="p-3 font-semibold text-primary sticky left-8 bg-primary/10">
                  GRAND TOTAL
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(underwritingTotal)}
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(forecastTotal)}
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(actualTotal)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold',
                  forecastVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold',
                  actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100"></div>
          <span>Underwriting: Pre-deal estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100"></div>
          <span>Forecast: Post-walkthrough/bid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-100"></div>
          <span>Actual: Real spend</span>
        </div>
      </div>
    </div>
  );
}
