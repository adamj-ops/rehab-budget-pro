'use client';

import { IconSearch, IconX } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { TemplateFilters } from '@/hooks/use-budget-templates';
import { SCOPE_LEVEL_LABELS } from '@/types';
import type { ScopeLevel, TemplateType, PropertyType } from '@/types';

interface TemplateFiltersBarProps {
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
}

const propertyTypeOptions = [
  { value: 'sfh', label: 'Single Family' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
];

export function TemplateFiltersBar({ filters, onFiltersChange }: TemplateFiltersBarProps) {
  const hasActiveFilters = !!(
    filters.search ||
    (filters.type && filters.type !== 'all') ||
    filters.scopeLevel ||
    filters.propertyType ||
    filters.favoritesOnly
  );

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-9"
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type filter */}
        <Select
          value={filters.type || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              type: value === 'all' ? undefined : (value as TemplateType | 'all'),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user">My Templates</SelectItem>
            <SelectItem value="system">System Templates</SelectItem>
          </SelectContent>
        </Select>

        {/* Scope filter */}
        <Select
          value={filters.scopeLevel || 'any'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              scopeLevel: value === 'any' ? undefined : (value as ScopeLevel),
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Any Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Scope</SelectItem>
            {(Object.entries(SCOPE_LEVEL_LABELS) as [ScopeLevel, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Property type filter */}
        <Select
          value={filters.propertyType || 'any'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              propertyType: value === 'any' ? undefined : (value as PropertyType),
            })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Any Property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Property</SelectItem>
            {propertyTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Favorites toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="favorites"
            checked={filters.favoritesOnly || false}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, favoritesOnly: checked || undefined })
            }
          />
          <Label htmlFor="favorites" className="text-sm cursor-pointer">
            Favorites only
          </Label>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <IconX className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
