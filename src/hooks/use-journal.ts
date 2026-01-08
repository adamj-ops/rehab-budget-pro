'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { JournalPage, JournalPageWithProject, JournalPageInput, JournalPageType } from '@/types';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const journalKeys = {
  all: ['journal'] as const,
  lists: () => [...journalKeys.all, 'list'] as const,
  list: (filters: JournalFilters) => [...journalKeys.lists(), filters] as const,
  details: () => [...journalKeys.all, 'detail'] as const,
  detail: (id: string) => [...journalKeys.details(), id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface JournalFilters {
  projectId?: string | null; // null = general only, undefined = all
  pageType?: JournalPageType;
  search?: string;
  includeArchived?: boolean;
  pinnedOnly?: boolean;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all journal pages with optional filters
 */
export function useJournalPages(filters: JournalFilters = {}) {
  return useQuery({
    queryKey: journalKeys.list(filters),
    queryFn: async (): Promise<JournalPageWithProject[]> => {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('journal_pages')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      // Filter by project
      if (filters.projectId !== undefined) {
        if (filters.projectId === null) {
          // General notes only
          query = query.is('project_id', null);
        } else {
          // Specific project
          query = query.eq('project_id', filters.projectId);
        }
      }

      // Filter by page type
      if (filters.pageType) {
        query = query.eq('page_type', filters.pageType);
      }

      // Filter archived
      if (!filters.includeArchived) {
        query = query.eq('is_archived', false);
      }

      // Filter pinned only
      if (filters.pinnedOnly) {
        query = query.eq('is_pinned', true);
      }

      // Search in title and content
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as JournalPageWithProject[];
    },
  });
}

/**
 * Fetch a single journal page by ID
 */
export function useJournalPage(id: string | null) {
  return useQuery({
    queryKey: journalKeys.detail(id || ''),
    queryFn: async (): Promise<JournalPageWithProject | null> => {
      if (!id) return null;
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('journal_pages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as JournalPageWithProject;
    },
    enabled: !!id,
  });
}

/**
 * Create a new journal page
 */
export function useCreateJournalPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<JournalPageInput>): Promise<JournalPage> => {
      const supabase = getSupabaseClient();
      
      const pageData = {
        title: input.title || 'Untitled',
        content: input.content || '',
        icon: input.icon || '📝',
        page_type: input.page_type || 'note',
        project_id: input.project_id || null,
        is_pinned: input.is_pinned || false,
        is_archived: false,
      };

      const { data, error } = await supabase
        .from('journal_pages')
        .insert(pageData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      toast.success('Page created');
    },
    onError: (error) => {
      toast.error('Failed to create page', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update a journal page
 */
export function useUpdateJournalPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JournalPage> & { id: string }): Promise<JournalPage> => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('journal_pages')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(data.id) });
    },
    onError: (error) => {
      toast.error('Failed to update page', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Delete a journal page
 */
export function useDeleteJournalPage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('journal_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      toast.success('Page deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete page', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Toggle pin status of a journal page
 */
export function useToggleJournalPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }): Promise<JournalPage> => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('journal_pages')
        .update({ is_pinned, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(data.id) });
      toast.success(data.is_pinned ? 'Page pinned' : 'Page unpinned');
    },
  });
}

/**
 * Archive/unarchive a journal page
 */
export function useToggleJournalArchive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_archived }: { id: string; is_archived: boolean }): Promise<JournalPage> => {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('journal_pages')
        .update({ is_archived, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(data.id) });
      toast.success(data.is_archived ? 'Page archived' : 'Page restored');
    },
  });
}
