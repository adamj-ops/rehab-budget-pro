'use client';

import { useState, useMemo } from 'react';
import type { Vendor, BudgetItem, VendorTrade } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
  IconPlus,
  IconStar,
  IconPhone,
  IconMail,
  IconCheck,
  IconX,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VendorDialog, DeleteVendorDialog } from '@/components/vendor';

interface VendorsTabProps {
  projectId: string;
  vendors: Vendor[];
  budgetItems: BudgetItem[];
}

export function VendorsTab({ projectId, vendors, budgetItems }: VendorsTabProps) {
  // Dialog states
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState<VendorTrade | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'do_not_use'>('all');

  // Get vendors used in this project
  const projectVendorIds = new Set(
    budgetItems.filter((item) => item.vendor_id).map((item) => item.vendor_id)
  );

  // Calculate totals per vendor (using forecast if available, otherwise underwriting)
  const vendorTotals = useMemo(() => {
    const totals = new Map<string, { budget: number; actual: number; items: number }>();
    budgetItems.forEach((item) => {
      if (item.vendor_id) {
        const existing = totals.get(item.vendor_id) || { budget: 0, actual: 0, items: 0 };
        const itemBudget = item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount;
        totals.set(item.vendor_id, {
          budget: existing.budget + itemBudget,
          actual: existing.actual + (item.actual_amount || 0),
          items: existing.items + 1,
        });
      }
    });
    return totals;
  }, [budgetItems]);

  // Filter vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = vendor.name.toLowerCase().includes(query);
        const matchesContact = vendor.contact_name?.toLowerCase().includes(query);
        const matchesTrade = VENDOR_TRADE_LABELS[vendor.trade].toLowerCase().includes(query);
        if (!matchesName && !matchesContact && !matchesTrade) {
          return false;
        }
      }

      // Trade filter
      if (tradeFilter !== 'all' && vendor.trade !== tradeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && vendor.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [vendors, searchQuery, tradeFilter, statusFilter]);

  // Separate project vendors and directory vendors
  const projectVendors = filteredVendors.filter((v) => projectVendorIds.has(v.id));
  const otherVendors = filteredVendors.filter((v) => !projectVendorIds.has(v.id));

  // Get unique trades for filter
  const uniqueTrades = useMemo(() => {
    const trades = new Set<VendorTrade>();
    vendors.forEach((v) => trades.add(v.trade));
    return Array.from(trades).sort((a, b) =>
      VENDOR_TRADE_LABELS[a].localeCompare(VENDOR_TRADE_LABELS[b])
    );
  }, [vendors]);

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setVendorDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setVendorDialogOpen(true);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const renderVendorCard = (vendor: Vendor, isProjectVendor: boolean) => {
    const totals = vendorTotals.get(vendor.id);

    return (
      <div
        key={vendor.id}
        className={cn(
          'rounded-lg border bg-card p-4 group relative',
          isProjectVendor && 'border-primary/30'
        )}
      >
        {/* Action buttons (top right) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Actions</span>
                <IconEdit className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                <IconEdit className="h-4 w-4 mr-2" />
                Edit Vendor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteVendor(vendor)}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete Vendor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{vendor.name}</h4>
            <p className="text-sm text-muted-foreground">
              {VENDOR_TRADE_LABELS[vendor.trade]}
            </p>
          </div>
          {vendor.rating && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <IconStar
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < vendor.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300'
                  )}
                />
              ))}
            </div>
          )}
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
            <span className={vendor.licensed ? 'text-green-600' : 'text-zinc-400'}>
              Licensed
            </span>
          </div>
          <div className="flex items-center gap-1">
            {vendor.insured ? (
              <IconCheck className="h-3 w-3 text-green-600" />
            ) : (
              <IconX className="h-3 w-3 text-zinc-400" />
            )}
            <span className={vendor.insured ? 'text-green-600' : 'text-zinc-400'}>
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
              'text-xs font-medium px-2 py-1 rounded-full',
              vendor.status === 'active' && 'bg-green-100 text-green-700',
              vendor.status === 'inactive' && 'bg-zinc-100 text-zinc-700',
              vendor.status === 'do_not_use' && 'bg-red-100 text-red-700'
            )}
          >
            {vendor.status === 'do_not_use' ? 'Do Not Use' : vendor.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">Vendor Management</h3>
          <p className="text-sm text-muted-foreground">
            {vendors.length} vendors in directory, {projectVendors.length} assigned to this project
          </p>
        </div>
        <Button onClick={handleAddVendor} className="gap-2">
          <IconPlus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Filters */}
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
        <Select value={tradeFilter} onValueChange={(v) => setTradeFilter(v as VendorTrade | 'all')}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <IconFilter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {uniqueTrades.map((trade) => (
              <SelectItem key={trade} value={trade}>
                {VENDOR_TRADE_LABELS[trade]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="do_not_use">Do Not Use</SelectItem>
          </SelectContent>
        </Select>
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
      )}

      {/* Empty State for Project Vendors */}
      {projectVendors.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No vendors assigned yet</p>
          <p className="text-sm text-muted-foreground">
            Assign vendors to budget items in the Budget Detail tab.
          </p>
        </div>
      )}

      {/* All Vendors Directory */}
      {otherVendors.length > 0 && (
        <div>
          <h4 className="font-medium mb-4 text-sm text-muted-foreground uppercase tracking-wide">
            Vendor Directory ({otherVendors.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherVendors.map((vendor) => renderVendorCard(vendor, false))}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredVendors.length === 0 && vendors.length > 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-2">No vendors match your filters</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setTradeFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Empty Directory */}
      {vendors.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-4">Your vendor directory is empty</p>
          <Button onClick={handleAddVendor} className="gap-2">
            <IconPlus className="h-4 w-4" />
            Add Your First Vendor
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <VendorDialog
        open={vendorDialogOpen}
        onOpenChange={setVendorDialogOpen}
        vendor={selectedVendor}
      />

      <DeleteVendorDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        vendor={selectedVendor}
      />
    </div>
  );
}
