'use client';

import { useState, useMemo } from 'react';
import type { BudgetItem, BudgetCategory } from '@/types';
import { BUDGET_CATEGORIES, UNIT_LABELS, STATUS_LABELS } from '@/types';
import { formatCurrency, cn, groupBy } from '@/lib/utils';
import { IconPlus, IconTrash, IconChevronDown, IconChevronRight } from '@tabler/icons-react';

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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BUDGET_CATEGORIES.map((c) => c.value))
  );

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = groupBy(budgetItems, 'category');
    return BUDGET_CATEGORIES.map((cat) => ({
      ...cat,
      items: grouped[cat.value] || [],
      budget: (grouped[cat.value] || []).reduce((sum, item) => sum + item.qty * item.rate, 0),
      actual: (grouped[cat.value] || []).reduce((sum, item) => sum + (item.actual || 0), 0),
    }));
  }, [budgetItems]);

  // Calculate totals
  const subtotal = itemsByCategory.reduce((sum, cat) => sum + cat.budget, 0);
  const contingencyAmount = subtotal * (contingencyPercent / 100);
  const grandTotal = subtotal + contingencyAmount;
  const totalActual = itemsByCategory.reduce((sum, cat) => sum + cat.actual, 0);
  const totalVariance = grandTotal - totalActual;

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

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-xl font-semibold">{formatCurrency(grandTotal)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual</p>
            <p className="text-xl font-semibold">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={cn(
              'text-xl font-semibold',
              totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {formatCurrency(totalVariance)}
            </p>
          </div>
        </div>
        
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <IconPlus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      {/* Budget Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3 w-8"></th>
              <th className="text-left p-3">Item</th>
              <th className="text-right p-3 w-20">Qty</th>
              <th className="text-center p-3 w-16">Unit</th>
              <th className="text-right p-3 w-24">Rate</th>
              <th className="text-right p-3 w-28">Budget</th>
              <th className="text-right p-3 w-28">Actual</th>
              <th className="text-right p-3 w-28">Variance</th>
              <th className="text-center p-3 w-28">Status</th>
              <th className="text-center p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {itemsByCategory.map((category) => {
              const isExpanded = expandedCategories.has(category.value);
              const variance = category.budget - category.actual;
              
              return (
                <Fragment key={category.value}>
                  {/* Category Header Row */}
                  <tr
                    className="category-header cursor-pointer hover:bg-primary/15"
                    onClick={() => toggleCategory(category.value)}
                  >
                    <td className="p-3">
                      {isExpanded ? (
                        <IconChevronDown className="h-4 w-4" />
                      ) : (
                        <IconChevronRight className="h-4 w-4" />
                      )}
                    </td>
                    <td className="p-3 font-medium" colSpan={4}>
                      {category.label}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({category.items.length} items)
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(category.budget)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {formatCurrency(category.actual)}
                    </td>
                    <td className={cn(
                      'p-3 text-right font-medium',
                      variance >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(variance)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                  
                  {/* Item Rows */}
                  {isExpanded && category.items.map((item) => {
                    const budget = item.qty * item.rate;
                    const itemVariance = budget - (item.actual || 0);
                    
                    return (
                      <tr key={item.id} className="border-t hover:bg-muted/50">
                        <td className="p-3"></td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.item}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.qty}
                            className="w-16 text-right p-1 rounded border bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            readOnly
                          />
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {UNIT_LABELS[item.unit]}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.rate}
                            className="w-20 text-right p-1 rounded border bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            readOnly
                          />
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(budget)}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.actual || ''}
                            placeholder="-"
                            className="w-24 text-right p-1 rounded border bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            readOnly
                          />
                        </td>
                        <td className={cn(
                          'p-3 text-right',
                          itemVariance >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {formatCurrency(itemVariance)}
                        </td>
                        <td className="p-3 text-center">
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
                        </td>
                        <td className="p-3 text-center">
                          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors">
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Empty State */}
                  {isExpanded && category.items.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-sm text-muted-foreground">
                        No items in this category.{' '}
                        <button className="text-primary hover:underline">Add one</button>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            
            {/* Contingency Row */}
            <tr className="border-t-2 bg-muted/50">
              <td className="p-3"></td>
              <td className="p-3 font-medium" colSpan={4}>
                Contingency ({contingencyPercent}%)
              </td>
              <td className="p-3 text-right font-medium">
                {formatCurrency(contingencyAmount)}
              </td>
              <td colSpan={4}></td>
            </tr>
            
            {/* Grand Total Row */}
            <tr className="border-t-2 bg-primary/10">
              <td className="p-3"></td>
              <td className="p-3 font-semibold text-primary" colSpan={4}>
                GRAND TOTAL
              </td>
              <td className="p-3 text-right font-semibold text-primary">
                {formatCurrency(grandTotal)}
              </td>
              <td className="p-3 text-right font-semibold">
                {formatCurrency(totalActual)}
              </td>
              <td className={cn(
                'p-3 text-right font-semibold',
                totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(totalVariance)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Need to import Fragment
import { Fragment } from 'react';
