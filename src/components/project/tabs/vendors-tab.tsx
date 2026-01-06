'use client'

import * as React from 'react'
import type { Vendor, BudgetItem, VendorTrade } from '@/types'
import { VENDOR_TRADE_LABELS } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { useVendorMutations } from '@/hooks/use-vendor-mutations'
import { VendorFormSheet } from '@/components/project/vendor-form-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StarRating } from '@/components/ui/star-rating'
import {
  IconPlus,
  IconPhone,
  IconMail,
  IconCheck,
  IconX,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconSearch,
} from '@tabler/icons-react'

interface VendorsTabProps {
  projectId: string
  vendors: Vendor[]
  budgetItems: BudgetItem[]
}

const ALL_TRADES: VendorTrade[] = [
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

export function VendorsTab({
  projectId,
  vendors,
  budgetItems,
}: VendorsTabProps) {
  // State for CRUD operations
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingVendor, setEditingVendor] = React.useState<Vendor | null>(null)
  const [deletingVendor, setDeletingVendor] = React.useState<Vendor | null>(
    null
  )

  // State for search/filter
  const [searchQuery, setSearchQuery] = React.useState('')
  const [tradeFilter, setTradeFilter] = React.useState<VendorTrade | 'all'>(
    'all'
  )

  const { deleteVendor } = useVendorMutations()

  // Get vendors used in this project
  const projectVendorIds = new Set(
    budgetItems.filter((item) => item.vendor_id).map((item) => item.vendor_id)
  )

  // Calculate totals per vendor (using forecast if available, otherwise underwriting)
  const vendorTotals = new Map<
    string,
    { budget: number; actual: number; items: number }
  >()
  budgetItems.forEach((item) => {
    if (item.vendor_id) {
      const existing = vendorTotals.get(item.vendor_id) || {
        budget: 0,
        actual: 0,
        items: 0,
      }
      const itemBudget =
        item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount
      vendorTotals.set(item.vendor_id, {
        budget: existing.budget + itemBudget,
        actual: existing.actual + (item.actual_amount || 0),
        items: existing.items + 1,
      })
    }
  })

  // Filter vendors based on search and trade filter
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      searchQuery === '' ||
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTrade = tradeFilter === 'all' || vendor.trade === tradeFilter

    return matchesSearch && matchesTrade
  })

  // Split into project vendors and others
  const projectVendors = filteredVendors.filter((v) =>
    projectVendorIds.has(v.id)
  )
  const otherVendors = filteredVendors.filter((v) => !projectVendorIds.has(v.id))

  const handleDelete = async () => {
    if (!deletingVendor) return
    try {
      await deleteVendor.mutateAsync(deletingVendor.id)
      setDeletingVendor(null)
    } catch {
      // Error handled by mutation
    }
  }

  const renderVendorCard = (vendor: Vendor, isProjectVendor: boolean) => {
    const totals = vendorTotals.get(vendor.id)

    return (
      <div
        key={vendor.id}
        className={cn(
          'rounded-lg border bg-card p-4 transition-shadow hover:shadow-md',
          isProjectVendor && 'border-primary/30'
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setEditingVendor(vendor)}
          >
            <h4 className="font-medium">{vendor.name}</h4>
            <p className="text-sm text-muted-foreground">
              {VENDOR_TRADE_LABELS[vendor.trade]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {vendor.rating && (
              <StarRating value={vendor.rating} readonly size="sm" />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconDotsVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingVendor(vendor)}>
                  <IconPencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingVendor(vendor)}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-sm mb-3">
          {vendor.contact_name && (
            <p className="text-muted-foreground">{vendor.contact_name}</p>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconPhone className="h-3 w-3" />
              <a href={`tel:${vendor.phone}`} className="hover:text-primary">
                {vendor.phone}
              </a>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconMail className="h-3 w-3" />
              <a href={`mailto:${vendor.email}`} className="hover:text-primary">
                {vendor.email}
              </a>
            </div>
          )}
        </div>

        {/* Qualifications */}
        <div className="flex items-center gap-4 text-xs mb-3">
          <div className="flex items-center gap-1">
            {vendor.licensed ? (
              <IconCheck className="h-3 w-3 text-green-600" />
            ) : (
              <IconX className="h-3 w-3 text-zinc-400" />
            )}
            <span
              className={vendor.licensed ? 'text-green-600' : 'text-zinc-400'}
            >
              Licensed
            </span>
          </div>
          <div className="flex items-center gap-1">
            {vendor.insured ? (
              <IconCheck className="h-3 w-3 text-green-600" />
            ) : (
              <IconX className="h-3 w-3 text-zinc-400" />
            )}
            <span
              className={vendor.insured ? 'text-green-600' : 'text-zinc-400'}
            >
              Insured
            </span>
          </div>
          {vendor.price_level && (
            <span className="text-muted-foreground">{vendor.price_level}</span>
          )}
        </div>

        {/* Project Totals (if applicable) */}
        {totals && (
          <div className="pt-3 border-t grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Items</p>
              <p className="font-medium">{totals.items}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Budget</p>
              <p className="font-medium">{formatCurrency(totals.budget)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Paid</p>
              <p className="font-medium">{formatCurrency(totals.actual)}</p>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full capitalize',
              vendor.status === 'active' && 'bg-green-100 text-green-700',
              vendor.status === 'inactive' && 'bg-zinc-100 text-zinc-700',
              vendor.status === 'do_not_use' && 'bg-red-100 text-red-700'
            )}
          >
            {vendor.status === 'do_not_use'
              ? 'Do Not Use'
              : vendor.status}
          </span>

          {vendor.reliability && (
            <span className="text-xs text-muted-foreground capitalize">
              {vendor.reliability}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">Project Vendors</h3>
          <p className="text-sm text-muted-foreground">
            {projectVendors.length} vendor{projectVendors.length !== 1 && 's'}{' '}
            assigned to this project
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={tradeFilter}
          onValueChange={(value) =>
            setTradeFilter(value as VendorTrade | 'all')
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {ALL_TRADES.map((trade) => (
              <SelectItem key={trade} value={trade}>
                {VENDOR_TRADE_LABELS[trade]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Vendors */}
      {projectVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectVendors.map((vendor) => renderVendorCard(vendor, true))}
        </div>
      ) : filteredVendors.length === 0 && vendors.length > 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No vendors match your search</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('')
              setTradeFilter('all')
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No vendors assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Assign vendors to budget items or add new vendors to your directory.
          </p>
        </div>
      )}

      {/* All Vendors Directory */}
      {otherVendors.length > 0 && (
        <div>
          <h3 className="font-medium mb-4">Vendor Directory</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherVendors.map((vendor) => renderVendorCard(vendor, false))}
          </div>
        </div>
      )}

      {/* Empty State - No vendors at all */}
      {vendors.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium mb-2">No vendors yet</p>
          <p className="text-muted-foreground mb-4">
            Add your first vendor to start building your directory.
          </p>
          <Button onClick={() => setIsAddOpen(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Add Your First Vendor
          </Button>
        </div>
      )}

      {/* Add/Edit Vendor Sheet */}
      <VendorFormSheet
        open={isAddOpen || !!editingVendor}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingVendor(null)
          }
        }}
        vendor={editingVendor || undefined}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingVendor}
        onOpenChange={(open) => !open && setDeletingVendor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deletingVendor?.name}&quot;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteVendor.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
