'use client';

import * as React from 'react';
import Link from 'next/link';
import type { BudgetTemplateSummary, BudgetCategory } from '@/types';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IconLoader2, IconEye, IconAlertTriangle } from '@tabler/icons-react';
import { useBudgetTemplates, useApplyTemplate } from '@/hooks';

interface ApplyTemplateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingItemCount: number;
  selectedTemplateId?: string;
}

// Category labels lookup
const CATEGORY_LABELS = BUDGET_CATEGORIES.reduce(
  (acc, cat) => ({ ...acc, [cat.value]: cat.label }),
  {} as Record<BudgetCategory, string>
);

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function ApplyTemplateSheet({
  open,
  onOpenChange,
  projectId,
  existingItemCount,
  selectedTemplateId,
}: ApplyTemplateSheetProps) {
  const { data: templates, isLoading: templatesLoading } = useBudgetTemplates();
  const applyTemplate = useApplyTemplate();

  // Form state
  const [templateId, setTemplateId] = React.useState<string>('');
  const [includeAmounts, setIncludeAmounts] = React.useState(true);
  const [conflictResolution, setConflictResolution] = React.useState<'skip' | 'merge' | 'replace'>(
    'merge'
  );

  // Selected template
  const selectedTemplate = React.useMemo(() => {
    return templates?.find((t) => t.id === templateId);
  }, [templates, templateId]);

  // Reset form when sheet opens
  React.useEffect(() => {
    if (open) {
      setTemplateId(selectedTemplateId || '');
      setIncludeAmounts(true);
      setConflictResolution('merge');
    }
  }, [open, selectedTemplateId]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;

    applyTemplate.mutate(
      {
        templateId,
        projectId,
        includeAmounts,
        conflictResolution,
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
          <SheetTitle>Apply Template</SheetTitle>
          <SheetDescription>
            Add budget items from a template to this project
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder={templatesLoading ? 'Loading...' : 'Choose a template...'} />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex flex-col">
                      <span>{template.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.item_count} items
                        {template.total_estimate > 0 &&
                          ` · ${formatCurrency(template.total_estimate)}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{selectedTemplate.name}</h4>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/templates/${selectedTemplate.id}`} target="_blank">
                    <IconEye className="h-4 w-4 mr-1" />
                    Preview
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {selectedTemplate.scope_level && (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                    {SCOPE_LEVEL_LABELS[selectedTemplate.scope_level]}
                  </span>
                )}
                <span>
                  {selectedTemplate.item_count} items · {selectedTemplate.category_count} categories
                </span>
              </div>

              {selectedTemplate.total_estimate > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Estimated total: </span>
                  <span className="font-medium">{formatCurrency(selectedTemplate.total_estimate)}</span>
                </div>
              )}

              {/* Category pills */}
              {selectedTemplate.categories && selectedTemplate.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.categories.slice(0, 6).map((category) => (
                    <span
                      key={category}
                      className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                    >
                      {CATEGORY_LABELS[category]}
                    </span>
                  ))}
                  {selectedTemplate.categories.length > 6 && (
                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                      +{selectedTemplate.categories.length - 6} more
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conflict Resolution */}
          {existingItemCount > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                <Label>Conflict Resolution</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                This project already has {existingItemCount} budget items. How should we handle
                items that exist in both?
              </p>

              <RadioGroup
                value={conflictResolution}
                onValueChange={(v) => setConflictResolution(v as 'skip' | 'merge' | 'replace')}
                className="space-y-2"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50">
                  <RadioGroupItem value="skip" id="skip" className="mt-0.5" />
                  <div>
                    <Label htmlFor="skip" className="cursor-pointer font-medium">
                      Skip duplicates
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Keep existing items, only add new ones from the template
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 border-primary/50 bg-primary/5">
                  <RadioGroupItem value="merge" id="merge" className="mt-0.5" />
                  <div>
                    <Label htmlFor="merge" className="cursor-pointer font-medium">
                      Merge (recommended)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Add new items, update amounts for existing matches if including amounts
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 border-destructive/30">
                  <RadioGroupItem value="replace" id="replace" className="mt-0.5" />
                  <div>
                    <Label htmlFor="replace" className="cursor-pointer font-medium text-destructive">
                      Replace all
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Delete all existing items and replace with template items
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}

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
                  Copy template&apos;s default amounts to underwriting column
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={applyTemplate.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={applyTemplate.isPending || !templateId}>
              {applyTemplate.isPending ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Template'
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
