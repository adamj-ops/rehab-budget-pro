'use client';

import { Fragment, useMemo, useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IconChevronDown, IconChevronRight, IconLoader2, IconPlus } from '@tabler/icons-react';
import { toast } from 'sonner';

import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import type { BudgetItem } from '@/types';
import { BUDGET_CATEGORIES, STATUS_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetDetailTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  contingencyPercent: number;
}

// Inline editable currency cell
interface EditableCurrencyCellProps {
  value: number | null;
  itemId: string;
  field: keyof BudgetItem;
  onSave: (itemId: string, field: keyof BudgetItem, value: number) => Promise<void>;
  compareValue?: number | null;
  showVariance?: boolean;
  className?: string;
}

function EditableCurrencyCell({
  value,
  itemId,
  field,
  onSave,
  compareValue,
  showVariance = false,
  className,
}: EditableCurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState(value ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value ?? 0);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (editValue !== (value ?? 0)) {
      setIsSaving(true);
      try {
        await onSave(itemId, field, editValue);
      } catch {
        setEditValue(value ?? 0);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value ?? 0);
      setIsEditing(false);
    }
  };

  const variance = showVariance && compareValue !== undefined && compareValue !== null
    ? (value ?? 0) - compareValue
    : null;

  if (isSaving) {
    return (
      <div className="flex items-center justify-end gap-1 text-muted-foreground">
        <IconLoader2 className="size-3 animate-spin" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn('h-7 w-24 text-right tabular-nums px-2', className)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      tabIndex={0}
      role="button"
      className={cn(
        'cursor-pointer rounded px-2 py-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'min-h-[28px] flex items-center justify-end gap-2',
        className
      )}
    >
      <span className="font-medium tabular-nums">{formatCurrency(value ?? 0)}</span>
      {variance !== null && variance !== 0 && (
        <span className={cn(
          'text-xs tabular-nums',
          variance > 0 ? 'text-red-600' : 'text-green-600'
        )}>
          {variance > 0 ? '+' : ''}{Math.round((variance / (compareValue || 1)) * 100)}%
        </span>
      )}
    </div>
  );
}

// Inline editable badge cell for status
interface EditableStatusCellProps {
  value: string;
  itemId: string;
  onSave: (itemId: string, field: keyof BudgetItem, value: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', variant: 'secondary' as const },
  { value: 'in_progress', label: 'In Progress', variant: 'default' as const },
  { value: 'complete', label: 'Complete', variant: 'success' as const },
  { value: 'on_hold', label: 'On Hold', variant: 'outline' as const },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' as const },
];

function EditableStatusCell({ value, itemId, onSave }: EditableStatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  const handleValueChange = async (newValue: string) => {
    setIsOpen(false);
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(itemId, 'status', newValue);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isSaving) {
    return (
      <Badge variant="outline" className="gap-1">
        <IconLoader2 className="size-3 animate-spin" />
      </Badge>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0">
        <Badge
          variant={currentOption.variant}
          className="cursor-pointer hover:opacity-80"
        >
          {currentOption.label}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <Badge variant={option.variant}>{option.label}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
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

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, BudgetItem[]> = {};
    for (const item of budgetItems) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
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
      toast.success('Updated');
    },
    onError: (error) => {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update');
    },
  });

  // Handler for cell saves
  const handleCellSave = async (itemId: string, field: keyof BudgetItem, value: number | string) => {
    await updateMutation.mutateAsync({ id: itemId, data: { [field]: value } });
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
                <th className="text-right p-3 w-32 bg-blue-50">
                  <div className="font-semibold">Underwriting</div>
                  <div className="text-xs font-normal text-muted-foreground">Pre-deal</div>
                </th>
                <th className="text-right p-3 w-32 bg-green-50">
                  <div className="font-semibold">Forecast</div>
                  <div className="text-xs font-normal text-muted-foreground">Post-bid</div>
                </th>
                <th className="text-right p-3 w-32 bg-purple-50">
                  <div className="font-semibold">Actual</div>
                  <div className="text-xs font-normal text-muted-foreground">Real spend</div>
                </th>
                <th className="text-right p-3 w-28">Forecast Var</th>
                <th className="text-right p-3 w-28">Actual Var</th>
                <th className="text-center p-3 w-32">Status</th>
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
                      <td></td>
                    </tr>

                    {/* Item Rows */}
                    {isExpanded && category.items.map((item) => {
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
                          <td className="p-2 text-right">
                            <EditableCurrencyCell
                              value={item.underwriting_amount}
                              itemId={item.id}
                              field="underwriting_amount"
                              onSave={handleCellSave}
                            />
                          </td>
                          <td className="p-2 text-right">
                            <EditableCurrencyCell
                              value={item.forecast_amount}
                              itemId={item.id}
                              field="forecast_amount"
                              onSave={handleCellSave}
                              compareValue={item.underwriting_amount}
                              showVariance
                            />
                          </td>
                          <td className="p-2 text-right">
                            <EditableCurrencyCell
                              value={item.actual_amount}
                              itemId={item.id}
                              field="actual_amount"
                              onSave={handleCellSave}
                              compareValue={item.forecast_amount || item.underwriting_amount}
                              showVariance
                            />
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
                          <td className="p-2 text-center">
                            <EditableStatusCell
                              value={item.status}
                              itemId={item.id}
                              onSave={handleCellSave}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {/* Empty State with Add Button */}
                    {isExpanded && category.items.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-sm text-muted-foreground">
                          No items in this category.{' '}
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                            <IconPlus className="size-3 mr-1" />
                            Add item
                          </Button>
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
                <td className="p-3 text-right font-medium tabular-nums">
                  {formatCurrency(contingencyAmount)}
                </td>
                <td colSpan={3}></td>
              </tr>

              {/* Grand Total Row */}
              <tr className="border-t-2 bg-primary/10">
                <td className="p-3 sticky left-0 bg-primary/10"></td>
                <td className="p-3 font-semibold text-primary sticky left-8 bg-primary/10">
                  GRAND TOTAL
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {formatCurrency(underwritingTotal)}
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {formatCurrency(forecastTotal)}
                </td>
                <td className="p-3 text-right font-semibold tabular-nums">
                  {formatCurrency(actualTotal)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold tabular-nums',
                  forecastVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold tabular-nums',
                  actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)}
                </td>
                <td></td>
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
        <div className="ml-auto text-muted-foreground/70">
          Click any value to edit
        </div>
      </div>
    </div>
  );
}
