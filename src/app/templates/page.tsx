'use client';

import { useState, useMemo } from 'react';
import { IconTemplate, IconPlus, IconStarFilled } from '@tabler/icons-react';
import { useBudgetTemplates, type TemplateFilters } from '@/hooks/use-budget-templates';
import { TemplateCard, TemplateCardSkeleton, TemplateFiltersBar } from '@/components/templates';
import { Button } from '@/components/ui/button';
import type { BudgetTemplateSummary } from '@/types';

export default function TemplatesPage() {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const { data: templates, isLoading, error } = useBudgetTemplates(filters);

  // Separate user and system templates
  const { userTemplates, systemTemplates, favoriteTemplates } = useMemo(() => {
    if (!templates) return { userTemplates: [], systemTemplates: [], favoriteTemplates: [] };

    const user: BudgetTemplateSummary[] = [];
    const system: BudgetTemplateSummary[] = [];
    const favorites: BudgetTemplateSummary[] = [];

    for (const template of templates) {
      if (template.is_favorite) {
        favorites.push(template);
      }
      if (template.template_type === 'system') {
        system.push(template);
      } else {
        user.push(template);
      }
    }

    return { userTemplates: user, systemTemplates: system, favoriteTemplates: favorites };
  }, [templates]);

  // Handler for applying template (to be implemented)
  const handleApplyTemplate = (templateId: string) => {
    // TODO: Open apply template sheet with project selection
    console.log('Apply template:', templateId);
  };

  // Handler for editing template (to be implemented)
  const handleEditTemplate = (template: BudgetTemplateSummary) => {
    // TODO: Open edit template sheet
    console.log('Edit template:', template);
  };

  if (error) {
    return (
      <div className="page-shell py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load templates</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <div className="page-stack max-w-5xl">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-title">
            <IconTemplate className="h-8 w-8 text-primary" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Budget Templates</h1>
              <p className="text-sm text-muted-foreground">
                Save and reuse budget structures across projects
              </p>
            </div>
          </div>
          <Button disabled>
            <IconPlus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <TemplateFiltersBar filters={filters} onFiltersChange={setFilters} />

        {/* Loading state */}
        {isLoading && (
          <div className="section-stack">
            <TemplateCardSkeleton />
            <TemplateCardSkeleton />
            <TemplateCardSkeleton />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && templates?.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <IconTemplate className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.type || filters.scopeLevel || filters.propertyType || filters.favoritesOnly
                ? 'No templates match your filters'
                : 'Create your first template by saving a project budget'}
            </p>
          </div>
        )}

        {/* Templates list */}
        {!isLoading && templates && templates.length > 0 && (
          <div className="page-stack">
            {/* Favorites section (if not filtering by favorites already) */}
            {!filters.favoritesOnly && favoriteTemplates.length > 0 && (
              <section className="section-stack">
                <div className="flex items-center gap-2">
                  <IconStarFilled className="h-4 w-4 text-yellow-500" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Favorites
                  </h2>
                </div>
                <div className="grid gap-4">
                  {favoriteTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onApply={handleApplyTemplate}
                      onEdit={handleEditTemplate}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* User templates section */}
            {userTemplates.length > 0 && (
              <section className="section-stack">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  My Templates
                </h2>
                <div className="grid gap-4">
                  {userTemplates
                    .filter((t) => !t.is_favorite || filters.favoritesOnly)
                    .map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onApply={handleApplyTemplate}
                        onEdit={handleEditTemplate}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* System templates section */}
            {systemTemplates.length > 0 && (
              <section className="section-stack">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  System Templates
                </h2>
                <p className="text-xs text-muted-foreground -mt-2">
                  Pre-built templates for common rehab scenarios. Copy to your templates to customize.
                </p>
                <div className="grid gap-4">
                  {systemTemplates
                    .filter((t) => !t.is_favorite || filters.favoritesOnly)
                    .map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onApply={handleApplyTemplate}
                      />
                    ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
