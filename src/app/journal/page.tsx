'use client';

import { useState, useMemo } from 'react';
import { IconNotebook, IconPinFilled } from '@tabler/icons-react';
import { useJournalPages, type JournalFilters } from '@/hooks/use-journal';
import {
  JournalPageCard,
  JournalPageCardSkeleton,
  JournalFiltersBar,
  NewPageButton,
} from '@/components/journal';
import type { JournalPageWithProject } from '@/types';

export default function JournalPage() {
  const [filters, setFilters] = useState<JournalFilters>({});
  
  const { data: pages, isLoading, error } = useJournalPages(filters);

  // Separate pinned and unpinned pages
  const { pinnedPages, recentPages } = useMemo(() => {
    if (!pages) return { pinnedPages: [], recentPages: [] };
    
    const pinned: JournalPageWithProject[] = [];
    const recent: JournalPageWithProject[] = [];
    
    for (const page of pages) {
      if (page.is_pinned) {
        pinned.push(page);
      } else {
        recent.push(page);
      }
    }
    
    return { pinnedPages: pinned, recentPages: recent };
  }, [pages]);

  // Group recent pages by relative date
  const groupedRecentPages = useMemo(() => {
    const groups: { label: string; pages: JournalPageWithProject[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const todayPages: JournalPageWithProject[] = [];
    const yesterdayPages: JournalPageWithProject[] = [];
    const lastWeekPages: JournalPageWithProject[] = [];
    const olderPages: JournalPageWithProject[] = [];

    for (const page of recentPages) {
      const updatedAt = new Date(page.updated_at);
      if (updatedAt >= today) {
        todayPages.push(page);
      } else if (updatedAt >= yesterday) {
        yesterdayPages.push(page);
      } else if (updatedAt >= lastWeek) {
        lastWeekPages.push(page);
      } else {
        olderPages.push(page);
      }
    }

    if (todayPages.length > 0) groups.push({ label: 'Today', pages: todayPages });
    if (yesterdayPages.length > 0) groups.push({ label: 'Yesterday', pages: yesterdayPages });
    if (lastWeekPages.length > 0) groups.push({ label: 'Last 7 days', pages: lastWeekPages });
    if (olderPages.length > 0) groups.push({ label: 'Older', pages: olderPages });

    return groups;
  }, [recentPages]);

  if (error) {
    return (
      <div className="page-shell py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load journal pages</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8">
      <div className="page-stack max-w-4xl">
        <div className="page-header">
          <div className="page-header-title">
            <IconNotebook className="h-8 w-8 text-primary" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Journal</h1>
              <p className="text-sm text-muted-foreground">
                Your notes, ideas, and project documentation
              </p>
            </div>
          </div>
          <NewPageButton />
        </div>

        <JournalFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
        />

        {isLoading && (
          <div className="section-stack">
            <JournalPageCardSkeleton />
            <JournalPageCardSkeleton />
            <JournalPageCardSkeleton />
          </div>
        )}

        {!isLoading && pages?.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <IconNotebook className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No pages yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.projectId !== undefined || filters.pageType
                ? 'No pages match your filters'
                : 'Create your first journal page to get started'}
            </p>
            {!filters.search && filters.projectId === undefined && !filters.pageType && (
              <NewPageButton variant="outline" />
            )}
          </div>
        )}

        {!isLoading && pages && pages.length > 0 && (
          <div className="page-stack">
            {pinnedPages.length > 0 && (
              <section className="section-stack">
                <div className="flex items-center gap-2">
                  <IconPinFilled className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Pinned
                  </h2>
                </div>
                <div className="grid gap-4">
                  {pinnedPages.map((page) => (
                    <JournalPageCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            )}

            {groupedRecentPages.map((group) => (
              <section key={group.label} className="section-stack">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </h2>
                <div className="grid gap-4">
                  {group.pages.map((page) => (
                    <JournalPageCard key={page.id} page={page} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
