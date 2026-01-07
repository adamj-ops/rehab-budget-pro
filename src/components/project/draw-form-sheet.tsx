'use client'

import * as React from 'react'
import type { Draw, DrawMilestone, DrawStatus, PaymentMethod, Vendor } from '@/types'
import { VENDOR_TRADE_LABELS } from '@/types'
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

interface DrawFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendors: Vendor[]
  draw?: Draw | null // If provided, we're editing
  onSubmit: (draw: Partial<Draw>) => void
  isPending?: boolean
}

const MILESTONE_OPTIONS: { value: DrawMilestone; label: string }[] = [
  { value: 'project_start', label: 'Project Start' },
  { value: 'demo_complete', label: 'Demo Complete' },
  { value: 'rough_in', label: 'Rough-In' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'finishes', label: 'Finishes' },
  { value: 'final', label: 'Final' },
]

const STATUS_OPTIONS: { value: DrawStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
]

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'check', label: 'Check' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
]

export function DrawFormSheet({
  open,
  onOpenChange,
  vendors,
  draw,
  onSubmit,
  isPending = false,
}: DrawFormSheetProps) {
  const isEditing = !!draw

  const [formData, setFormData] = React.useState<Partial<Draw>>({
    vendor_id: null,
    milestone: null,
    description: '',
    percent_complete: null,
    amount: 0,
    date_requested: new Date().toISOString().split('T')[0],
    date_paid: null,
    status: 'pending',
    payment_method: null,
    reference_number: '',
    notes: '',
  })

  // Reset form when draw changes or sheet opens
  React.useEffect(() => {
    if (open) {
      if (draw) {
        setFormData({
          vendor_id: draw.vendor_id,
          milestone: draw.milestone,
          description: draw.description || '',
          percent_complete: draw.percent_complete,
          amount: draw.amount,
          date_requested: draw.date_requested,
          date_paid: draw.date_paid,
          status: draw.status,
          payment_method: draw.payment_method,
          reference_number: draw.reference_number || '',
          notes: draw.notes || '',
        })
      } else {
        setFormData({
          vendor_id: null,
          milestone: null,
          description: '',
          percent_complete: null,
          amount: 0,
          date_requested: new Date().toISOString().split('T')[0],
          date_paid: null,
          status: 'pending',
          payment_method: null,
          reference_number: '',
          notes: '',
        })
      }
    }
  }, [draw, open])

  const handleChange = (field: keyof Draw, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || formData.amount <= 0) {
      return
    }
    onSubmit(formData)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{isEditing ? 'Edit Draw' : 'Create New Draw'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? `Update draw #${draw?.draw_number}`
              : 'Schedule a new payment draw for this project'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount ?? ''}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                className="pl-7"
                placeholder="0.00"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Vendor */}
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Vendor</Label>
            <Select
              value={formData.vendor_id || '_none'}
              onValueChange={(value) => handleChange('vendor_id', value === '_none' ? null : value)}
            >
              <SelectTrigger id="vendor_id">
                <SelectValue placeholder="Select vendor..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">
                  <span className="text-muted-foreground">No vendor</span>
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

          {/* Milestone */}
          <div className="space-y-2">
            <Label htmlFor="milestone">Milestone</Label>
            <Select
              value={formData.milestone || '_none'}
              onValueChange={(value) =>
                handleChange('milestone', value === '_none' ? null : value)
              }
            >
              <SelectTrigger id="milestone">
                <SelectValue placeholder="Select milestone..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">
                  <span className="text-muted-foreground">No milestone</span>
                </SelectItem>
                {MILESTONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Percent Complete */}
          <div className="space-y-2">
            <Label htmlFor="percent_complete">Percent Complete</Label>
            <div className="relative">
              <Input
                id="percent_complete"
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.percent_complete ?? ''}
                onChange={(e) =>
                  handleChange('percent_complete', e.target.value ? parseFloat(e.target.value) : null)
                }
                className="pr-8"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g., Initial deposit, Rough-in complete..."
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'pending'}
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_requested">Date Requested</Label>
              <Input
                id="date_requested"
                type="date"
                value={formData.date_requested || ''}
                onChange={(e) => handleChange('date_requested', e.target.value || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_paid">Date Paid</Label>
              <Input
                id="date_paid"
                type="date"
                value={formData.date_paid || ''}
                onChange={(e) => handleChange('date_paid', e.target.value || null)}
              />
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method || '_none'}
                onValueChange={(value) =>
                  handleChange('payment_method', value === '_none' ? null : value)
                }
              >
                <SelectTrigger id="payment_method">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">Not set</span>
                  </SelectItem>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference #</Label>
              <Input
                id="reference_number"
                value={formData.reference_number || ''}
                onChange={(e) => handleChange('reference_number', e.target.value)}
                placeholder="Check #, transaction ID..."
              />
            </div>
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
            <Button type="submit" disabled={isPending || !formData.amount}>
              {isPending ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Create Draw'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
