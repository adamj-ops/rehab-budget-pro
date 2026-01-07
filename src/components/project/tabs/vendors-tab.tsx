'use client'

import { useState } from 'react';
import type { Vendor, BudgetItem, VendorTrade, VendorStatus } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  IconPlus,
  IconStar,
  IconPhone,
  IconMail,
  IconCheck,
  IconX,
  IconPencil,
  IconTrash,
  IconLoader2,
  IconWorld,
  IconMapPin,
  IconLink,
} from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VendorsTabProps {
  projectId: string
  vendors: Vendor[]
  budgetItems: BudgetItem[]
}

type VendorFormData = {
  name: string;
  trade: VendorTrade;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  licensed: boolean;
  insured: boolean;
  w9_on_file: boolean;
  rating: number | null;
  reliability: 'excellent' | 'good' | 'fair' | 'poor' | null;
  price_level: '$' | '$$' | '$$$' | null;
  status: VendorStatus;
  notes: string;
};

const defaultFormData: VendorFormData = {
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
};

const VENDOR_TRADES = Object.entries(VENDOR_TRADE_LABELS) as [VendorTrade, string][];

export function VendorsTab({ projectId, vendors, budgetItems }: VendorsTabProps) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(defaultFormData);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);
  const [assigningVendor, setAssigningVendor] = useState<Vendor | null>(null);

  // Get vendors used in this project
  const projectVendorIds = new Set(
    budgetItems.filter((item) => item.vendor_id).map((item) => item.vendor_id)
  );

  const projectVendors = vendors.filter((v) => projectVendorIds.has(v.id));
  const otherVendors = vendors.filter((v) => !projectVendorIds.has(v.id));

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

  // Get unassigned budget items for vendor assignment
  const unassignedItems = budgetItems.filter((item) => !item.vendor_id);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const supabase = getSupabaseClient();
      const { data: newVendor, error } = await supabase
        .from('vendors')
        .insert({
          ...data,
          contact_name: data.contact_name || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          address: data.address || null,
          notes: data.notes || null,
        })
        .select()
        .single();
      if (error) throw error;
      return newVendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor created successfully');
      handleCloseForm();
    },
    onError: (error) => {
      console.error('Error creating vendor:', error);
      toast.error('Failed to create vendor');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VendorFormData }) => {
      const supabase = getSupabaseClient();
      const { data: updatedVendor, error } = await supabase
        .from('vendors')
        .update({
          ...data,
          contact_name: data.contact_name || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          address: data.address || null,
          notes: data.notes || null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return updatedVendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
      handleCloseForm();
    },
    onError: (error) => {
      console.error('Error updating vendor:', error);
      toast.error('Failed to update vendor');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted successfully');
      setVendorToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor. Make sure no budget items are assigned to this vendor.');
    },
  });

  // Assign vendor to budget item mutation
  const assignMutation = useMutation({
    mutationFn: async ({ itemId, vendorId }: { itemId: string; vendorId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('budget_items')
        .update({ vendor_id: vendorId })
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor assigned to item');
    },
    onError: (error) => {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    },
  });

  const handleOpenCreate = () => {
    setEditingVendor(null);
    setFormData(defaultFormData);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
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
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Vendor name is required');
      return;
    }
    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAssignToItem = (itemId: string) => {
    if (assigningVendor) {
      assignMutation.mutate({ itemId, vendorId: assigningVendor.id });
      setAssigningVendor(null);
    }
  };

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
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{vendor.name}</h4>
            <p className="text-sm text-muted-foreground">
              {VENDOR_TRADE_LABELS[vendor.trade]}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            {vendor.rating && (
              <div className="flex items-center gap-0.5 mr-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < vendor.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300'
                    )}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => handleOpenEdit(vendor)}
              className="p-1 hover:bg-muted rounded"
              title="Edit vendor"
            >
              <IconPencil className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => setVendorToDelete(vendor)}
              className="p-1 hover:bg-red-50 rounded"
              title="Delete vendor"
            >
              <IconTrash className="h-4 w-4 text-red-500" />
            </button>
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
              <IconMail className="h-3 w-3" />
              <a href={`mailto:${vendor.email}`} className="hover:text-primary truncate">
                {vendor.email}
              </a>
            </div>
          )}
          {vendor.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconWorld className="h-3 w-3" />
              <a
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary truncate"
              >
                {vendor.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Qualifications */}
        <div className="flex items-center gap-4 text-xs mb-3 flex-wrap">
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
          <div className="flex items-center gap-1">
            {vendor.w9_on_file ? (
              <IconCheck className="h-3 w-3 text-green-600" />
            ) : (
              <IconX className="h-3 w-3 text-zinc-400" />
            )}
            <span className={vendor.w9_on_file ? 'text-green-600' : 'text-zinc-400'}>
              W-9
            </span>
          </div>
          {vendor.price_level && (
            <span className="text-muted-foreground font-medium">{vendor.price_level}</span>
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

        {/* Status Badge & Actions */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
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

          {!isProjectVendor && unassignedItems.length > 0 && (
            <button
              onClick={() => setAssigningVendor(vendor)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <IconLink className="h-3 w-3" />
              Assign to item
            </button>
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
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <IconPlus className="h-4 w-4" />
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

      {/* Vendor Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </h2>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ABC Contractors"
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium">Trade</label>
                    <select
                      value={formData.trade}
                      onChange={(e) => setFormData({ ...formData, trade: e.target.value as VendorTrade })}
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    >
                      {VENDOR_TRADES.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Contact Name</label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@abccontractors.com"
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Website</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="www.abccontractors.com"
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St, Minneapolis, MN 55401"
                    className="w-full mt-1 p-2 rounded-lg border text-sm"
                  />
                </div>

                {/* Qualifications */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Qualifications</h3>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.licensed}
                        onChange={(e) => setFormData({ ...formData, licensed: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Licensed</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.insured}
                        onChange={(e) => setFormData({ ...formData, insured: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Insured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.w9_on_file}
                        onChange={(e) => setFormData({ ...formData, w9_on_file: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">W-9 on File</span>
                    </label>
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rating (1-5)</label>
                    <select
                      value={formData.rating?.toString() ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rating: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    >
                      <option value="">Not rated</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very Good</option>
                      <option value="5">5 - Excellent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reliability</label>
                    <select
                      value={formData.reliability ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reliability: (e.target.value || null) as VendorFormData['reliability'],
                        })
                      }
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    >
                      <option value="">Not rated</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price Level</label>
                    <select
                      value={formData.price_level ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_level: (e.target.value || null) as VendorFormData['price_level'],
                        })
                      }
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    >
                      <option value="">Not set</option>
                      <option value="$">$ - Budget</option>
                      <option value="$$">$$ - Mid-Range</option>
                      <option value="$$$">$$$ - Premium</option>
                    </select>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as VendorStatus })
                      }
                      className="w-full mt-1 p-2 rounded-lg border text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="do_not_use">Do Not Use</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this vendor..."
                    rows={3}
                    className="w-full mt-1 p-2 rounded-lg border text-sm resize-none"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  )}
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Vendor Modal */}
      {assigningVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">
              Assign {assigningVendor.name} to Budget Item
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a budget item to assign this vendor to:
            </p>

            {unassignedItems.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unassignedItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAssignToItem(item.id)}
                    disabled={assignMutation.isPending}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm">{item.item}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} • {formatCurrency(item.forecast_amount || item.underwriting_amount)}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                All budget items already have vendors assigned.
              </p>
            )}

            <div className="flex justify-end mt-4 pt-4 border-t">
              <button
                onClick={() => setAssigningVendor(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!vendorToDelete} onOpenChange={() => setVendorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{vendorToDelete?.name}"? This action cannot be undone.
              {projectVendorIds.has(vendorToDelete?.id || '') && (
                <span className="block mt-2 text-orange-600">
                  Warning: This vendor is assigned to budget items in this project.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => vendorToDelete && deleteMutation.mutate(vendorToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
