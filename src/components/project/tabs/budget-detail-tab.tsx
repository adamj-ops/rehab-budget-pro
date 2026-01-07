'use client';

import { Fragment, useMemo, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconX,
  IconUser,
  IconPlus,
  IconTrash,
  IconSquare,
  IconSquareCheck,
  IconListCheck,
  IconLoader2,
  IconCamera,
  IconGripVertical,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatCurrency, groupBy } from '@/lib/utils';
import type { BudgetItem, BudgetCategory, Vendor, ItemStatus } from '@/types';
import { BUDGET_CATEGORIES, STATUS_LABELS, VENDOR_TRADE_LABELS } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BudgetItemFormSheet } from '@/components/project/budget-item-form-sheet';
import { PhotoUploadSheet } from '@/components/project/photo-upload-sheet';
import { useBudgetItemMutations } from '@/hooks/use-budget-item-mutations';
import { useProjectPhotos } from '@/hooks/use-photo-mutations';
import { useSortOrderMutations } from '@/hooks/use-sort-order';

interface BudgetDetailTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  vendors: Vendor[];
  contingencyPercent: number;
  vendors?: Vendor[];
}

interface NewItemForm {
  item: string;
  description: string;
  underwriting_amount: number;
  forecast_amount: number;
  actual_amount: number;
}

const defaultNewItem: NewItemForm = {
  item: '',
  description: '',
  underwriting_amount: 0,
  forecast_amount: 0,
  actual_amount: 0,
};

