'use client'

import * as React from 'react'
import type { Vendor, VendorInput, VendorTrade, VendorStatus } from '@/types'
import { VENDOR_TRADE_LABELS } from '@/types'
import { useVendorMutations } from '@/hooks/use-vendor-mutations'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { StarRating } from '@/components/ui/star-rating'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconLoader2 } from '@tabler/icons-react'

interface VendorFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor?: Vendor // If provided, edit mode; otherwise add mode
  onSuccess?: () => void
}

const VENDOR_TRADES: VendorTrade[] = [
  'general_contractor',
  'plumber',
  'electrician',
  'hvac',
  'roofer',
  'drywall',
  'painter',
  'flooring',
  'tile',
  'cabinets',
  'countertops',
  'framing',
  'siding',
  'landscaper',
  'concrete',
  'fencing',
  'windows_doors',
  'cleaning',
  'inspector',
  'appraiser',
  'other',
]

const VENDOR_STATUSES: { value: VendorStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'do_not_use', label: 'Do Not Use' },
]

const RELIABILITY_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const PRICE_LEVEL_OPTIONS = [
  { value: '$', label: '$ - Budget' },
  { value: '$$', label: '$$ - Mid-Range' },
  { value: '$$$', label: '$$$ - Premium' },
]

type FormData = {
  name: string
  trade: VendorTrade
  contact_name: string
  phone: string
  email: string
  website: string
  address: string
  licensed: boolean
  insured: boolean
  w9_on_file: boolean
  rating: number | null
  reliability: 'excellent' | 'good' | 'fair' | 'poor' | null
  price_level: '$' | '$$' | '$$$' | null
  status: VendorStatus
  notes: string
}

const defaultFormData: FormData = {
  name: '',
  trade: 'other',
  contact_name: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  licensed: false,
  insured: false,
  w9_on_file: false,
  rating: null,
  reliability: null,
  price_level: null,
  status: 'active',
  notes: '',
}

export function VendorFormSheet({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: VendorFormSheetProps) {
  const isEditing = !!vendor
  const { createVendor, updateVendor } = useVendorMutations()

  const [formData, setFormData] = React.useState<FormData>(defaultFormData)

  // Reset form when opening/closing or when vendor changes
  React.useEffect(() => {
    if (open && vendor) {
      setFormData({
        name: vendor.name,
        trade: vendor.trade,
        contact_name: vendor.contact_name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        website: vendor.website || '',
        address: vendor.address || '',
        licensed: vendor.licensed,
        insured: vendor.insured,
        w9_on_file: vendor.w9_on_file,
        rating: vendor.rating,
        reliability: vendor.reliability,
        price_level: vendor.price_level,
        status: vendor.status,
        notes: vendor.notes || '',
      })
    } else if (open && !vendor) {
      setFormData(defaultFormData)
    }
  }, [open, vendor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const vendorData: VendorInput = {
      name: formData.name.trim(),
      trade: formData.trade,
      contact_name: formData.contact_name.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      website: formData.website.trim() || null,
      address: formData.address.trim() || null,
      licensed: formData.licensed,
      insured: formData.insured,
      w9_on_file: formData.w9_on_file,
      rating: formData.rating,
      reliability: formData.reliability,
      price_level: formData.price_level,
      status: formData.status,
      notes: formData.notes.trim() || null,
    }

    try {
      if (isEditing && vendor) {
        await updateVendor.mutateAsync({ id: vendor.id, ...vendorData })
      } else {
        await createVendor.mutateAsync(vendorData)
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // Error handled by mutation
    }
  }

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const isPending = createVendor.isPending || updateVendor.isPending
  const isValid = formData.name.trim().length >= 2

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Vendor' : 'Add Vendor'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update vendor information below.'
              : 'Add a new vendor to your directory.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Basic Information
            </h4>

            <div className="space-y-2">
              <Label htmlFor="name">
                Company / Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="ABC Plumbing"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">
                Trade <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.trade}
                onValueChange={(value) =>
                  updateField('trade', value as VendorTrade)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trade..." />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TRADES.map((trade) => (
                    <SelectItem key={trade} value={trade}>
                      {VENDOR_TRADE_LABELS[trade]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Person</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                placeholder="John Smith"
              />
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Contact Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="612-555-1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john@abcplumbing.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://abcplumbing.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main St, Minneapolis, MN"
              />
            </div>
          </div>

          {/* Qualifications Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Qualifications
            </h4>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="licensed"
                  checked={formData.licensed}
                  onCheckedChange={(checked) =>
                    updateField('licensed', checked === true)
                  }
                />
                <Label htmlFor="licensed" className="text-sm font-normal">
                  Licensed
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insured"
                  checked={formData.insured}
                  onCheckedChange={(checked) =>
                    updateField('insured', checked === true)
                  }
                />
                <Label htmlFor="insured" className="text-sm font-normal">
                  Insured
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="w9_on_file"
                  checked={formData.w9_on_file}
                  onCheckedChange={(checked) =>
                    updateField('w9_on_file', checked === true)
                  }
                />
                <Label htmlFor="w9_on_file" className="text-sm font-normal">
                  W9 on File
                </Label>
              </div>
            </div>
          </div>

          {/* Ratings Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Ratings
            </h4>

            <div className="space-y-2">
              <Label>Overall Rating</Label>
              <StarRating
                value={formData.rating}
                onChange={(value) => updateField('rating', value)}
                size="lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reliability">Reliability</Label>
                <Select
                  value={formData.reliability || ''}
                  onValueChange={(value) =>
                    updateField(
                      'reliability',
                      value
                        ? (value as 'excellent' | 'good' | 'fair' | 'poor')
                        : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_level">Price Level</Label>
                <Select
                  value={formData.price_level || ''}
                  onValueChange={(value) =>
                    updateField(
                      'price_level',
                      value ? (value as '$' | '$$' | '$$$') : null
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Status & Notes Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Status & Notes
            </h4>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  updateField('status', value as VendorStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_STATUSES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any notes about this vendor..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !isValid}
            >
              {isPending && (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
