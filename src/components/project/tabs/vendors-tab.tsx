'use client';

import type { Vendor, BudgetItem } from '@/types';
import { VENDOR_TRADE_LABELS } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { IconPlus, IconStar, IconPhone, IconMail, IconCheck, IconX } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

interface VendorsTabProps {
  projectId: string;
  vendors: Vendor[];
  budgetItems: BudgetItem[];
}

export function VendorsTab({ projectId, vendors, budgetItems }: VendorsTabProps) {
  // Get vendors used in this project
  const projectVendorIds = new Set(
    budgetItems.filter((item) => item.vendor_id).map((item) => item.vendor_id)
  );
  
  const projectVendors = vendors.filter((v) => projectVendorIds.has(v.id));
  const otherVendors = vendors.filter((v) => !projectVendorIds.has(v.id));

  // Calculate totals per vendor (using forecast if available, otherwise underwriting)
  const vendorTotals = new Map<string, { budget: number; actual: number; items: number }>();
  budgetItems.forEach((item) => {
    if (item.vendor_id) {
      const existing = vendorTotals.get(item.vendor_id) || { budget: 0, actual: 0, items: 0 };
      const itemBudget = item.forecast_amount > 0 ? item.forecast_amount : item.underwriting_amount;
      vendorTotals.set(item.vendor_id, {
        budget: existing.budget + itemBudget,
        actual: existing.actual + (item.actual_amount || 0),
        items: existing.items + 1,
      });
    }
  });

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
          )}
        </div>

        {/* Qualifications */}
        <div className="flex items-center gap-4 text-xs mb-4">
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Project Vendors</h3>
          <p className="text-sm text-muted-foreground">
            {projectVendors.length} vendors assigned to this project
          </p>
        </div>
        <Button>
          <IconPlus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Project Vendors */}
      {projectVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectVendors.map((vendor) => renderVendorCard(vendor, true))}
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
    </div>
  );
}
