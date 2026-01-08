'use client';

import * as React from 'react';
import { IconCheck, IconX, IconLoader2 } from '@tabler/icons-react';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import type { BudgetItem, ItemStatus, Vendor } from '@/types';
import { STATUS_LABELS, VENDOR_TRADE_LABELS } from '@/types';

interface MobileBudgetEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: BudgetItem | null;
  vendors?: Vendor[];
  onSave: (itemId: string, updates: Partial<BudgetItem>) => Promise<void>;
  isPending?: boolean;
}

export function MobileBudgetEditSheet({
  open,
  onOpenChange,
  item,
  vendors = [],
  onSave,
  isPending = false,
}: MobileBudgetEditSheetProps) {
  const [editValues, setEditValues] = React.useState<Partial<BudgetItem>>({});

  // Reset edit values when item changes
  React.useEffect(() => {
    if (item) {
      setEditValues({
        underwriting_amount: item.underwriting_amount,
        forecast_amount: item.forecast_amount,
        actual_amount: item.actual_amount,
        status: item.status,
        vendor_id: item.vendor_id,
      });
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;
    await onSave(item.id, editValues);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleInputChange = (field: keyof BudgetItem, value: number | string | null) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate variances
  const underwriting = editValues.underwriting_amount ?? item?.underwriting_amount ?? 0;
  const forecast = editValues.forecast_amount ?? item?.forecast_amount ?? 0;
  const actual = editValues.actual_amount ?? item?.actual_amount ?? 0;
  const forecastVariance = forecast - underwriting;
  const actualVariance = actual - (forecast > 0 ? forecast : underwriting);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="text-lg">{item.item}</SheetTitle>
          <SheetDescription className="text-sm">
            {item.description || 'Edit budget item details'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Amount Fields */}
          <div className="grid grid-cols-1 gap-4">
            {/* Underwriting Amount */}
            <div className="space-y-2">
              <Label htmlFor="underwriting" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Underwriting (Pre-deal)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="underwriting"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={editValues.underwriting_amount ?? ''}
                  onChange={(e) => handleInputChange('underwriting_amount', parseFloat(e.target.value) || 0)}
                  className="pl-7 text-right text-lg h-12 tabular-nums"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Forecast Amount */}
            <div className="space-y-2">
              <Label htmlFor="forecast" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Forecast (Post-bid)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="forecast"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={editValues.forecast_amount ?? ''}
                  onChange={(e) => handleInputChange('forecast_amount', parseFloat(e.target.value) || 0)}
                  className="pl-7 text-right text-lg h-12 tabular-nums"
                  placeholder="0.00"
                />
              </div>
              {forecastVariance !== 0 && (
                <p className={cn(
                  'text-xs tabular-nums',
                  forecastVariance > 0 ? 'text-red-500' : 'text-green-500'
                )}>
                  {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)} vs underwriting
                </p>
              )}
            </div>

            {/* Actual Amount */}
            <div className="space-y-2">
              <Label htmlFor="actual" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actual (Real spend)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="actual"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={editValues.actual_amount ?? ''}
                  onChange={(e) => handleInputChange('actual_amount', parseFloat(e.target.value) || 0)}
                  className="pl-7 text-right text-lg h-12 tabular-nums"
                  placeholder="0.00"
                />
              </div>
              {actualVariance !== 0 && (
                <p className={cn(
                  'text-xs tabular-nums',
                  actualVariance > 0 ? 'text-red-500' : 'text-green-500'
                )}>
                  {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)} vs {forecast > 0 ? 'forecast' : 'underwriting'}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </Label>
            <Select
              value={editValues.status || item.status}
              onValueChange={(value) => handleInputChange('status', value as ItemStatus)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-zinc-400" />
                    Not Started
                  </span>
                </SelectItem>
                <SelectItem value="in_progress">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    In Progress
                  </span>
                </SelectItem>
                <SelectItem value="complete">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Complete
                  </span>
                </SelectItem>
                <SelectItem value="on_hold">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    On Hold
                  </span>
                </SelectItem>
                <SelectItem value="cancelled">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Cancelled
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          {vendors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="vendor" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned Vendor
              </Label>
              <Select
                value={editValues.vendor_id || item.vendor_id || 'none'}
                onValueChange={(value) => handleInputChange('vendor_id', value === 'none' ? null : value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No vendor assigned</span>
                  </SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      <span className="flex items-center gap-2">
                        <span>{vendor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({VENDOR_TRADE_LABELS[vendor.trade]})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">Budget Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">UW</p>
                <p className="font-semibold tabular-nums">{formatCurrency(underwriting)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Forecast</p>
                <p className="font-semibold tabular-nums text-blue-500">{formatCurrency(forecast)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actual</p>
                <p className="font-semibold tabular-nums text-purple-500">{formatCurrency(actual)}</p>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 h-12"
          >
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 h-12"
          >
            {isPending ? (
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <IconCheck className="h-4 w-4 mr-2" />
            )}
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
