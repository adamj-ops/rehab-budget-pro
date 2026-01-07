'use client';

import { Fragment, useMemo, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconGripVertical,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { PhotoGallery } from '@/components/project/photo-gallery';
import { toast } from 'sonner';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable Budget Item Row Component
interface SortableBudgetItemRowProps {
  item: BudgetItem;
  isEditing: boolean;
  editValues: Partial<BudgetItem>;
  onEdit: (item: BudgetItem) => void;
  onSave: (itemId: string) => void;
  onCancel: () => void;
  onInputChange: (field: keyof BudgetItem, value: number | string) => void;
  onDelete: (item: BudgetItem) => void;
  onViewPhotos: (item: BudgetItem) => void;
  updatePending: boolean;
}

function SortableBudgetItemRow({
  item,
  isEditing,
  editValues,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
  onDelete,
  onViewPhotos,
  updatePending,
}: SortableBudgetItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const itemForecastVar = (item.forecast_amount || 0) - (item.underwriting_amount || 0);
  const itemActualVar = (item.actual_amount || 0) - ((item.forecast_amount || item.underwriting_amount) || 0);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-t hover:bg-muted/50',
        isDragging && 'bg-muted shadow-lg'
      )}
    >
      <td className="p-3 sticky left-0 bg-background">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted text-muted-foreground"
          {...attributes}
          {...listeners}
        >
          <IconGripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3 sticky left-12 bg-background">
        <div>
          <p className="font-medium">{item.item}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      </td>
      <td className="p-3 text-right">
        {isEditing ? (
          <input
            type="number"
            step="0.01"
            value={editValues.underwriting_amount ?? ''}
            onChange={(e) => onInputChange('underwriting_amount', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => onInputChange('forecast_amount', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => onInputChange('actual_amount', parseFloat(e.target.value) || 0)}
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
            onChange={(e) => onInputChange('status', e.target.value)}
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
              onClick={() => onSave(item.id)}
              className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
              disabled={updatePending}
            >
              <IconCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
              disabled={updatePending}
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onViewPhotos(item)}
              className="p-1 rounded hover:bg-blue-100 text-muted-foreground hover:text-blue-600 transition-colors"
              title="View photos"
            >
              <IconPhoto className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Edit item"
            >
              <IconEdit className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600 transition-colors"
              title="Delete item"
            >
              <IconTrash className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

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

  // Photo gallery state
  const [viewingPhotosForItem, setViewingPhotosForItem] = useState<BudgetItem | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group items by category and sort by sort_order
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

  // Mutation for reordering budget items
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const supabase = getSupabaseClient();

      // Update all items in parallel
      const results = await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase
            .from('budget_items')
            .update({ sort_order })
            .eq('id', id)
        )
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error) => {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
    },
  });

  // Mutation for creating budget items
  const createMutation = useMutation({
    mutationFn: async (newItem: { category: BudgetCategory; data: NewItemForm }) => {
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

  const handleDragEnd = (event: DragEndEvent, categoryItems: BudgetItem[]) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categoryItems.findIndex((item) => item.id === active.id);
      const newIndex = categoryItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(categoryItems, oldIndex, newIndex);

        // Create update array with new sort orders
        const updates = newOrder.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }));

        reorderMutation.mutate(updates);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-lg bg-muted">
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
                <th className="text-left p-3 w-12 sticky left-0 bg-muted"></th>
                <th className="text-left p-3 min-w-[200px] sticky left-12 bg-muted">Item</th>
                <th className="text-right p-3 w-28 bg-blue-50">
                  <div className="font-semibold">Underwriting</div>
                  <div className="text-xs font-normal text-muted-foreground">Pre-deal</div>
                </th>
                <th className="text-right w-28 col-forecast">
                  <div className="font-semibold">Forecast</div>
                  <div className="text-xs font-normal text-muted-foreground">Post-bid</div>
                </th>
                <th className="text-right w-28 col-actual">
                  <div className="font-semibold">Actual</div>
                  <div className="text-xs font-normal text-muted-foreground">Real spend</div>
                </th>
                <th className="text-right p-3 w-28">Forecast Var</th>
                <th className="text-right p-3 w-28">Actual Var</th>
                <th className="text-center p-3 w-28">Status</th>
                <th className="text-center p-3 w-28">Actions</th>
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
                      <td className="p-3 font-medium sticky left-12 bg-muted">
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
                      <td className="p-3 text-right font-medium col-underwriting tabular-nums">
                        {formatCurrency(category.underwriting)}
                      </td>
                      <td className="p-3 text-right font-medium col-forecast tabular-nums">
                        {formatCurrency(category.forecast)}
                      </td>
                      <td className="p-3 text-right font-medium col-actual tabular-nums">
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

                    {/* Sortable Item Rows */}
                    {isExpanded && category.items.length > 0 && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, category.items)}
                      >
                        <SortableContext
                          items={category.items.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {category.items.map((item) => (
                            <SortableBudgetItemRow
                              key={item.id}
                              item={item}
                              isEditing={editingItemId === item.id}
                              editValues={editValues}
                              onEdit={handleEdit}
                              onSave={handleSave}
                              onCancel={handleCancel}
                              onInputChange={handleInputChange}
                              onDelete={handleDeleteClick}
                              onViewPhotos={setViewingPhotosForItem}
                              updatePending={updateMutation.isPending}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* Add Item Row (when adding to this category) */}
                    {isExpanded && isAddingToThis && (
                      <tr className="border-t bg-green-50/30">
                        <td className="p-3 sticky left-0 bg-green-50/30"></td>
                        <td className="p-3 sticky left-12 bg-green-50/30">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={newItemForm.item}
                              onChange={(e) => handleNewItemChange('item', e.target.value)}
                              placeholder="Item name *"
                              className="w-full px-2 py-1.5 rounded border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={newItemForm.description}
                              onChange={(e) => handleNewItemChange('description', e.target.value)}
                              placeholder="Description (optional)"
                              className="w-full px-2 py-1 rounded border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={newItemForm.underwriting_amount || ''}
                            onChange={(e) => handleNewItemChange('underwriting_amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="inline-input"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={newItemForm.forecast_amount || ''}
                            onChange={(e) => handleNewItemChange('forecast_amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="inline-input"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={newItemForm.actual_amount || ''}
                            onChange={(e) => handleNewItemChange('actual_amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="inline-input"
                          />
                        </td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3"></td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={handleSaveNewItem}
                              className="action-btn action-btn-save"
                              disabled={createMutation.isPending}
                              title="Save item"
                            >
                              <IconCheck className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelAdd}
                              className="action-btn action-btn-cancel"
                              disabled={createMutation.isPending}
                              title="Cancel"
                            >
                              <IconX className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
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
                <td className="p-3 sticky left-0 bg-muted/50"></td>
                <td className="p-3 font-medium sticky left-12 bg-muted/50">
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
                <td className="p-3 sticky left-0 bg-primary/10"></td>
                <td className="p-3 font-semibold text-primary sticky left-12 bg-primary/10">
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
      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <IconGripVertical className="h-3 w-3" />
          <span>Drag to reorder</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded col-underwriting border"></div>
          <span>Underwriting: Pre-deal estimate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded col-forecast border"></div>
          <span>Forecast: Post-walkthrough/bid</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded col-actual border"></div>
          <span>Actual: Real spend</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.item}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Gallery Modal */}
      {viewingPhotosForItem && (
        <PhotoGallery
          projectId={projectId}
          budgetItem={viewingPhotosForItem}
          onClose={() => setViewingPhotosForItem(null)}
        />
      )}
    </div>
  );
}
