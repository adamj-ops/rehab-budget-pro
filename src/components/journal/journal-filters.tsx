'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { JournalPageType, Project } from '@/types';
import { JOURNAL_PAGE_TYPE_CONFIG, JOURNAL_PAGE_TYPES } from '@/types';
import type { JournalFilters } from '@/hooks/use-journal';
import { cn } from '@/lib/utils';

interface JournalFiltersBarProps {
  filters: JournalFilters;
  onFiltersChange: (filters: JournalFilters) => void;
  className?: string;
}

type ProjectFilter = 'all' | 'general' | string;

export function JournalFiltersBar({
  filters,
  onFiltersChange,
  className,
}: JournalFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Fetch projects for the filter dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name')
        .order('project_name');
      if (error) throw error;
      return data as { id: string; project_name: string }[];
    },
  });

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onFiltersChange({ ...filters, search: searchInput || undefined });
    },
    [filters, onFiltersChange, searchInput]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput('');
    onFiltersChange({ ...filters, search: undefined });
  }, [filters, onFiltersChange]);

  const handleProjectChange = useCallback(
    (value: ProjectFilter) => {
      let projectId: string | null | undefined;
      if (value === 'all') {
        projectId = undefined; // Show all
      } else if (value === 'general') {
        projectId = null; // General only
      } else {
        projectId = value; // Specific project
      }
      onFiltersChange({ ...filters, projectId });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        pageType: value === 'all' ? undefined : (value as JournalPageType),
      });
    },
    [filters, onFiltersChange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.projectId !== undefined ||
    filters.pageType !== undefined;

  // Determine current project filter value
  const projectFilterValue: ProjectFilter =
    filters.projectId === undefined
      ? 'all'
      : filters.projectId === null
        ? 'general'
        : filters.projectId;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search pages..."
          value={searchInput}
          onChange={handleSearchChange}
          className="pl-9 pr-9"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleSearchClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <IconX className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Project filter */}
        <Select value={projectFilterValue} onValueChange={handleProjectChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectItem value="general">General (no project)</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.project_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select
          value={filters.pageType || 'all'}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {JOURNAL_PAGE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <span>{JOURNAL_PAGE_TYPE_CONFIG[type].icon}</span>
                  <span>{JOURNAL_PAGE_TYPE_CONFIG[type].label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
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
