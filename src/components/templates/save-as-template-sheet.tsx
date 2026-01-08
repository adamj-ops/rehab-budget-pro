'use client';

import * as React from 'react';
import type { BudgetItem, PropertyType, ScopeLevel, BudgetCategory } from '@/types';
import { SCOPE_LEVEL_LABELS, BUDGET_CATEGORIES } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { IconLoader2, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useSaveProjectAsTemplate } from '@/hooks';
import { cn } from '@/lib/utils';

interface SaveAsTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  budgetItems: BudgetItem[];
}

// Category labels lookup
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<BudgetCategory, string>
);

// Property type options
const propertyTypeOptions = [
  { value: 'sfh', label: 'Single Family Home' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
];

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function SaveAsTemplateSheet({
  open,
  onOpenChange,
  projectId,
  budgetItems,
}: SaveAsTemplateSheetProps) {
  const saveAsTemplate = useSaveProjectAsTemplate();

  // Form state
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [propertyType, setPropertyType] = React.useState<PropertyType | ''>('');
  const [scopeLevel, setScopeLevel] = React.useState<ScopeLevel | ''>('');
  const [includeAmounts, setIncludeAmounts] = React.useState(true);
  const [selectedItemIds, setSelectedItemIds] = React.useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = React.useState<Set<BudgetCategory>>(new Set());

  // Group items by category
  const itemsByCategory = React.useMemo(() => {
    const grouped = new Map<BudgetCategory, BudgetItem[]>();
    for (const item of budgetItems) {
      const existing = grouped.get(item.category) || [];
      existing.push(item);
      grouped.set(item.category, existing);
    }
    return grouped;
  }, [budgetItems]);

  // Calculate category totals
  const getCategoryTotal = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);
  };

  // Reset form when sheet opens
  React.useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setPropertyType('');
      setScopeLevel('');
      setIncludeAmounts(true);
      // Select all items by default
      setSelectedItemIds(new Set(budgetItems.map((item) => item.id)));
      // Collapse all categories
      setExpandedCategories(new Set());
    }
  }, [open, budgetItems]);

  // Toggle all items in a category
  const toggleCategory = (category: BudgetCategory) => {
    const categoryItems = itemsByCategory.get(category) || [];
    const allSelected = categoryItems.every((item) => selectedItemIds.has(item.id));

    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      for (const item of categoryItems) {
        if (allSelected) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      }
      return next;
    });
  };

  // Toggle single item
  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItemIds.size === budgetItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(budgetItems.map((item) => item.id)));
    }
  };

  // Toggle category expansion
  const toggleExpanded = (category: BudgetCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Check if category is partially selected
  const isCategoryPartiallySelected = (category: BudgetCategory) => {
    const categoryItems = itemsByCategory.get(category) || [];
    const selectedCount = categoryItems.filter((item) => selectedItemIds.has(item.id)).length;
    return selectedCount > 0 && selectedCount < categoryItems.length;
  };

  // Check if all items in category are selected
  const isCategoryFullySelected = (category: BudgetCategory) => {
    const categoryItems = itemsByCategory.get(category) || [];
    return categoryItems.every((item) => selectedItemIds.has(item.id));
  };

  // Calculate selected total
  const selectedTotal = React.useMemo(() => {
    return budgetItems
      .filter((item) => selectedItemIds.has(item.id))
      .reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);
  }, [budgetItems, selectedItemIds]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedItemIds.size === 0) return;

    saveAsTemplate.mutate(
      {
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        propertyType: propertyType || undefined,
        scopeLevel: scopeLevel || undefined,
        includeAmounts,
        selectedItemIds: Array.from(selectedItemIds),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Save as Template</SheetTitle>
          <SheetDescription>
            Save this project&apos;s budget structure as a reusable template
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Full Gut - 3BR SFH"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the typical use case for this template..."
              rows={2}
            />
          </div>

          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scopeLevel">Scope Level</Label>
              <Select
                value={scopeLevel || '_none'}
                onValueChange={(v) => setScopeLevel(v === '_none' ? '' : (v as ScopeLevel))}
              >
                <SelectTrigger id="scopeLevel">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">Not specified</span>
                  </SelectItem>
                  {(Object.entries(SCOPE_LEVEL_LABELS) as [ScopeLevel, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                value={propertyType || '_none'}
                onValueChange={(v) => setPropertyType(v === '_none' ? '' : (v as PropertyType))}
              >
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    <span className="text-muted-foreground">Any property</span>
                  </SelectItem>
                  {propertyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Include Amounts Option */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="includeAmounts"
                checked={includeAmounts}
                onCheckedChange={(checked) => setIncludeAmounts(!!checked)}
              />
              <div>
                <Label htmlFor="includeAmounts" className="cursor-pointer">
                  Include estimated amounts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Copy current underwriting amounts to template
                </p>
              </div>
            </div>
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Items to Include</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs"
              >
                {selectedItemIds.size === budgetItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              {selectedItemIds.size} of {budgetItems.length} items selected
              {includeAmounts && selectedTotal > 0 && ` · ${formatCurrency(selectedTotal)} total`}
            </p>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {Array.from(itemsByCategory.entries()).map(([category, items]) => {
                const isExpanded = expandedCategories.has(category);
                const isFullySelected = isCategoryFullySelected(category);
                const isPartiallySelected = isCategoryPartiallySelected(category);
                const categoryTotal = getCategoryTotal(items);
                const selectedCategoryTotal = items
                  .filter((item) => selectedItemIds.has(item.id))
                  .reduce((sum, item) => sum + (item.underwriting_amount || 0), 0);

                return (
                  <Collapsible
                    key={category}
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(category)}
                  >
                    <div className="flex items-center gap-2 p-2 hover:bg-muted/50">
                      <Checkbox
                        checked={isFullySelected}
                        ref={(el) => {
                          if (el) {
                            (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate =
                              isPartiallySelected;
                          }
                        }}
                        onCheckedChange={() => toggleCategory(category)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <CollapsibleTrigger className="flex-1 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <IconChevronDown className="h-4 w-4" />
                          ) : (
                            <IconChevronRight className="h-4 w-4" />
                          )}
                          <span className="font-medium">{CATEGORY_LABELS[category]}</span>
                          <span className="text-muted-foreground">({items.length})</span>
                        </div>
                        {includeAmounts && (
                          <span
                            className={cn(
                              'text-xs',
                              isFullySelected
                                ? 'text-foreground'
                                : isPartiallySelected
                                  ? 'text-muted-foreground'
                                  : 'text-muted-foreground/50'
                            )}
                          >
                            {isPartiallySelected
                              ? formatCurrency(selectedCategoryTotal)
                              : formatCurrency(categoryTotal)}
                          </span>
                        )}
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent>
                      <div className="pl-8 pr-2 pb-2 space-y-1">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedItemIds.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                              />
                              <span className="text-sm">{item.item}</span>
                            </div>
                            {includeAmounts && item.underwriting_amount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(item.underwriting_amount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saveAsTemplate.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveAsTemplate.isPending || !name.trim() || selectedItemIds.size === 0}
            >
              {saveAsTemplate.isPending ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Template'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
