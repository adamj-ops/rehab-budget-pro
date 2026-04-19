'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  IconStar,
  IconStarFilled,
  IconLock,
  IconDotsVertical,
  IconEye,
  IconCopy,
  IconTrash,
  IconPencil,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { BudgetTemplateSummary, BudgetCategory } from '@/types';
import { SCOPE_LEVEL_LABELS, BUDGET_CATEGORIES } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToggleTemplateFavorite, useDeleteTemplate, useDuplicateTemplate } from '@/hooks';
import { useState } from 'react';
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

// Create a map for quick category label lookup
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<BudgetCategory, string>
);

interface TemplateCardProps {
  template: BudgetTemplateSummary;
  onApply?: (templateId: string) => void;
  onEdit?: (template: BudgetTemplateSummary) => void;
  className?: string;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get category bar colors
const getCategoryColor = (category: BudgetCategory) => {
  const colors: Record<BudgetCategory, string> = {
    soft_costs: 'bg-blue-400',
    demo: 'bg-red-500',
    structural: 'bg-orange-500',
    plumbing: 'bg-blue-500',
    hvac: 'bg-cyan-500',
    electrical: 'bg-yellow-500',
    insulation_drywall: 'bg-pink-500',
    interior_paint: 'bg-purple-500',
    flooring: 'bg-teal-500',
    tile: 'bg-emerald-500',
    kitchen: 'bg-rose-500',
    bathrooms: 'bg-violet-500',
    doors_windows: 'bg-amber-500',
    interior_trim: 'bg-lime-500',
    exterior: 'bg-indigo-500',
    landscaping: 'bg-green-600',
    finishing: 'bg-fuchsia-500',
    contingency: 'bg-red-400',
  };
  return colors[category] || 'bg-muted';
};

export function TemplateCard({ template, onApply, onEdit, className }: TemplateCardProps) {
  const toggleFavorite = useToggleTemplateFavorite();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isSystem = template.template_type === 'system';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ id: template.id, is_favorite: !template.is_favorite });
  };

  const handleDuplicate = () => {
    duplicateTemplate.mutate(template.id);
  };

  const handleDelete = () => {
    deleteTemplate.mutate(template.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div
        className={cn(
          'rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30',
          template.is_favorite && 'border-primary/40',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Title with icon */}
            <div className="flex items-center gap-2 mb-1">
              {isSystem && <IconLock className="h-4 w-4 text-muted-foreground" />}
              <h3 className="font-medium truncate">{template.name}</h3>
            </div>

            {/* Classification tags */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mb-2">
              {template.scope_level && (
                <span className="px-2 py-0.5 rounded-full bg-muted">
                  {SCOPE_LEVEL_LABELS[template.scope_level]}
                </span>
              )}
              {template.property_type && (
                <span className="px-2 py-0.5 rounded-full bg-muted capitalize">
                  {template.property_type === 'sfh' ? 'Single Family' : template.property_type}
                </span>
              )}
            </div>

            {/* Description */}
            {template.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {template.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span>
                {template.item_count} items across {template.category_count} categories
              </span>
              {template.total_estimate > 0 && (
                <>
                  <span>·</span>
                  <span>~{formatCurrency(template.total_estimate)} estimate</span>
                </>
              )}
            </div>

            {/* Usage stats */}
            {!isSystem && template.times_used > 0 && (
              <div className="text-xs text-muted-foreground mb-3">
                Used {template.times_used} time{template.times_used !== 1 && 's'}
                {template.updated_at && (
                  <>
                    {' · '}
                    Last updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                  </>
                )}
              </div>
            )}

            {/* Category bar */}
            {template.categories && template.categories.length > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {template.categories.slice(0, 8).map((category) => (
                  <div
                    key={category}
                    className={cn('flex-1', getCategoryColor(category))}
                    title={CATEGORY_LABELS[category]}
                  />
                ))}
                {template.categories.length > 8 && (
                  <div className="flex-1 bg-muted" title={`+${template.categories.length - 8} more`} />
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/templates/${template.id}`}>
                  <IconEye className="h-4 w-4 mr-1.5" />
                  Preview
                </Link>
              </Button>
              {onApply && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onApply(template.id);
                  }}
                >
                  Apply to Project
                </Button>
              )}
              {isSystem && (
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <IconCopy className="h-4 w-4 mr-1.5" />
                  Copy to My Templates
                </Button>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="flex items-center gap-1">
            {/* Favorite button */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                template.is_favorite
                  ? 'text-yellow-500 hover:bg-yellow-500/10'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-label={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {template.is_favorite ? (
                <IconStarFilled className="h-4 w-4" />
              ) : (
                <IconStar className="h-4 w-4" />
              )}
            </button>

            {/* Menu */}
            {!isSystem && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Template options"
                  >
                    <IconDotsVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <IconPencil className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <IconCopy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{template.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Skeleton loader for the card
export function TemplateCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-48 rounded bg-muted" />
          </div>
          <div className="flex gap-2 mb-2">
            <div className="h-5 w-20 rounded-full bg-muted" />
            <div className="h-5 w-24 rounded-full bg-muted" />
          </div>
          <div className="space-y-1.5 mb-3">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
          <div className="h-3 w-48 rounded bg-muted mb-3" />
          <div className="h-2 w-full rounded-full bg-muted mb-4" />
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded bg-muted" />
            <div className="h-8 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded bg-muted" />
          <div className="h-8 w-8 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
