'use client';

import { Fragment, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
  IconChevronDown,
  IconChevronRight,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconFileText,
  IconTemplate,
  IconCurrencyDollar,
  IconGripVertical,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'sonner';

import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import type { BudgetCategory, BudgetItem } from '@/types';
import { BUDGET_CATEGORIES } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetDetailTabProps {
  projectId: string;
  budgetItems: BudgetItem[];
  contingencyPercent: number;
}

// Command popup options
interface CommandOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  shortcut?: string;
  action: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

// Command popup component (Notion-style)
function CommandPopup({
  open,
  onOpenChange,
  options,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: CommandOption[];
  trigger: React.ReactNode;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % options.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + options.length) % options.length);
          break;
        case 'Enter':
          e.preventDefault();
          const option = options[selectedIndex];
          if (option && !option.disabled) {
            option.action();
            onOpenChange(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [open, options, selectedIndex, onOpenChange]
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-1.5 shadow-lg"
        align="start"
        onKeyDown={handleKeyDown}
      >
        <div className="space-y-0.5">
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              onClick={() => {
                if (!option.disabled) {
                  option.action();
                  onOpenChange(false);
                }
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-all duration-150',
                'hover:bg-muted focus:bg-muted focus:outline-none',
                index === selectedIndex && 'bg-muted',
                option.destructive && 'text-destructive hover:bg-destructive/10',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'flex-shrink-0 p-1 rounded',
                !option.destructive && 'bg-muted-foreground/10',
                option.destructive && 'bg-destructive/10'
              )}>
                {option.icon}
              </span>
              <div className="flex-1 text-left">
                <p className="font-medium">{option.label}</p>
                {option.description && (
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                )}
              </div>
              {option.shortcut && (
                <kbd className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {option.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline add item row
function AddItemRow({
  category,
  projectId,
  onSave,
  onCancel,
  nextSortOrder,
}: {
  category: BudgetCategory;
  projectId: string;
  onSave: () => void;
  onCancel: () => void;
  nextSortOrder: number;
}) {
  const [item, setItem] = useState('');
  const [underwriting, setUnderwriting] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          project_id: projectId,
          category,
          item: item.trim(),
          underwriting_amount: underwriting,
          forecast_amount: 0,
          actual_amount: null,
          qty: 1,
          unit: 'each',
          rate: underwriting,
          cost_type: 'materials',
          status: 'not_started',
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Item added');
      onSave();
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      toast.error('Failed to add item');
      setIsSaving(false);
    },
  });

  const handleSubmit = () => {
    if (!item.trim()) {
      toast.error('Item name is required');
      return;
    }
    setIsSaving(true);
    createMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <tr className="border-t bg-primary/5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
      <td className="p-2 w-10">
        <div className="w-4" />
      </td>
      <td className="p-2 w-8">
        <div className="w-4" />
      </td>
      <td className="p-2">
        <Input
          ref={inputRef}
          value={item}
          onChange={(e) => setItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Item name..."
          className="h-8"
          disabled={isSaving}
        />
      </td>
      <td className="p-2">
        <Input
          type="number"
          value={underwriting || ''}
          onChange={(e) => setUnderwriting(parseFloat(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className="h-8 w-28 text-right tabular-nums"
          disabled={isSaving}
        />
      </td>
      <td className="p-2 text-muted-foreground text-sm text-right">$0</td>
      <td className="p-2 text-muted-foreground text-sm text-right">$0</td>
      <td className="p-2 text-muted-foreground text-sm text-right">—</td>
      <td className="p-2 text-muted-foreground text-sm text-right">—</td>
      <td className="p-2">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || !item.trim()}
            className="h-7 px-3"
          >
            {isSaving ? <IconLoader2 className="size-4 animate-spin" /> : 'Add'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
            className="h-7 px-2 text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Inline editable currency cell
interface EditableCurrencyCellProps {
  value: number | null;
  itemId: string;
  field: keyof BudgetItem;
  onSave: (itemId: string, field: keyof BudgetItem, value: number) => Promise<void>;
  compareValue?: number | null;
  showVariance?: boolean;
  className?: string;
}

function EditableCurrencyCell({
  value,
  itemId,
  field,
  onSave,
  compareValue,
  showVariance = false,
  className,
}: EditableCurrencyCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValue, setEditValue] = useState(value ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value ?? 0);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (editValue !== (value ?? 0)) {
      setIsSaving(true);
      try {
        await onSave(itemId, field, editValue);
      } catch {
        setEditValue(value ?? 0);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditValue(value ?? 0);
      setIsEditing(false);
    }
  };

  const variance =
    showVariance && compareValue !== undefined && compareValue !== null
      ? (value ?? 0) - compareValue
      : null;

  if (isSaving) {
    return (
      <div className="flex items-center justify-end gap-1 text-muted-foreground h-7">
        <IconLoader2 className="size-3 animate-spin" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn('h-7 w-28 text-right tabular-nums px-2', className)}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
      tabIndex={0}
      role="button"
      className={cn(
        'cursor-pointer rounded px-2 py-1 transition-colors duration-150',
        'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        'min-h-[28px] flex items-center justify-end gap-2',
        className
      )}
    >
      <span className="font-medium tabular-nums">{formatCurrency(value ?? 0)}</span>
      {variance !== null && variance !== 0 && (
        <span
          className={cn(
            'text-xs tabular-nums',
            variance > 0 ? 'text-red-600' : 'text-green-600'
          )}
        >
          {variance > 0 ? '+' : ''}
          {Math.round((variance / (compareValue || 1)) * 100)}%
        </span>
      )}
    </div>
  );
}

// Inline editable badge cell for status
interface EditableStatusCellProps {
  value: string;
  itemId: string;
  onSave: (itemId: string, field: keyof BudgetItem, value: string) => Promise<void>;
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', variant: 'secondary' as const },
  { value: 'in_progress', label: 'In Progress', variant: 'default' as const },
  { value: 'complete', label: 'Complete', variant: 'success' as const },
  { value: 'on_hold', label: 'On Hold', variant: 'outline' as const },
  { value: 'cancelled', label: 'Cancelled', variant: 'destructive' as const },
];

function EditableStatusCell({ value, itemId, onSave }: EditableStatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  const handleValueChange = async (newValue: string) => {
    setIsOpen(false);
    if (newValue !== value) {
      setIsSaving(true);
      try {
        await onSave(itemId, 'status', newValue);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isSaving) {
    return (
      <Badge variant="outline" className="gap-1">
        <IconLoader2 className="size-3 animate-spin" />
      </Badge>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange} open={isOpen} onOpenChange={setIsOpen}>
      <SelectTrigger className="h-auto w-auto border-0 bg-transparent p-0 shadow-none focus:ring-0">
        <Badge variant={currentOption.variant} className="cursor-pointer hover:opacity-80 transition-opacity">
          {currentOption.label}
        </Badge>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <Badge variant={option.variant}>{option.label}</Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Sortable row component
interface SortableRowProps {
  item: BudgetItem;
  isSelected: boolean;
  isDragging?: boolean;
  onToggleSelection: (id: string) => void;
  onCellSave: (itemId: string, field: keyof BudgetItem, value: number | string) => Promise<void>;
}

function SortableRow({
  item,
  isSelected,
  isDragging,
  onToggleSelection,
  onCellSave,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemForecastVar = (item.forecast_amount || 0) - (item.underwriting_amount || 0);
  const itemActualVar =
    (item.actual_amount || 0) - (item.forecast_amount || item.underwriting_amount || 0);

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/row border-t transition-all duration-150',
        isSelected
          ? 'bg-primary/5 hover:bg-primary/10'
          : 'hover:bg-muted/50',
        isSelected && 'border-l-2 border-l-primary',
        isBeingDragged && 'opacity-50 bg-muted shadow-lg z-50'
      )}
    >
      <td className="p-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className={cn(
              'size-4 text-muted-foreground/40 cursor-grab active:cursor-grabbing',
              'opacity-0 group-hover/row:opacity-100 transition-opacity duration-150',
              'hover:text-muted-foreground focus:outline-none'
            )}
          >
            <IconGripVertical className="size-4" />
          </button>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(item.id)}
            className={cn(
              'transition-opacity duration-150',
              !isSelected && 'opacity-0 group-hover/row:opacity-100'
            )}
          />
        </div>
      </td>
      <td className="p-3"></td>
      <td className="p-3">
        <div>
          <p className="font-medium">{item.item}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      </td>
      <td className="p-2 text-right">
        <EditableCurrencyCell
          value={item.underwriting_amount}
          itemId={item.id}
          field="underwriting_amount"
          onSave={onCellSave}
        />
      </td>
      <td className="p-2 text-right">
        <EditableCurrencyCell
          value={item.forecast_amount}
          itemId={item.id}
          field="forecast_amount"
          onSave={onCellSave}
          compareValue={item.underwriting_amount}
          showVariance
        />
      </td>
      <td className="p-2 text-right">
        <EditableCurrencyCell
          value={item.actual_amount}
          itemId={item.id}
          field="actual_amount"
          onSave={onCellSave}
          compareValue={item.forecast_amount || item.underwriting_amount}
          showVariance
        />
      </td>
      <td
        className={cn(
          'p-3 text-right text-sm tabular-nums',
          itemForecastVar > 0
            ? 'text-red-600'
            : itemForecastVar < 0
              ? 'text-green-600'
              : 'text-muted-foreground'
        )}
      >
        {itemForecastVar >= 0 ? '+' : ''}
        {formatCurrency(itemForecastVar)}
      </td>
      <td
        className={cn(
          'p-3 text-right text-sm tabular-nums',
          itemActualVar > 0
            ? 'text-red-600'
            : itemActualVar < 0
              ? 'text-green-600'
              : 'text-muted-foreground'
        )}
      >
        {itemActualVar >= 0 ? '+' : ''}
        {formatCurrency(itemActualVar)}
      </td>
      <td className="p-2 text-center">
        <EditableStatusCell
          value={item.status}
          itemId={item.id}
          onSave={onCellSave}
        />
      </td>
    </tr>
  );
}

// Drag overlay row (ghost preview)
function DragOverlayRow({ item }: { item: BudgetItem }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        <tr className="bg-background border rounded-lg shadow-xl">
          <td className="p-3 w-10">
            <IconGripVertical className="size-4 text-muted-foreground" />
          </td>
          <td className="p-3 w-8"></td>
          <td className="p-3 min-w-[200px]">
            <p className="font-medium">{item.item}</p>
          </td>
          <td className="p-3 text-right tabular-nums">{formatCurrency(item.underwriting_amount)}</td>
          <td className="p-3 text-right tabular-nums">{formatCurrency(item.forecast_amount)}</td>
          <td className="p-3 text-right tabular-nums">{formatCurrency(item.actual_amount ?? 0)}</td>
          <td className="p-3 w-28"></td>
          <td className="p-3 w-28"></td>
          <td className="p-3 w-32">
            <Badge variant="secondary">{item.status}</Badge>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function BudgetDetailTab({
  projectId,
  budgetItems,
  contingencyPercent,
}: BudgetDetailTabProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(BUDGET_CATEGORIES.map((c) => c.value))
  );
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [addingToCategory, setAddingToCategory] = useState<BudgetCategory | null>(null);
  const [commandPopupCategory, setCommandPopupCategory] = useState<BudgetCategory | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sensors for drag and drop
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
    const grouped: Record<string, BudgetItem[]> = {};
    for (const item of budgetItems) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    // Sort each category's items by sort_order
    for (const cat of Object.keys(grouped)) {
      grouped[cat].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
    return BUDGET_CATEGORIES.map((cat) => {
      const items = grouped[cat.value] || [];
      return {
        ...cat,
        items,
        underwriting: items.reduce((sum, item) => sum + (item.underwriting_amount || 0), 0),
        forecast: items.reduce((sum, item) => sum + (item.forecast_amount || 0), 0),
        actual: items.reduce((sum, item) => sum + (item.actual_amount || 0), 0),
      };
    });
  }, [budgetItems]);

  // Calculate totals
  const underwritingTotal = itemsByCategory.reduce((sum, cat) => sum + cat.underwriting, 0);
  const forecastTotal = itemsByCategory.reduce((sum, cat) => sum + cat.forecast, 0);
  const actualTotal = itemsByCategory.reduce((sum, cat) => sum + cat.actual, 0);

  const primaryBudget = forecastTotal > 0 ? forecastTotal : underwritingTotal;
  const contingencyAmount = primaryBudget * (contingencyPercent / 100);

  const forecastVariance = forecastTotal - underwritingTotal;
  const actualVariance = actualTotal - (forecastTotal > 0 ? forecastTotal : underwritingTotal);
  const totalVariance = actualTotal - underwritingTotal;

  const selectedCount = selectedItems.size;

  // Get the active item for drag overlay
  const activeItem = activeId ? budgetItems.find((i) => i.id === activeId) : null;

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

  const toggleAllInCategory = (categoryItems: BudgetItem[]) => {
    const categoryIds = categoryItems.map((i) => i.id);
    const allSelected = categoryIds.every((id) => selectedItems.has(id));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        categoryIds.forEach((id) => next.delete(id));
      } else {
        categoryIds.forEach((id) => next.add(id));
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
      toast.success('Updated');
    },
    onError: (error) => {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update');
    },
  });

  // Mutation for reordering items
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const supabase = getSupabaseClient();
      // Update all items in parallel
      const promises = updates.map(({ id, sort_order }) =>
        supabase.from('budget_items').update({ sort_order }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error('Failed to update some items');
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

  // Mutation for deleting budget items
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('budget_items').delete().in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success(`Deleted ${ids.length} item${ids.length > 1 ? 's' : ''}`);
      setSelectedItems(new Set());
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      console.error('Error deleting budget items:', error);
      toast.error('Failed to delete items');
    },
  });

  const handleCellSave = async (
    itemId: string,
    field: keyof BudgetItem,
    value: number | string
  ) => {
    await updateMutation.mutateAsync({ id: itemId, data: { [field]: value } });
  };

  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate(Array.from(selectedItems));
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find the category containing these items
    const activeItem = budgetItems.find((i) => i.id === active.id);
    const overItem = budgetItems.find((i) => i.id === over.id);

    if (!activeItem || !overItem) return;

    // Only allow reordering within the same category
    if (activeItem.category !== overItem.category) {
      toast.error('Cannot move items between categories');
      return;
    }

    // Get items in this category
    const categoryItems = itemsByCategory.find((c) => c.value === activeItem.category)?.items || [];
    const oldIndex = categoryItems.findIndex((i) => i.id === active.id);
    const newIndex = categoryItems.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder the items
    const newItems = arrayMove(categoryItems, oldIndex, newIndex);

    // Create update batch with new sort_order values
    const updates = newItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    reorderMutation.mutate(updates);
    toast.success('Reordered');
  };

  const getCommandOptions = (category: BudgetCategory): CommandOption[] => {
    const categoryItems = itemsByCategory.find((c) => c.value === category)?.items || [];
    const nextSortOrder = categoryItems.length > 0
      ? Math.max(...categoryItems.map((i) => i.sort_order || 0)) + 1
      : 0;

    const options: CommandOption[] = [
      {
        id: 'new-item',
        label: 'New blank item',
        icon: <IconFileText className="size-4" />,
        description: 'Add a new line item',
        shortcut: '↵',
        action: () => {
          setAddingToCategory(category);
          setCommandPopupCategory(null);
        },
      },
      {
        id: 'from-template',
        label: 'From template...',
        icon: <IconTemplate className="size-4" />,
        description: 'Choose from common items',
        disabled: true,
        action: () => {},
      },
      {
        id: 'from-cost-ref',
        label: 'From cost reference',
        icon: <IconCurrencyDollar className="size-4" />,
        description: 'Use Minneapolis metro pricing',
        disabled: true,
        action: () => {},
      },
    ];

    if (selectedCount > 0) {
      options.push({
        id: 'delete-selected',
        label: `Delete selected (${selectedCount})`,
        icon: <IconTrash className="size-4" />,
        destructive: true,
        action: handleDeleteSelected,
      });
    }

    return options;
  };

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IconAlertTriangle className="size-5 text-destructive" />
              Delete {selectedCount} item{selectedCount > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected budget items will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <IconLoader2 className="size-4 animate-spin mr-2" />
              ) : (
                <IconTrash className="size-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted">
        <div>
          <p className="text-sm text-muted-foreground">Underwriting</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(underwritingTotal)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Pre-deal estimate</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Forecast</p>
          <p className="text-xl font-semibold text-blue-600 tabular-nums">
            {formatCurrency(forecastTotal)}
          </p>
          <p
            className={cn(
              'text-xs mt-1 tabular-nums',
              forecastVariance >= 0 ? 'text-green-600' : 'text-red-600'
            )}
          >
            {forecastVariance >= 0 ? '+' : ''}
            {formatCurrency(forecastVariance)} vs UW
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Actual</p>
          <p className="text-xl font-semibold text-purple-600 tabular-nums">
            {formatCurrency(actualTotal)}
          </p>
          <p
            className={cn(
              'text-xs mt-1 tabular-nums',
              actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {actualVariance >= 0 ? '+' : ''}
            {formatCurrency(actualVariance)} vs Forecast
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Variance</p>
          <p
            className={cn(
              'text-xl font-semibold tabular-nums',
              totalVariance >= 0 ? 'text-red-600' : 'text-green-600'
            )}
          >
            {totalVariance >= 0 ? '+' : ''}
            {formatCurrency(totalVariance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Actual vs Underwriting</p>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <Checkbox
            checked={true}
            onCheckedChange={() => setSelectedItems(new Set())}
            className="data-[state=checked]:bg-primary"
          />
          <span className="text-sm font-medium">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteSelected}
            disabled={deleteMutation.isPending}
          >
            <IconTrash className="size-4 mr-1.5" />
            Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedItems(new Set())}
            className="ml-auto text-muted-foreground"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Budget Table with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header border-b">
                  <th className="text-left p-3 w-10 bg-muted">
                    <Checkbox
                      checked={
                        budgetItems.length > 0 &&
                        budgetItems.every((i) => selectedItems.has(i.id))
                          ? true
                          : budgetItems.some((i) => selectedItems.has(i.id))
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={() => {
                        const allSelected = budgetItems.every((i) => selectedItems.has(i.id));
                        if (allSelected) {
                          setSelectedItems(new Set());
                        } else {
                          setSelectedItems(new Set(budgetItems.map((i) => i.id)));
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-3 w-8 bg-muted"></th>
                  <th className="text-left p-3 min-w-[200px] bg-muted">Item</th>
                  <th className="text-right p-3 w-32 bg-blue-50 dark:bg-blue-950/30">
                    <div className="font-semibold">Underwriting</div>
                    <div className="text-xs font-normal text-muted-foreground">Pre-deal</div>
                  </th>
                  <th className="text-right p-3 w-32 bg-green-50 dark:bg-green-950/30">
                    <div className="font-semibold">Forecast</div>
                    <div className="text-xs font-normal text-muted-foreground">Post-bid</div>
                  </th>
                  <th className="text-right p-3 w-32 bg-purple-50 dark:bg-purple-950/30">
                    <div className="font-semibold">Actual</div>
                    <div className="text-xs font-normal text-muted-foreground">Real spend</div>
                  </th>
                  <th className="text-right p-3 w-28 bg-muted">Forecast Var</th>
                  <th className="text-right p-3 w-28 bg-muted">Actual Var</th>
                  <th className="text-center p-3 w-32 bg-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {itemsByCategory.map((category) => {
                  const isExpanded = expandedCategories.has(category.value);
                  const catForecastVar = category.forecast - category.underwriting;
                  const catActualVar =
                    category.actual -
                    (category.forecast > 0 ? category.forecast : category.underwriting);
                  const categoryItemIds = category.items.map((i) => i.id);
                  const allCategorySelected =
                    category.items.length > 0 &&
                    categoryItemIds.every((id) => selectedItems.has(id));
                  const someCategorySelected =
                    category.items.length > 0 &&
                    categoryItemIds.some((id) => selectedItems.has(id));

                  const nextSortOrder = category.items.length > 0
                    ? Math.max(...category.items.map((i) => i.sort_order || 0)) + 1
                    : 0;

                  return (
                    <Fragment key={category.value}>
                      {/* Category Header Row */}
                      <tr className="group category-header cursor-pointer bg-muted/50 hover:bg-muted transition-colors duration-150">
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={
                              allCategorySelected
                                ? true
                                : someCategorySelected
                                  ? 'indeterminate'
                                  : false
                            }
                            onCheckedChange={() => toggleAllInCategory(category.items)}
                            disabled={category.items.length === 0}
                          />
                        </td>
                        <td
                          className="p-3"
                          onClick={() => toggleCategory(category.value)}
                        >
                          {isExpanded ? (
                            <IconChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td
                          className="p-3 font-medium"
                          onClick={() => toggleCategory(category.value)}
                        >
                          {category.label}
                          <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                            ({category.items.length})
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium bg-blue-50/50 dark:bg-blue-950/20 tabular-nums">
                          {formatCurrency(category.underwriting)}
                        </td>
                        <td className="p-3 text-right font-medium bg-green-50/50 dark:bg-green-950/20 tabular-nums">
                          {formatCurrency(category.forecast)}
                        </td>
                        <td className="p-3 text-right font-medium bg-purple-50/50 dark:bg-purple-950/20 tabular-nums">
                          {formatCurrency(category.actual)}
                        </td>
                        <td
                          className={cn(
                            'p-3 text-right font-medium tabular-nums',
                            catForecastVar >= 0 ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {catForecastVar >= 0 ? '+' : ''}
                          {formatCurrency(catForecastVar)}
                        </td>
                        <td
                          className={cn(
                            'p-3 text-right font-medium tabular-nums',
                            catActualVar >= 0 ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {catActualVar >= 0 ? '+' : ''}
                          {formatCurrency(catActualVar)}
                        </td>
                        <td></td>
                      </tr>

                      {/* Sortable Item Rows */}
                      {isExpanded && category.items.length > 0 && (
                        <SortableContext
                          items={category.items.map((i) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {category.items.map((item) => (
                            <SortableRow
                              key={item.id}
                              item={item}
                              isSelected={selectedItems.has(item.id)}
                              isDragging={activeId === item.id}
                              onToggleSelection={toggleItemSelection}
                              onCellSave={handleCellSave}
                            />
                          ))}
                        </SortableContext>
                      )}

                      {/* Add Item Row (when adding) */}
                      {isExpanded && addingToCategory === category.value && (
                        <AddItemRow
                          category={category.value}
                          projectId={projectId}
                          onSave={() => setAddingToCategory(null)}
                          onCancel={() => setAddingToCategory(null)}
                          nextSortOrder={nextSortOrder}
                        />
                      )}

                      {/* Add Item Button Row */}
                      {isExpanded && addingToCategory !== category.value && (
                        <tr className="group/add">
                          <td colSpan={9} className="p-1.5">
                            <CommandPopup
                              open={commandPopupCategory === category.value}
                              onOpenChange={(open) =>
                                setCommandPopupCategory(open ? category.value : null)
                              }
                              options={getCommandOptions(category.value)}
                              trigger={
                                <button
                                  type="button"
                                  className={cn(
                                    'flex items-center gap-2 w-full px-3 py-2 text-sm',
                                    'text-muted-foreground/60 hover:text-muted-foreground',
                                    'rounded-md hover:bg-muted transition-all duration-150',
                                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                                    'opacity-0 group-hover/add:opacity-100 focus:opacity-100'
                                  )}
                                >
                                  <IconPlus className="size-4" />
                                  <span>Add item...</span>
                                  <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded opacity-50">
                                    /
                                  </kbd>
                                </button>
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}

                {/* Contingency Row */}
                <tr className="border-t-2 bg-muted/50">
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3 font-medium">
                    Contingency ({contingencyPercent}%)
                  </td>
                  <td colSpan={2}></td>
                  <td className="p-3 text-right font-medium tabular-nums">
                    {formatCurrency(contingencyAmount)}
                  </td>
                  <td colSpan={3}></td>
                </tr>

                {/* Grand Total Row */}
                <tr className="border-t-2 bg-primary/10">
                  <td className="p-3"></td>
                  <td className="p-3"></td>
                  <td className="p-3 font-semibold text-primary">GRAND TOTAL</td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {formatCurrency(underwritingTotal)}
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {formatCurrency(forecastTotal)}
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {formatCurrency(actualTotal)}
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right font-semibold tabular-nums',
                      forecastVariance >= 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {forecastVariance >= 0 ? '+' : ''}
                    {formatCurrency(forecastVariance)}
                  </td>
                  <td
                    className={cn(
                      'p-3 text-right font-semibold tabular-nums',
                      actualVariance >= 0 ? 'text-red-600' : 'text-green-600'
                    )}
                  >
                    {actualVariance >= 0 ? '+' : ''}
                    {formatCurrency(actualVariance)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem ? <DragOverlayRow item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/50"></div>
          <span>Underwriting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/50"></div>
          <span>Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-100 dark:bg-purple-900/50"></div>
          <span>Actual</span>
        </div>
        <div className="flex items-center gap-4 ml-auto text-muted-foreground/60">
          <span>Drag to reorder</span>
          <span>Click to edit</span>
          <span className="flex items-center gap-1">
            <kbd className="bg-muted px-1.5 py-0.5 rounded text-[10px]">/</kbd>
            <span>to add</span>
          </span>
        </div>
      </div>
    </div>
  );
}
