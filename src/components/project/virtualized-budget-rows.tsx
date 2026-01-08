'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BudgetItem, Vendor } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { STATUS_LABELS } from '@/types';
import {
  IconEdit,
  IconPhoto,
  IconTrash,
  IconGripVertical,
} from '@tabler/icons-react';

interface VirtualizedBudgetRowsProps {
  items: BudgetItem[];
  onEdit: (item: BudgetItem) => void;
  onDelete: (item: BudgetItem) => void;
  onViewPhotos: (item: BudgetItem) => void;
  isMobile?: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Virtualized budget item rows for performance with large datasets.
 * Uses @tanstack/react-virtual for efficient rendering.
 * Only renders visible rows plus a small overscan buffer.
 */
export function VirtualizedBudgetRows({
  items,
  onEdit,
  onDelete,
  onViewPhotos,
  isMobile = false,
  containerRef,
}: VirtualizedBudgetRowsProps) {
  const ROW_HEIGHT = isMobile ? 72 : 56; // Taller rows on mobile for touch targets

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index];
        const itemForecastVar = (item.forecast_amount || 0) - (item.underwriting_amount || 0);
        const itemActualVar = (item.actual_amount || 0) - ((item.forecast_amount || item.underwriting_amount) || 0);

        return (
          <div
            key={item.id}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <div
              className={cn(
                'flex items-center border-b hover:bg-muted/50 transition-colors',
                isMobile ? 'py-3 px-2' : 'py-2 px-3'
              )}
            >
              {/* Drag handle - hidden on mobile */}
              {!isMobile && (
                <div className="w-8 flex-shrink-0">
                  <button
                    type="button"
                    className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground"
                  >
                    <IconGripVertical className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Item name */}
              <div className={cn('flex-1 min-w-0', isMobile ? 'pr-2' : 'pr-4')}>
                <p className="font-medium text-sm truncate">{item.item}</p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                )}
              </div>

              {/* Amounts */}
              <div className={cn(
                'grid gap-2 text-right tabular-nums',
                isMobile ? 'grid-cols-2 w-32' : 'grid-cols-3 w-72'
              )}>
                {/* Underwriting - hidden on mobile */}
                {!isMobile && (
                  <span className="text-sm">{formatCurrency(item.underwriting_amount)}</span>
                )}
                {/* Forecast */}
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(item.forecast_amount)}
                </span>
                {/* Actual */}
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {formatCurrency(item.actual_amount || 0)}
                </span>
              </div>

              {/* Variance - hidden on mobile */}
              {!isMobile && (
                <div className="w-24 text-right tabular-nums">
                  <span className={cn(
                    'text-sm',
                    itemActualVar > 0 ? 'text-red-600' : itemActualVar < 0 ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    {itemActualVar >= 0 ? '+' : ''}{formatCurrency(itemActualVar)}
                  </span>
                </div>
              )}

              {/* Status */}
              <div className={cn('flex-shrink-0', isMobile ? 'w-20 mx-1' : 'w-28 mx-2')}>
                <span className={cn(
                  'inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap',
                  item.status === 'complete' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  item.status === 'in_progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  item.status === 'not_started' && 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400',
                  item.status === 'on_hold' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  item.status === 'cancelled' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {isMobile 
                    ? STATUS_LABELS[item.status].substring(0, 3)
                    : STATUS_LABELS[item.status]
                  }
                </span>
              </div>

              {/* Actions */}
              <div className={cn(
                'flex items-center gap-1 flex-shrink-0',
                isMobile ? 'w-24' : 'w-28'
              )}>
                <button
                  type="button"
                  onClick={() => onViewPhotos(item)}
                  className={cn(
                    'rounded hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors',
                    isMobile ? 'p-2.5 min-w-[44px] min-h-[44px]' : 'p-1.5'
                  )}
                  title="View photos"
                >
                  <IconPhoto className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className={cn(
                    'rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors',
                    isMobile ? 'p-2.5 min-w-[44px] min-h-[44px]' : 'p-1.5'
                  )}
                  title="Edit item"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  className={cn(
                    'rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors',
                    isMobile ? 'p-2.5 min-w-[44px] min-h-[44px]' : 'p-1.5'
                  )}
                  title="Delete item"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Hook to determine if virtualization should be used based on item count.
 * Virtualization adds overhead for small lists, so only use for large datasets.
 */
export function useVirtualizationThreshold(itemCount: number, threshold: number = 50): boolean {
  return itemCount >= threshold;
}
