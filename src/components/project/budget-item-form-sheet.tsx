'use client'

import * as React from 'react'
import type { BudgetCategory, BudgetItemInput, UnitType, Vendor, CostType, ItemStatus } from '@/types'
import { BUDGET_CATEGORIES, UNIT_LABELS, VENDOR_TRADE_LABELS } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconLoader2 } from '@tabler/icons-react'

interface BudgetItemFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: BudgetCategory
  vendors: Vendor[]
  onSubmit: (item: Partial<BudgetItemInput>) => void
  isPending?: boolean
}

const UNIT_OPTIONS: UnitType[] = ['sf', 'lf', 'ea', 'ls', 'sq', 'hr', 'day', 'week', 'month', 'load', 'ton', 'set', 'opening']
const COST_TYPE_OPTIONS: { value: CostType; label: string }[] = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'both', label: 'Labor & Materials' },
]
const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Complete' },
  { value: 'on_hold', label: 'On Hold' },
]
const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export function BudgetItemFormSheet({
  open,
  onOpenChange,
  category,
  vendors,
  onSubmit,
  isPending = false,
}: BudgetItemFormSheetProps) {
  const [formData, setFormData] = React.useState<Partial<BudgetItemInput>>({
    category,
    item: '',
    description: '',
    room_area: '',
    qty: 1,
    unit: 'ea',
    rate: 0,
    underwriting_amount: 0,
    forecast_amount: 0,
    actual_amount: null,
    cost_type: 'both',
    status: 'not_started',
    priority: 'medium',
    vendor_id: null,
    notes: '',
  })

  const [useManualAmount, setUseManualAmount] = React.useState(false)

  // Reset form when category changes or sheet opens
  React.useEffect(() => {
    if (open) {
      setFormData({
        category,
        item: '',
        description: '',
        room_area: '',
        qty: 1,
        unit: 'ea',
        rate: 0,
        underwriting_amount: 0,
        forecast_amount: 0,
        actual_amount: null,
        cost_type: 'both',
        status: 'not_started',
        priority: 'medium',
        vendor_id: null,
        notes: '',
      })
      setUseManualAmount(false)
    }
  }, [category, open])

  // Auto-calculate underwriting amount from qty * rate
  React.useEffect(() => {
    if (!useManualAmount) {
      const calculatedAmount = (formData.qty || 0) * (formData.rate || 0)
      setFormData((prev) => ({ ...prev, underwriting_amount: calculatedAmount }))
    }
  }, [formData.qty, formData.rate, useManualAmount])

  const handleChange = (field: keyof BudgetItemInput, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.item?.trim()) return
    onSubmit(formData)
    onOpenChange(false)
  }

  const categoryLabel = BUDGET_CATEGORIES.find((c) => c.value === category)?.label || category

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Add Line Item</SheetTitle>
          <SheetDescription>
            Add a new item to {categoryLabel}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="item">Item Name *</Label>
            <Input
              id="item"
              value={formData.item || ''}
              onChange={(e) => handleChange('item', e.target.value)}
              placeholder="e.g., Paint Living Room"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {/* Room/Area */}
          <div className="space-y-2">
            <Label htmlFor="room_area">Room/Area</Label>
            <Input
              id="room_area"
              value={formData.room_area || ''}
              onChange={(e) => handleChange('room_area', e.target.value)}
              placeholder="e.g., Master Bedroom, Kitchen"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                step="0.01"
                min="0"
                value={formData.qty ?? ''}
                onChange={(e) => handleChange('qty', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleChange('unit', value)}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {UNIT_LABELS[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate */}
          <div className="space-y-2">
            <Label htmlFor="rate">Rate ($ per unit)</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              value={formData.rate ?? ''}
              onChange={(e) => handleChange('rate', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          {/* Underwriting Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="underwriting_amount">Underwriting Amount</Label>
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setUseManualAmount(!useManualAmount)}
              >
                {useManualAmount ? 'Auto-calculate' : 'Enter manually'}
              </button>
            </div>
            <Input
              id="underwriting_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.underwriting_amount ?? ''}
              onChange={(e) => handleChange('underwriting_amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              disabled={!useManualAmount}
              className={!useManualAmount ? 'bg-muted' : ''}
            />
            {!useManualAmount && (
              <p className="text-xs text-muted-foreground">
                Auto-calculated: {formData.qty} × ${formData.rate} = ${formData.underwriting_amount?.toFixed(2)}
              </p>
            )}
          </div>

          {/* Forecast Amount */}
          <div className="space-y-2">
            <Label htmlFor="forecast_amount">Forecast Amount</Label>
            <Input
              id="forecast_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.forecast_amount ?? ''}
              onChange={(e) => handleChange('forecast_amount', parseFloat(e.target.value) || 0)}
              placeholder="0.00 (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Post-walkthrough or contractor bid estimate
            </p>
          </div>

          {/* Vendor Assignment */}
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Assign Vendor</Label>
            <Select
              value={formData.vendor_id || '_none'}
              onValueChange={(value) => handleChange('vendor_id', value === '_none' ? null : value)}
            >
              <SelectTrigger id="vendor_id">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">
                  <span className="text-muted-foreground">No vendor assigned</span>
                </SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    <div className="flex flex-col">
                      <span>{vendor.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {VENDOR_TRADE_LABELS[vendor.trade]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_type">Cost Type</Label>
              <Select
                value={formData.cost_type}
                onValueChange={(value) => handleChange('cost_type', value)}
              >
                <SelectTrigger id="cost_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COST_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !formData.item?.trim()}>
              {isPending ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