export function BudgetDetailTab({
  projectId,
  budgetItems,
  vendors,
  contingencyPercent,
  vendors = [],
}: BudgetDetailTabProps) {
  const queryClient = useQueryClient();
  const { createItem, deleteItem, bulkUpdateStatus, bulkDelete } = useBudgetItemMutations(projectId);
  const { data: projectPhotos = [] } = useProjectPhotos(projectId);
  const { reorderItems } = useSortOrderMutations(projectId);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create photo count map by line item
  const photoCountByItem = useMemo(() => {
    const counts = new Map<string, number>();
    projectPhotos.forEach((photo) => {
      const current = counts.get(photo.line_item_id) || 0;
      counts.set(photo.line_item_id, current + 1);
    });
    return counts;
  }, [projectPhotos]);

  // UI State
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BUDGET_CATEGORIES.map((c) => c.value))
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<BudgetItem>>({});

  // Add Item State
  const [addItemCategory, setAddItemCategory] = useState<BudgetCategory | null>(null);

  // Delete Item State
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>('');

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusMenuOpen, setBulkStatusMenuOpen] = useState(false);

  // Photo Upload State
  const [photoItem, setPhotoItem] = useState<BudgetItem | null>(null);

  // Create a map for quick vendor lookup
  const vendorMap = useMemo(() => {
    const map = new Map<string, Vendor>();
    vendors.forEach((v) => map.set(v.id, v));
    return map;
  }, [vendors]);

  // Group items by category (sorted by sort_order)
  const itemsByCategory = useMemo(() => {
    const grouped = groupBy(budgetItems, 'category');
    return BUDGET_CATEGORIES.map((cat) => {
      const items = (grouped[cat.value] || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      return {
        ...cat,
        items,
        itemIds: items.map((item) => item.id),
        underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
        forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
        actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
      };
    });
  }, [budgetItems]);

  // Handle drag end for reordering items within a category
  const handleDragEnd = useCallback(
    (event: DragEndEvent, categoryItems: BudgetItem[]) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = categoryItems.findIndex((item) => item.id === active.id);
        const newIndex = categoryItems.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(categoryItems, oldIndex, newIndex);
          const newItemIds = newOrder.map((item) => item.id);

          // Persist the new order
          reorderItems.mutate({ itemIds: newItemIds });
        }
      }
    },
    [reorderItems]
  );

  // Calculate totals
  const underwritingTotal = itemsByCategory.reduce((sum, cat) => sum + cat.underwriting, 0);
  const forecastTotal = itemsByCategory.reduce((sum, cat) => sum + cat.forecast, 0);
  const actualTotal = itemsByCategory.reduce((sum, cat) => sum + cat.actual, 0);

  // Use forecast as primary budget if set, otherwise underwriting
  const primaryBudget = forecastTotal > 0 ? forecastTotal : underwritingTotal;
  const contingencyAmount = primaryBudget * (contingencyPercent / 100);

  // Variances
  const forecastVariance = forecastTotal - underwritingTotal;
  const actualVariance = actualTotal - (forecastTotal > 0 ? forecastTotal : underwritingTotal);
  const totalVariance = actualTotal - underwritingTotal;

  const toggleCategory = (category: string) => {
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

  // Mutation for updating budget items
  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; data: Partial<BudgetItem> }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .update(updates.data)
        .eq('id', updates.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Budget item updated');
      setEditingItemId(null);
      setEditValues({});
    },
    onError: (error) => {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update budget item');
    },
  });

  // Quick vendor assignment (without entering full edit mode)
  const assignVendorMutation = useMutation({
    mutationFn: async ({ itemId, vendorId }: { itemId: string; vendorId: string | null }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .update({ vendor_id: vendorId })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Vendor assigned');
    },
    onError: (error) => {
      console.error('Error assigning vendor:', error);
      toast.error('Failed to assign vendor');
    },
  });

  const handleEdit = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditValues({
      underwriting_amount: item.underwriting_amount,
      forecast_amount: item.forecast_amount,
      actual_amount: item.actual_amount,
      status: item.status,
      vendor_id: item.vendor_id,
    });
  };

  const handleSave = (itemId: string) => {
    updateMutation.mutate({ id: itemId, data: editValues });
  };

  const handleCancel = () => {
    setEditingItemId(null);
    setEditValues({});
  };

  const handleInputChange = (field: keyof BudgetItem, value: number | string | null) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickVendorAssign = (itemId: string, vendorId: string | null) => {
    assignVendorMutation.mutate({ itemId, vendorId });
  };

  // Add Item Handlers
  const handleOpenAddItem = (category: BudgetCategory) => {
    setAddItemCategory(category);
  };

  const handleAddItem = (item: Partial<BudgetItem>) => {
    createItem.mutate({ projectId, item });
  };

  // Delete Item Handlers
  const handleOpenDeleteItem = (item: BudgetItem) => {
    setDeleteItemId(item.id);
    setDeleteItemName(item.item);
  };

  const handleConfirmDelete = () => {
    if (deleteItemId) {
      deleteItem.mutate(deleteItemId, {
        onSuccess: () => {
          setDeleteItemId(null);
          setDeleteItemName('');
        },
      });
    }
  };

  // Bulk Selection Handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    if (isSelectionMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAllInCategory = (categoryItems: BudgetItem[]) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      categoryItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const deselectAllInCategory = (categoryItems: BudgetItem[]) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      categoryItems.forEach((item) => next.delete(item.id));
      return next;
    });
  };

  const selectAll = () => {
    const allIds = budgetItems.map((item) => item.id);
    setSelectedItems(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // Bulk Actions
  const handleBulkDelete = () => {
    const itemIds = Array.from(selectedItems);
    bulkDelete.mutate(
      { itemIds },
      {
        onSuccess: () => {
          setSelectedItems(new Set());
          setBulkDeleteOpen(false);
        },
      }
    );
  };

  const handleBulkStatusUpdate = (status: ItemStatus) => {
    const itemIds = Array.from(selectedItems);
    bulkUpdateStatus.mutate(
      { itemIds, status },
      {
        onSuccess: () => {
          setSelectedItems(new Set());
          setBulkStatusMenuOpen(false);
        },
      }
    );
  };

  // Sortable Row Component
  const SortableRow = ({
    item,
    children,
    isSelected,
    disabled,
  }: {
    item: BudgetItem;
    children: React.ReactNode;
    isSelected: boolean;
    disabled: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id, disabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={cn(
          'border-t hover:bg-muted/50 group',
          isSelected && 'bg-primary/5',
          isDragging && 'opacity-50 bg-muted shadow-lg relative z-50'
        )}
        {...attributes}
      >
        {/* Drag Handle Cell */}
        {!isSelectionMode && (
          <td className="p-1 w-8 sticky left-0 bg-background">
            {!disabled && (
              <button
                type="button"
                {...listeners}
                className={cn(
                  'p-1 rounded cursor-grab active:cursor-grabbing',
                  'text-muted-foreground/40 hover:text-muted-foreground',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  isDragging && 'opacity-100 cursor-grabbing'
                )}
                title="Drag to reorder"
              >
                <IconGripVertical className="h-4 w-4" />
              </button>
            )}
          </td>
        )}
        {children}
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar - Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted">
        <div>
          <p className="text-sm text-muted-foreground">Underwriting</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(underwritingTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Pre-deal estimate</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Forecast</p>
          <p className="text-xl font-semibold text-blue-600 tabular-nums">{formatCurrency(forecastTotal)}</p>
          <p className={cn(
            'text-xs mt-1 tabular-nums',
            forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)} vs UW
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Actual</p>
          <p className="text-xl font-semibold text-purple-600 tabular-nums">{formatCurrency(actualTotal)}</p>
          <p className={cn(
            'text-xs mt-1 tabular-nums',
            actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)} vs Forecast
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Variance</p>
          <p className={cn(
            'text-xl font-semibold tabular-nums',
            totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
          )}>
            {totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Actual vs Underwriting</p>
        </div>
      </div>

      {/* Selection Mode Toggle & Bulk Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant={isSelectionMode ? 'default' : 'outline'}
          size="sm"
          onClick={toggleSelectionMode}
        >
          <IconListCheck className="h-4 w-4 mr-2" />
          {isSelectionMode ? 'Exit Selection' : 'Select Items'}
        </Button>

        {isSelectionMode && selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>

            {/* Bulk Status Update */}
            <Select
              value=""
              onValueChange={(value) => handleBulkStatusUpdate(value as ItemStatus)}
            >
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Set Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <IconTrash className="h-4 w-4 mr-1" />
              Delete
            </Button>

            {/* Select All / Deselect All */}
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={deselectAll}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Budget Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {isSelectionMode && <th className="p-3 w-10"></th>}
                {!isSelectionMode && <th className="p-1 w-8 sticky left-0 bg-muted"></th>}
                <th className="text-left p-3 w-8 sticky left-8 bg-muted"></th>
                <th className="text-left p-3 min-w-[200px] sticky left-16 bg-muted">Item</th>
                <th className="text-left p-3 w-36">Vendor</th>
                <th className="text-right p-3 w-28 bg-blue-50">
                  <div className="font-semibold">Underwriting</div>
                  <div className="text-xs font-normal text-muted-foreground">Pre-deal</div>
                </th>
                <th className="text-right p-3 w-28 bg-green-50">
                  <div className="font-semibold">Forecast</div>
                  <div className="text-xs font-normal text-muted-foreground">Post-bid</div>
                </th>
                <th className="text-right p-3 w-28 bg-purple-50">
                  <div className="font-semibold">Actual</div>
                  <div className="text-xs font-normal text-muted-foreground">Real spend</div>
                </th>
                <th className="text-right p-3 w-28">Forecast Var</th>
                <th className="text-right p-3 w-28">Actual Var</th>
                <th className="text-center p-3 w-28">Status</th>
                <th className="text-center p-3 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {itemsByCategory.map((category) => {
                const isExpanded = expandedCategories.has(category.value);
                const catForecastVar = category.forecast - category.underwriting;
                const catActualVar = category.actual - (category.forecast > 0 ? category.forecast : category.underwriting);
                const categoryItemsSelected = category.items.filter((item) => selectedItems.has(item.id)).length;
                const allCategorySelected = category.items.length > 0 && categoryItemsSelected === category.items.length;

                return (
                  <Fragment key={category.value}>
                    {/* Category Header Row */}
                    <tr
                      className="category-header cursor-pointer hover:bg-primary/15"
                    >
                      {isSelectionMode && (
                        <td
                          className="p-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {category.items.length > 0 && (
                            <Checkbox
                              checked={allCategorySelected}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  selectAllInCategory(category.items);
                                } else {
                                  deselectAllInCategory(category.items);
                                }
                              }}
                            />
                          )}
                        </td>
                      )}
                      {!isSelectionMode && (
                        <td className="p-1 sticky left-0 bg-muted"></td>
                      )}
                      <td
                        className="p-3 sticky left-8 bg-muted"
                        onClick={() => toggleCategory(category.value)}
                      >
                        {isExpanded ? (
                          <IconChevronDown className="h-4 w-4" />
                        ) : (
                          <IconChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td
                        className="p-3 font-medium sticky left-16 bg-muted"
                        onClick={() => toggleCategory(category.value)}
                      >
                        {category.label}
                        <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                          ({category.items.length} items)
                        </span>
                        {isSelectionMode && categoryItemsSelected > 0 && (
                          <span className="ml-2 text-xs font-normal text-primary">
                            ({categoryItemsSelected} selected)
                          </span>
                        )}
                      </td>
                      <td className="p-3 bg-muted" onClick={() => toggleCategory(category.value)}></td>
                      <td className="p-3 text-right font-medium bg-blue-50/50 tabular-nums" onClick={() => toggleCategory(category.value)}>
                        {formatCurrency(category.underwriting)}
                      </td>
                      <td className="p-3 text-right font-medium bg-green-50/50 tabular-nums" onClick={() => toggleCategory(category.value)}>
                        {formatCurrency(category.forecast)}
                      </td>
                      <td className="p-3 text-right font-medium bg-purple-50/50 tabular-nums" onClick={() => toggleCategory(category.value)}>
                        {formatCurrency(category.actual)}
                      </td>
                      <td className={cn(
                        'p-3 text-right font-medium tabular-nums',
                        catForecastVar >= 0 ? 'text-red-600' : 'text-green-600'
                      )} onClick={() => toggleCategory(category.value)}>
                        {catForecastVar >= 0 ? '+' : ''}{formatCurrency(catForecastVar)}
                      </td>
                      <td className={cn(
                        'p-3 text-right font-medium tabular-nums',
                        catActualVar >= 0 ? 'text-red-600' : 'text-green-600'
                      )} onClick={() => toggleCategory(category.value)}>
                        {catActualVar >= 0 ? '+' : ''}{formatCurrency(catActualVar)}
                      </td>
                      <td onClick={() => toggleCategory(category.value)}></td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddItem(category.value);
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          <IconPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </td>
                    </tr>

                    {/* Item Rows - Wrapped in DndContext for drag & drop */}
                    {isExpanded && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, category.items)}
                      >
                        <SortableContext
                          items={category.itemIds}
                          strategy={verticalListSortingStrategy}
                        >
                          {category.items.map((item) => {
                            const isEditing = editingItemId === item.id;
                            const itemForecastVar = (item.forecast_amount || 0) - (item.underwriting_amount || 0);
                            const itemActualVar = (item.actual_amount || 0) - ((item.forecast_amount || item.underwriting_amount) || 0);
                            const vendor = item.vendor_id ? vendorMap.get(item.vendor_id) : null;
                            const isSelected = selectedItems.has(item.id);

                            return (
                              <SortableRow
                                key={item.id}
                                item={item}
                                isSelected={isSelected}
                                disabled={isEditing || isSelectionMode}
                              >
                                {isSelectionMode && (
                                  <td className="p-3">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleItemSelection(item.id)}
                                    />
                                  </td>
                                )}
                                <td className="p-3 sticky left-8 bg-background">
                            <div>
                              <p className="font-medium">{item.item}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <Select
                                value={editValues.vendor_id || '_none'}
                                onValueChange={(value) =>
                                  handleInputChange('vendor_id', value === '_none' ? null : value)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">
                                    <span className="text-muted-foreground">No vendor</span>
                                  </SelectItem>
                                  {vendors.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                      <div className="flex flex-col">
                                        <span>{v.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {VENDOR_TRADE_LABELS[v.trade]}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Select
                                value={item.vendor_id || '_none'}
                                onValueChange={(value) =>
                                  handleQuickVendorAssign(item.id, value === '_none' ? null : value)
                                }
                                disabled={assignVendorMutation.isPending}
                              >
                                <SelectTrigger className="h-8 text-xs border-dashed">
                                  <SelectValue>
                                    {vendor ? (
                                      <div className="flex items-center gap-1">
                                        <IconUser className="h-3 w-3" />
                                        <span className="truncate max-w-20">{vendor.name}</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Assign...</span>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="_none">
                                    <span className="text-muted-foreground">No vendor</span>
                                  </SelectItem>
                                  {vendors.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                      <div className="flex flex-col">
                                        <span>{v.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {VENDOR_TRADE_LABELS[v.trade]}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.underwriting_amount ?? ''}
                                onChange={(e) => handleInputChange('underwriting_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.underwriting_amount)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.forecast_amount ?? ''}
                                onChange={(e) => handleInputChange('forecast_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.forecast_amount)}</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editValues.actual_amount ?? ''}
                                onChange={(e) => handleInputChange('actual_amount', parseFloat(e.target.value) || 0)}
                                className="w-24 text-right p-1 rounded border focus:outline-none focus:ring-2 focus:ring-primary tabular-nums"
                                placeholder="0"
                              />
                            ) : (
                              <span className="font-medium tabular-nums">{formatCurrency(item.actual_amount || 0)}</span>
                            )}
                          </td>
                          <td className={cn(
                            'p-3 text-right text-sm tabular-nums',
                            itemForecastVar > 0 ? 'text-red-600' : itemForecastVar < 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {itemForecastVar >= 0 ? '+' : ''}{formatCurrency(itemForecastVar)}
                          </td>
                          <td className={cn(
                            'p-3 text-right text-sm tabular-nums',
                            itemActualVar > 0 ? 'text-red-600' : itemActualVar < 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {itemActualVar >= 0 ? '+' : ''}{formatCurrency(itemActualVar)}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <select
                                value={editValues.status || item.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                className="text-xs p-1 rounded border"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="complete">Complete</option>
                                <option value="on_hold">On Hold</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className={cn(
                                'inline-block px-2 py-1 rounded-full text-xs font-medium',
                                item.status === 'complete' && 'bg-green-100 text-green-700',
                                item.status === 'in_progress' && 'bg-blue-100 text-blue-700',
                                item.status === 'not_started' && 'bg-zinc-100 text-zinc-700',
                                item.status === 'on_hold' && 'bg-yellow-100 text-yellow-700',
                                item.status === 'cancelled' && 'bg-red-100 text-red-700'
                              )}>
                                {STATUS_LABELS[item.status]}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSave(item.id)}
                                  className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
                                  disabled={updateMutation.isPending}
                                >
                                  <IconCheck className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancel}
                                  className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                  disabled={updateMutation.isPending}
                                >
                                  <IconX className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPhotoItem(item)}
                                  className={cn(
                                    'p-1 rounded transition-colors relative',
                                    photoCountByItem.get(item.id)
                                      ? 'text-primary hover:bg-primary/10'
                                      : 'text-muted-foreground hover:bg-muted hover:text-primary'
                                  )}
                                  title={`Photos (${photoCountByItem.get(item.id) || 0})`}
                                >
                                  <IconCamera className="h-4 w-4" />
                                  {photoCountByItem.get(item.id) ? (
                                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                                      {photoCountByItem.get(item.id)}
                                    </span>
                                  ) : null}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                                  title="Edit item"
                                >
                                  <IconEdit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteItem(item)}
                                  className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
                                  title="Delete item"
                                >
                                  <IconTrash className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                              </SortableRow>
                            );
                          })}
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* Empty State with Add Button */}
                    {isExpanded && category.items.length === 0 && (
                      <tr>
                        <td colSpan={isSelectionMode ? 12 : 12} className="p-4 text-center text-sm text-muted-foreground">
                          No items in this category.{' '}
                          <button
                            type="button"
                            onClick={() => handleOpenAddItem(category.value)}
                            className="text-primary hover:underline"
                          >
                            Add one
                          </button>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {/* Contingency Row */}
              <tr className="border-t-2 bg-muted/50">
                {isSelectionMode && <td className="p-3"></td>}
                {!isSelectionMode && <td className="p-1 bg-muted/50"></td>}
                <td className="p-3 bg-muted/50"></td>
                <td className="p-3 font-medium bg-muted/50" colSpan={2}>
                  Contingency ({contingencyPercent}%)
                </td>
                <td></td>
                <td colSpan={2}></td>
                <td className="p-3 text-right font-medium">
                  {formatCurrency(contingencyAmount)}
                </td>
                <td colSpan={4}></td>
              </tr>

              {/* Grand Total Row */}
              <tr className="border-t-2 bg-primary/10">
                {isSelectionMode && <td className="p-3"></td>}
                {!isSelectionMode && <td className="p-1 bg-primary/10"></td>}
                <td className="p-3 bg-primary/10"></td>
                <td className="p-3 font-semibold text-primary bg-primary/10" colSpan={2}>
                  GRAND TOTAL
                </td>
                <td></td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(underwritingTotal)}
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(forecastTotal)}
                </td>
                <td className="p-3 text-right font-semibold">
                  {formatCurrency(actualTotal)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold',
                  forecastVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {forecastVariance >= 0 ? '+' : ''}{formatCurrency(forecastVariance)}
                </td>
                <td className={cn(
                  'p-3 text-right font-semibold',
                  actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {actualVariance >= 0 ? '+' : ''}{formatCurrency(actualVariance)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100"></div>
          <span>Underwriting: Pre-deal estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100"></div>
          <span>Forecast: Post-walkthrough/bid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-100"></div>
          <span>Actual: Real spend</span>
        </div>
      </div>

      {/* Add Item Sheet */}
      {addItemCategory && (
        <BudgetItemFormSheet
          open={!!addItemCategory}
          onOpenChange={(open) => !open && setAddItemCategory(null)}
          category={addItemCategory}
          vendors={vendors}
          onSubmit={handleAddItem}
          isPending={createItem.isPending}
        />
      )}

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteItemId(null);
            setDeleteItemName('');
          }
        }}
        title="Delete Line Item"
        description={`Are you sure you want to delete "${deleteItemName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isPending={deleteItem.isPending}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Selected Items"
        description={`Are you sure you want to delete ${selectedItems.size} selected item${selectedItems.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
        variant="destructive"
        onConfirm={handleBulkDelete}
        isPending={bulkDelete.isPending}
      />

      {/* Photo Upload Sheet */}
      {photoItem && (
        <PhotoUploadSheet
          open={!!photoItem}
          onOpenChange={(open) => !open && setPhotoItem(null)}
          projectId={projectId}
          budgetItem={photoItem}
        />
      )}
    </div>
  );
}
