'use client';

import { useState, useMemo } from 'react';
import type { CostReference, BudgetCategory } from '@/types';
import { BUDGET_CATEGORIES, UNIT_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { IconSearch } from '@tabler/icons-react';

interface CostReferenceTabProps {
  costReference: CostReference[];
}

export function CostReferenceTab({ costReference }: CostReferenceTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'all'>('all');

  // Filter items
  const filteredItems = useMemo(() => {
    return costReference.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [costReference, searchQuery, selectedCategory]);

  // Group by category
  const groupedItems = useMemo(() => {
    const grouped = new Map<BudgetCategory, CostReference[]>();
    
    filteredItems.forEach((item) => {
      const existing = grouped.get(item.category) || [];
      grouped.set(item.category, [...existing, item]);
    });
    
    return grouped;
  }, [filteredItems]);

  const getCategoryLabel = (category: BudgetCategory) => {
    return BUDGET_CATEGORIES.find((c) => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-medium mb-1">Minneapolis Metro Cost Reference</h3>
        <p className="text-sm text-muted-foreground">
          2025 pricing guide for common rehab items. Use these as estimates when building your budget.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input form-input-with-icon"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as BudgetCategory | 'all')}
          className="form-select"
        >
          <option value="all">All Categories</option>
          {BUDGET_CATEGORIES.filter((c) => c.value !== 'contingency').map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredItems.length} of {costReference.length} items
      </p>

      {/* Cost Reference Table */}
      {filteredItems.length > 0 ? (
        <div className="space-y-6">
          {Array.from(groupedItems.entries()).map(([category, items]) => (
            <div key={category} className="rounded-lg border overflow-hidden">
              <div className="bg-muted px-4 py-2 font-medium">
                {getCategoryLabel(category)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({items.length} items)
                </span>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="table-header border-t">
                    <th className="text-left p-3">Item</th>
                    <th className="text-center p-3 w-16">Unit</th>
                    <th className="text-right p-3 w-24">Low</th>
                    <th className="text-right p-3 w-24">Mid</th>
                    <th className="text-right p-3 w-24">High</th>
                    <th className="text-left p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <p className="font-medium">{item.item}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {UNIT_LABELS[item.unit]}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        {item.low ? formatCurrency(item.low) : '-'}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {item.mid ? formatCurrency(item.mid) : '-'}
                      </td>
                      <td className="p-3 text-right text-red-600">
                        {item.high ? formatCurrency(item.high) : '-'}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No items match your search.</p>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg bg-muted p-6 text-sm">
        <h4 className="font-medium mb-3">Price Guide Legend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-green-600 font-medium">Low:</span>{' '}
            <span className="text-muted-foreground">Budget/builder grade materials, basic labor</span>
          </div>
          <div>
            <span className="font-medium">Mid:</span>{' '}
            <span className="text-muted-foreground">Standard quality, typical for rentals and flips</span>
          </div>
          <div>
            <span className="text-red-600 font-medium">High:</span>{' '}
            <span className="text-muted-foreground">Premium materials, high-end finishes</span>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Prices are estimates for the Minneapolis metro area and may vary based on project specifics,
          vendor availability, and market conditions. Always get multiple quotes.
        </p>
      </div>
    </div>
  );
}
