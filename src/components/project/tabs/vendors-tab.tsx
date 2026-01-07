'use client'

import type { Vendor, BudgetItem } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { IconPlus, IconStar, IconPhone, IconMail, IconCheck, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface VendorsTabProps {
  projectId: string
  vendors: Vendor[]
  budgetItems: BudgetItem[]
}

type SortOption = 'name_asc' | 'name_desc' | 'rating_desc' | 'recent' | 'most_used'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'most_used', label: 'Most Used' },
]

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
  const [viewingVendor, setViewingVendor] = React.useState<Vendor | null>(null)
  const [editingVendor, setEditingVendor] = React.useState<Vendor | null>(null)
  const [deletingVendor, setDeletingVendor] = React.useState<Vendor | null>(
    null
  )
  const [quickEditId, setQuickEditId] = React.useState<string | null>(null)
  const [quickEditData, setQuickEditData] = React.useState<{
    phone: string
    email: string
  }>({ phone: '', email: '' })

  // State for bulk selection
  const [selectedVendors, setSelectedVendors] = React.useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = React.useState(false)

  // State for search/filter/sort
  const [searchQuery, setSearchQuery] = React.useState('')
  const [tradeFilter, setTradeFilter] = React.useState<VendorTrade | 'all'>(
    'all'
  )
  const [sortBy, setSortBy] = React.useState<SortOption>('name_asc')

  const { deleteVendor, updateVendor, createVendor } = useVendorMutations()

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

  // Sort vendors
  const sortVendors = (vendorsToSort: Vendor[]) => {
    return [...vendorsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0)
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'most_used': {
          const aItems = vendorTotals.get(a.id)?.items || 0
          const bItems = vendorTotals.get(b.id)?.items || 0
          return bItems - aItems
        }
        default:
          return 0
      }
    })
  }

  // Split into project vendors and others, then sort
  const projectVendors = sortVendors(
    filteredVendors.filter((v) => projectVendorIds.has(v.id))
  )
  const otherVendors = sortVendors(
    filteredVendors.filter((v) => !projectVendorIds.has(v.id))
  )

  const handleDelete = async () => {
    if (!deletingVendor) return
    try {
      await deleteVendor.mutateAsync(deletingVendor.id)
      setDeletingVendor(null)
    } catch {
      // Error handled by mutation
    }
  }

  const startQuickEdit = (vendor: Vendor) => {
    setQuickEditId(vendor.id)
    setQuickEditData({
      phone: vendor.phone || '',
      email: vendor.email || '',
    })
  }

  const cancelQuickEdit = () => {
    setQuickEditId(null)
    setQuickEditData({ phone: '', email: '' })
  }

  const saveQuickEdit = async (vendorId: string) => {
    try {
      await updateVendor.mutateAsync({
        id: vendorId,
        phone: quickEditData.phone.trim() || null,
        email: quickEditData.email.trim() || null,
      })
      setQuickEditId(null)
    } catch {
      // Error handled by mutation
    }
  }

  // Bulk selection handlers
  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendors((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId)
      } else {
        newSet.add(vendorId)
      }
      return newSet
    })
  }

  const selectAllVendors = () => {
    setSelectedVendors(new Set(filteredVendors.map((v) => v.id)))
  }

  const clearSelection = () => {
    setSelectedVendors(new Set())
    setIsSelectionMode(false)
  }

  const handleBulkDelete = async () => {
    if (selectedVendors.size === 0) return
    if (!confirm(`Delete ${selectedVendors.size} vendor(s)? This cannot be undone.`)) return

    try {
      for (const vendorId of selectedVendors) {
        await deleteVendor.mutateAsync(vendorId)
      }
      clearSelection()
    } catch {
      // Error handled by mutation
    }
  }

  // CSV Export
  const exportToCSV = (vendorsToExport: Vendor[]) => {
    const headers = [
      'name',
      'trade',
      'contact_name',
      'phone',
      'email',
      'website',
      'address',
      'licensed',
      'insured',
      'w9_on_file',
      'rating',
      'reliability',
      'price_level',
      'status',
      'notes',
    ]

    const csvRows = [
      headers.join(','),
      ...vendorsToExport.map((vendor) =>
        headers
          .map((header) => {
            const value = vendor[header as keyof Vendor]
            if (value === null || value === undefined) return ''
            if (typeof value === 'boolean') return value ? 'true' : 'false'
            // Escape quotes and wrap in quotes if contains comma or quote
            const strValue = String(value)
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`
            }
            return strValue
          })
          .join(',')
      ),
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleExportSelected = () => {
    const vendorsToExport = vendors.filter((v) => selectedVendors.has(v.id))
    exportToCSV(vendorsToExport)
  }

  const handleExportAll = () => {
    exportToCSV(vendors)
  }

  // CSV Import
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length < 2) {
        alert('CSV file is empty or has no data rows')
        return
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
      const nameIndex = headers.indexOf('name')
      const tradeIndex = headers.indexOf('trade')

      if (nameIndex === -1 || tradeIndex === -1) {
        alert('CSV must have "name" and "trade" columns')
        return
      }

      const validTrades = new Set(ALL_TRADES)
      let imported = 0
      let errors = 0

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV row (handling quoted values)
        const row = parseCSVRow(lines[i])
        if (row.length < Math.max(nameIndex, tradeIndex) + 1) continue

        const name = row[nameIndex]?.trim()
        const trade = row[tradeIndex]?.trim().toLowerCase() as VendorTrade

        if (!name || !validTrades.has(trade)) {
          errors++
          continue
        }

        try {
          const vendorData: Record<string, unknown> = {
            name,
            trade,
            status: 'active',
          }

          // Map other fields
          const fieldMappings: Record<string, string> = {
            contact_name: 'contact_name',
            phone: 'phone',
            email: 'email',
            website: 'website',
            address: 'address',
            notes: 'notes',
          }

          headers.forEach((header, idx) => {
            if (fieldMappings[header] && row[idx]) {
              vendorData[fieldMappings[header]] = row[idx].trim()
            }
          })

          // Boolean fields
          const boolIndex = headers.indexOf('licensed')
          if (boolIndex !== -1) vendorData.licensed = row[boolIndex]?.toLowerCase() === 'true'
          const insuredIndex = headers.indexOf('insured')
          if (insuredIndex !== -1) vendorData.insured = row[insuredIndex]?.toLowerCase() === 'true'
          const w9Index = headers.indexOf('w9_on_file')
          if (w9Index !== -1) vendorData.w9_on_file = row[w9Index]?.toLowerCase() === 'true'

          // Rating
          const ratingIndex = headers.indexOf('rating')
          if (ratingIndex !== -1 && row[ratingIndex]) {
            const rating = parseInt(row[ratingIndex])
            if (rating >= 1 && rating <= 5) vendorData.rating = rating
          }

          // Reliability
          const reliabilityIndex = headers.indexOf('reliability')
          if (reliabilityIndex !== -1 && row[reliabilityIndex]) {
            const reliability = row[reliabilityIndex].toLowerCase()
            if (['excellent', 'good', 'fair', 'poor'].includes(reliability)) {
              vendorData.reliability = reliability
            }
          }

          // Price level
          const priceIndex = headers.indexOf('price_level')
          if (priceIndex !== -1 && row[priceIndex]) {
            const price = row[priceIndex]
            if (['$', '$$', '$$$'].includes(price)) vendorData.price_level = price
          }

          await createVendor.mutateAsync(vendorData as Parameters<typeof createVendor.mutateAsync>[0])
          imported++
        } catch {
          errors++
        }
      }

      alert(`Imported ${imported} vendor(s)${errors > 0 ? `. ${errors} row(s) had errors.` : '.'}`)
    }

    reader.readAsText(file)
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Helper function to parse CSV row (handles quoted values)
  const parseCSVRow = (row: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const renderVendorCard = (vendor: Vendor, isProjectVendor: boolean) => {
    const totals = vendorTotals.get(vendor.id);

    return (
      <div
        key={vendor.id}
        className={cn(
          'rounded-lg border bg-card p-6',
          isProjectVendor && 'border-primary/30 ring-1 ring-primary/10'
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
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
                <DropdownMenuItem onClick={() => startQuickEdit(vendor)}>
                  <IconPhone className="h-4 w-4 mr-2" />
                  Quick Edit Contact
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingVendor(vendor)}>
                  <IconPencil className="h-4 w-4 mr-2" />
                  Edit All Details
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
        <div className="space-y-1.5 text-sm mb-4">
          {vendor.contact_name && (
            <p className="text-muted-foreground">{vendor.contact_name}</p>
          )}
          {vendor.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconPhone className="h-3.5 w-3.5" />
              <a href={`tel:${vendor.phone}`} className="hover:text-primary transition-colors">
                {vendor.phone}
              </a>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconMail className="h-3.5 w-3.5" />
              <a href={`mailto:${vendor.email}`} className="hover:text-primary transition-colors">
                {vendor.email}
              </a>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelQuickEdit}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => saveQuickEdit(vendor.id)}
                disabled={updateVendor.isPending}
                className="h-7 text-xs"
              >
                {updateVendor.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
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
        )}

        {/* Qualifications */}
        <div className="flex items-center gap-4 text-xs mb-4">
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
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span
            className={cn(
              'status-badge',
              vendor.status === 'active' && 'status-active',
              vendor.status === 'inactive' && 'status-inactive',
              vendor.status === 'do_not_use' && 'status-do-not-use'
            )}
          >
            {vendor.status === 'do_not_use' ? 'Do Not Use' : vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
          </span>

          {!isProjectVendor && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
              Add to project
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for CSV import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="section-title-group">
          <h3 className="section-header">Project Vendors</h3>
          <p className="section-subheader">
            {projectVendors.length} vendors assigned to this project
          </p>
        </div>
        <Button>
          <IconPlus className="icon-sm" />
          Add Vendor
        </Button>
      </div>

      {/* Project Vendors */}
      {projectVendors.length > 0 && (
        <div>
          <h4 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wide">
            Project Vendors ({projectVendors.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectVendors.map((vendor) => renderVendorCard(vendor, true))}
          </div>
        </div>
      ) : filteredVendors.length === 0 && vendors.length > 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No vendors match your search</p>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchQuery('')
              setTradeFilter('all')
              setSortBy('name_asc')
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No vendors assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Assign vendors to budget items in the Budget Detail tab.
          </p>
        </div>
      )}

      {/* All Vendors Directory */}
      {otherVendors.length > 0 && (
        <div>
          <h3 className="section-header">Vendor Directory</h3>
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

      {/* Vendor Detail Sheet */}
      <VendorDetailSheet
        open={!!viewingVendor}
        onOpenChange={(open) => !open && setViewingVendor(null)}
        vendor={viewingVendor}
        budgetItems={budgetItems}
        onEdit={() => {
          setEditingVendor(viewingVendor)
          setViewingVendor(null)
        }}
      />

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
        existingVendors={vendors}
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
