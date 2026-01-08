'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconTemplate,
  IconStar,
  IconStarFilled,
  IconLock,
  IconCopy,
} from '@tabler/icons-react';
import { useBudgetTemplate, useToggleTemplateFavorite, useDuplicateTemplate } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SCOPE_LEVEL_LABELS,
  SCOPE_LEVEL_DESCRIPTIONS,
  BUDGET_CATEGORIES,
  UNIT_LABELS,
} from '@/types';
import type { BudgetCategory, BudgetTemplateItem } from '@/types';

// Create a map for quick category label lookup
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<BudgetCategory, string>
);

interface TemplateDetailPageProps {
  params: Promise<{ id: string }>;
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

export default function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const { id } = use(params);
  const { data: template, isLoading, error } = useBudgetTemplate(id);
  const toggleFavorite = useToggleTemplateFavorite();
  const duplicateTemplate = useDuplicateTemplate();

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!template?.items) return new Map<BudgetCategory, BudgetTemplateItem[]>();

    const grouped = new Map<BudgetCategory, BudgetTemplateItem[]>();
    for (const item of template.items) {
      const existing = grouped.get(item.category) || [];
      existing.push(item);
      grouped.set(item.category, existing);
    }
    return grouped;
  }, [template?.items]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const totals = new Map<BudgetCategory, number>();
    itemsByCategory.forEach((items, category) => {
      totals.set(
        category,
        items.reduce((sum, item) => sum + (item.default_amount || 0), 0)
      );
    });
    return totals;
  }, [itemsByCategory]);

  // Total estimate
  const totalEstimate = useMemo(() => {
    let total = 0;
    categoryTotals.forEach((amount) => {
      total += amount;
    });
    return total;
  }, [categoryTotals]);

  const isSystem = template?.template_type === 'system';

  if (error) {
    return (
      <div className="page-shell py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load template</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/templates">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-shell py-8">
        <div className="page-stack max-w-5xl">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4 mt-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="page-shell py-8">
        <div className="text-center py-12">
          <IconTemplate className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Template not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This template may have been deleted or you don&apos;t have access to it.
          </p>
          <Button asChild variant="outline">
            <Link href="/templates">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <div className="page-stack max-w-5xl">
        {/* Back link */}
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/templates">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isSystem && <IconLock className="h-5 w-5 text-muted-foreground" />}
              <h1 className="text-2xl font-bold">{template.name}</h1>
            </div>

            {/* Classification tags */}
            <div className="flex items-center gap-2 flex-wrap text-sm mb-3">
              {template.scope_level && (
                <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  {SCOPE_LEVEL_LABELS[template.scope_level]}
                </span>
              )}
              {template.property_type && (
                <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                  {template.property_type === 'sfh' ? 'Single Family' : template.property_type}
                </span>
              )}
              <span className="text-muted-foreground">
                {template.items.length} items
              </span>
            </div>

            {/* Description */}
            {template.description && (
              <p className="text-muted-foreground mb-4">{template.description}</p>
            )}

            {/* Scope description */}
            {template.scope_level && (
              <p className="text-sm text-muted-foreground">
                {SCOPE_LEVEL_DESCRIPTIONS[template.scope_level]}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                toggleFavorite.mutate({ id: template.id, is_favorite: !template.is_favorite })
              }
              className={template.is_favorite ? 'text-yellow-500' : ''}
            >
              {template.is_favorite ? (
                <IconStarFilled className="h-5 w-5" />
              ) : (
                <IconStar className="h-5 w-5" />
              )}
            </Button>

            {isSystem && (
              <Button variant="outline" onClick={() => duplicateTemplate.mutate(template.id)}>
                <IconCopy className="h-4 w-4 mr-2" />
                Copy to My Templates
              </Button>
            )}

            <Button>Apply to Project</Button>
          </div>
        </div>

        {/* Total estimate card */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Estimate</p>
              <p className="text-3xl font-bold">{formatCurrency(totalEstimate)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{itemsByCategory.size} categories</p>
              <p className="text-sm text-muted-foreground">{template.items.length} line items</p>
            </div>
          </div>
        </div>

        {/* Items by category */}
        <div className="space-y-6">
          {Array.from(itemsByCategory.entries()).map(([category, items]) => (
            <div key={category} className="rounded-lg border bg-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
                <h3 className="font-medium">{CATEGORY_LABELS[category]}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">{items.length} items</span>
                  <span className="font-medium">{formatCurrency(categoryTotals.get(category) || 0)}</span>
                </div>
              </div>

              {/* Items table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-right p-3 font-medium w-20">Qty</th>
                      <th className="text-left p-3 font-medium w-20">Unit</th>
                      <th className="text-right p-3 font-medium w-24">Rate</th>
                      <th className="text-right p-3 font-medium w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.item}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {item.qty || '-'}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {item.unit ? UNIT_LABELS[item.unit] : '-'}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {item.rate ? formatCurrency(item.rate) : '-'}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {item.default_amount ? formatCurrency(item.default_amount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
