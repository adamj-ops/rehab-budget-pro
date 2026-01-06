'use client'

import * as React from 'react'
import type { Vendor, BudgetItem, VendorTag, Project } from '@/types'
import { VENDOR_TRADE_LABELS } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { useVendorTags } from '@/hooks/use-vendor-tags'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/star-rating'
import { VendorTagSelector } from '@/components/project/vendor-tag-selector'
import { VendorContactHistory } from '@/components/project/vendor-contact-history'
import {
  IconPhone,
  IconMail,
  IconWorld,
  IconMapPin,
  IconCheck,
  IconX,
  IconPencil,
  IconExternalLink,
} from '@tabler/icons-react'

interface VendorDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: Vendor | null
  budgetItems?: BudgetItem[]
  projects?: Project[]
  onEdit?: () => void
}

export function VendorDetailSheet({
  open,
  onOpenChange,
  vendor,
  budgetItems = [],
  projects = [],
  onEdit,
}: VendorDetailSheetProps) {
  const { useVendorTagAssignments, assignTag, unassignTag } = useVendorTags()
  const tagsQuery = vendor ? useVendorTagAssignments(vendor.id) : null
  const assignedTags: VendorTag[] = (tagsQuery?.data as VendorTag[] | undefined) ?? []

  if (!vendor) return null

  // Calculate vendor totals from budget items
  const vendorItems = budgetItems.filter((item) => item.vendor_id === vendor.id)
  const totals = vendorItems.reduce(
    (acc, item) => ({
      budget: acc.budget + (item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount),
      actual: acc.actual + (item.actual_amount || 0),
      items: acc.items + 1,
    }),
    { budget: 0, actual: 0, items: 0 }
  )

  const handleAssignTag = (tagId: string) => {
    assignTag.mutate({ vendorId: vendor.id, tagId })
  }

  const handleUnassignTag = (tagId: string) => {
    unassignTag.mutate({ vendorId: vendor.id, tagId })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{vendor.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {VENDOR_TRADE_LABELS[vendor.trade]}
              </p>
            </div>
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full capitalize',
                vendor.status === 'active' && 'bg-green-100 text-green-700',
                vendor.status === 'inactive' && 'bg-zinc-100 text-zinc-700',
                vendor.status === 'do_not_use' && 'bg-red-100 text-red-700'
              )}
            >
              {vendor.status === 'do_not_use' ? 'Do Not Use' : vendor.status}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Tags Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
            <VendorTagSelector
              vendorId={vendor.id}
              assignedTags={assignedTags}
              onAssign={handleAssignTag}
              onUnassign={handleUnassignTag}
            />
          </div>

          {/* Ratings Section */}
          {(vendor.rating || vendor.reliability || vendor.price_level) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Ratings & Quality
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {vendor.rating && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Overall</p>
                    <StarRating value={vendor.rating} readonly size="sm" />
                  </div>
                )}
                {vendor.reliability && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Reliability
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {vendor.reliability}
                    </p>
                  </div>
                )}
                {vendor.price_level && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Price Level
                    </p>
                    <p className="text-sm font-medium">{vendor.price_level}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Contact Information
            </h4>
            <div className="space-y-2">
              {vendor.contact_name && (
                <p className="text-sm font-medium">{vendor.contact_name}</p>
              )}
              {vendor.phone && (
                <a
                  href={`tel:${vendor.phone}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <IconPhone className="h-4 w-4" />
                  {vendor.phone}
                </a>
              )}
              {vendor.email && (
                <a
                  href={`mailto:${vendor.email}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <IconMail className="h-4 w-4" />
                  {vendor.email}
                </a>
              )}
              {vendor.website && (
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <IconWorld className="h-4 w-4" />
                  {vendor.website.replace(/^https?:\/\//, '')}
                  <IconExternalLink className="h-3 w-3" />
                </a>
              )}
              {vendor.address && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <IconMapPin className="h-4 w-4 mt-0.5" />
                  {vendor.address}
                </div>
              )}
              {!vendor.contact_name &&
                !vendor.phone &&
                !vendor.email &&
                !vendor.website &&
                !vendor.address && (
                  <p className="text-sm text-muted-foreground italic">
                    No contact information provided
                  </p>
                )}
            </div>
          </div>

          {/* Qualifications Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Qualifications
            </h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                {vendor.licensed ? (
                  <IconCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <IconX className="h-4 w-4 text-zinc-400" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    vendor.licensed ? 'text-green-600' : 'text-zinc-400'
                  )}
                >
                  Licensed
                </span>
              </div>
              <div className="flex items-center gap-2">
                {vendor.insured ? (
                  <IconCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <IconX className="h-4 w-4 text-zinc-400" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    vendor.insured ? 'text-green-600' : 'text-zinc-400'
                  )}
                >
                  Insured
                </span>
              </div>
              <div className="flex items-center gap-2">
                {vendor.w9_on_file ? (
                  <IconCheck className="h-4 w-4 text-green-600" />
                ) : (
                  <IconX className="h-4 w-4 text-zinc-400" />
                )}
                <span
                  className={cn(
                    'text-sm',
                    vendor.w9_on_file ? 'text-green-600' : 'text-zinc-400'
                  )}
                >
                  W9 on File
                </span>
              </div>
            </div>
          </div>

          {/* Project Stats (if applicable) */}
          {totals.items > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Project Summary
              </h4>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Budget Items</p>
                  <p className="text-lg font-semibold">{totals.items}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(totals.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(totals.actual)}
                  </p>
                </div>
              </div>
              {/* List budget items */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Assigned Items
                </p>
                {vendorItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm py-1 border-b border-dashed last:border-0"
                  >
                    <span className="truncate">{item.description}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatCurrency(
                        item.forecast_amount > 0
                          ? item.forecast_amount
                          : item.underwriting_amount
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {vendor.notes && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Notes
              </h4>
              <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
            </div>
          )}

          {/* Contact History Section */}
          <div className="pt-4 border-t">
            <VendorContactHistory
              vendorId={vendor.id}
              projects={projects}
            />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>Added: {new Date(vendor.created_at).toLocaleDateString()}</p>
            {vendor.updated_at !== vendor.created_at && (
              <p>
                Last updated: {new Date(vendor.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Edit Button */}
          {onEdit && (
            <div className="pt-4">
              <Button onClick={onEdit} className="w-full">
                <IconPencil className="h-4 w-4 mr-2" />
                Edit Vendor
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
