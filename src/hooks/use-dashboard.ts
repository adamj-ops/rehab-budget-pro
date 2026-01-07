'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ProjectSummary, ProjectStatus } from '@/types';
import type {
  PortfolioSummary,
  CategoryTotal,
  ProjectWithRisks,
} from '@/types/dashboard';
import { toast } from 'sonner';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  portfolio: () => [...dashboardKeys.all, 'portfolio'] as const,
  categories: () => [...dashboardKeys.all, 'categories'] as const,
  riskyProjects: () => [...dashboardKeys.all, 'risky-projects'] as const,
  projectsByStatus: () => [...dashboardKeys.all, 'by-status'] as const,
  timeline: () => [...dashboardKeys.all, 'timeline'] as const,
};

// ============================================================================
// PORTFOLIO SUMMARY
// ============================================================================

/**
 * Hook for portfolio-level summary metrics
 * Returns aggregated stats across all projects
 */
export function usePortfolioSummary() {
  return useQuery({
    queryKey: dashboardKeys.portfolio(),
    queryFn: async (): Promise<PortfolioSummary | null> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('portfolio_summary')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// CATEGORY TOTALS
// ============================================================================

/**
 * Hook for category breakdown across portfolio
 * Returns budget/actual/variance by category
 */
export function useCategoryTotals() {
  return useQuery({
    queryKey: dashboardKeys.categories(),
    queryFn: async (): Promise<CategoryTotal[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('category_totals')
        .select('*')
        .order('total_actual', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// RISKY PROJECTS
// ============================================================================

/**
 * Hook for projects needing attention
 * Returns projects with risk flags (over budget, behind schedule, low ROI)
 */
export function useRiskyProjects() {
  return useQuery({
    queryKey: dashboardKeys.riskyProjects(),
    queryFn: async (): Promise<ProjectWithRisks[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects_with_risks')
        .select('*')
        .or('is_over_budget.eq.true,is_behind_schedule.eq.true,is_low_roi.eq.true')
        .not('status', 'in', '("sold","dead")');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// PROJECTS BY STATUS (for Kanban)
// ============================================================================

/**
 * Hook for projects grouped by status
 * Used for Kanban pipeline view
 */
export function useProjectsByStatus() {
  return useQuery({
    queryKey: dashboardKeys.projectsByStatus(),
    queryFn: async (): Promise<ProjectSummary[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .not('status', 'eq', 'dead')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// TIMELINE DATA (for Gantt)
// ============================================================================

/**
 * Hook for project timeline data
 * Returns projects with date information for Gantt chart
 */
export function useProjectsTimeline() {
  return useQuery({
    queryKey: dashboardKeys.timeline(),
    queryFn: async (): Promise<ProjectSummary[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .not('status', 'in', '("dead")')
        .order('contract_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to update project status (for Kanban drag-drop)
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      newStatus,
    }: {
      projectId: string;
      newStatus: ProjectStatus;
    }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;
    },
    onMutate: async ({ projectId, newStatus }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dashboardKeys.projectsByStatus() });

      // Snapshot previous value for rollback
      const previousProjects = queryClient.getQueryData<ProjectSummary[]>(
        dashboardKeys.projectsByStatus()
      );

      // Optimistically update
      queryClient.setQueryData<ProjectSummary[]>(
        dashboardKeys.projectsByStatus(),
        (old) =>
          old?.map((p) =>
            p.id === projectId ? { ...p, status: newStatus } : p
          ) || []
      );

      return { previousProjects };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        queryClient.setQueryData(
          dashboardKeys.projectsByStatus(),
          context.previousProjects
        );
      }
      toast.error("Couldn't update status. Please try again.");
      console.error('Status update error:', err);
    },
    onSettled: () => {
      // Invalidate all dashboard queries to refresh data
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onSuccess: () => {
      toast.success('Project status updated');
    },
  });
}

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get projects grouped into Kanban columns
 */
export function useKanbanColumns() {
  const { data: projects, ...rest } = useProjectsByStatus();

  const columns = {
    lead: projects?.filter((p) => p.status === 'lead') || [],
    analyzing: projects?.filter((p) => p.status === 'analyzing') || [],
    under_contract: projects?.filter((p) => p.status === 'under_contract') || [],
    in_rehab: projects?.filter((p) => p.status === 'in_rehab') || [],
    listed: projects?.filter((p) => p.status === 'listed') || [],
    sold: projects?.filter((p) => p.status === 'sold') || [],
  };

  return { columns, ...rest };
}

/**
 * Hook to get sold projects for financial analytics
 */
export function useSoldProjects() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'sold'],
    queryFn: async (): Promise<ProjectSummary[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .eq('status', 'sold')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}
