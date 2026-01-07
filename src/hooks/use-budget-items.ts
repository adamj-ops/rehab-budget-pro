'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useProjectRealtime } from '@/hooks/use-realtime';
import type { BudgetItem, BudgetCategory, UnitType, CostType, ItemStatus } from '@/types';

// Query keys
export const budgetItemKeys = {
  all: ['budgetItems'] as const,
  lists: () => [...budgetItemKeys.all, 'list'] as const,
  byProject: (projectId: string) => [...budgetItemKeys.lists(), { projectId }] as const,
  details: () => [...budgetItemKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetItemKeys.details(), id] as const,
};

// Fetch budget items for a project with real-time updates
export function useBudgetItems(projectId: string) {
  // Enable real-time subscription for this project
  useProjectRealtime(projectId, !!projectId);

  return useQuery({
    queryKey: budgetItemKeys.byProject(projectId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');

      if (error) throw error;
      return data as BudgetItem[];
    },
    enabled: !!projectId,
  });
}

// Create budget item input type
interface CreateBudgetItemInput {
  project_id: string;
  vendor_id?: string | null;
  category: BudgetCategory;
  item: string;
  description?: string | null;
  room_area?: string | null;
  qty?: number;
  unit?: UnitType;
  rate?: number;
  underwriting_amount?: number;
  forecast_amount?: number;
  actual_amount?: number | null;
  cost_type?: CostType;
  status?: ItemStatus;
  priority?: 'high' | 'medium' | 'low';
  sort_order?: number;
  notes?: string | null;
}

// Create budget item mutation
export function useCreateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetItemInput) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .insert({
          ...input,
          qty: input.qty ?? 1,
          unit: input.unit ?? 'ea',
          rate: input.rate ?? 0,
          underwriting_amount: input.underwriting_amount ?? 0,
          forecast_amount: input.forecast_amount ?? 0,
          cost_type: input.cost_type ?? 'both',
          status: input.status ?? 'not_started',
          priority: input.priority ?? 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BudgetItem;
    },
    onSuccess: (data) => {
      // Invalidate budget items and project summary (totals changed)
      queryClient.invalidateQueries({ queryKey: budgetItemKeys.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
    },
  });
}

// Update budget item mutation
export function useUpdateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<CreateBudgetItemInput, 'project_id'>> & { id: string; project_id: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BudgetItem;
    },
    onSuccess: (data) => {
      // Invalidate budget items and project summary (totals may have changed)
      queryClient.invalidateQueries({ queryKey: budgetItemKeys.byProject(data.project_id) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
    },
  });
}

// Delete budget item mutation
export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('budget_items').delete().eq('id', id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: ({ projectId }) => {
      // Invalidate budget items and project summary (totals changed)
      queryClient.invalidateQueries({ queryKey: budgetItemKeys.byProject(projectId) });
      queryClient.invalidateQueries({ queryKey: ['projects', 'summary', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// Batch update budget items (for reordering)
export function useBatchUpdateBudgetItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: Array<{ id: string; sort_order: number }>;
    }) => {
      const supabase = getSupabaseClient();

      // Use a transaction-like approach with Promise.all
      const promises = updates.map(({ id, sort_order }) =>
        supabase.from('budget_items').update({ sort_order }).eq('id', id)
      );

      const results = await Promise.all(promises);

      // Check for any errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      return { projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: budgetItemKeys.byProject(projectId) });
    },
  });
}
