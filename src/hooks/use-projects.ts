'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useProjectsListRealtime, useProjectRealtime } from '@/hooks/use-realtime';
import type { Project, ProjectSummary } from '@/types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  summary: (id: string) => [...projectKeys.all, 'summary', id] as const,
};

// Fetch all projects with real-time updates
export function useProjects() {
  // Enable real-time subscription for projects list
  useProjectsListRealtime();

  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectSummary[];
    },
  });
}

// Fetch single project with real-time updates
export function useProject(id: string) {
  // Enable real-time subscription for this project
  useProjectRealtime(id, !!id);

  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
}

// Fetch project summary with calculated fields and real-time updates
export function useProjectSummary(id: string) {
  // Enable real-time subscription for this project
  useProjectRealtime(id, !!id);

  return useQuery({
    queryKey: projectKeys.summary(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_summary')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as ProjectSummary;
    },
    enabled: !!id,
  });
}

// Create project mutation
interface CreateProjectInput {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  year_built?: number | null;
  property_type?: string;
  arv?: number | null;
  purchase_price?: number | null;
  closing_costs?: number;
  holding_costs_monthly?: number;
  hold_months?: number;
  selling_cost_percent?: number;
  contingency_percent?: number;
  status?: string;
  contract_date?: string | null;
  close_date?: string | null;
  rehab_start_date?: string | null;
  target_complete_date?: string | null;
  list_date?: string | null;
  sale_date?: string | null;
  notes?: string | null;
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const supabase = getSupabaseClient();

      // Create the project with authenticated user's ID
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          ...input,
          user_id: user?.id ?? null, // Use authenticated user's ID
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Seed budget items from templates
      const { data: templates, error: templatesError } = await supabase
        .from('budget_category_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        return project;
      }

      const budgetItemsToInsert: Array<{
        project_id: string;
        category: string;
        item: string;
        qty: number;
        unit: string;
        rate: number;
        underwriting_amount: number;
        forecast_amount: number;
        actual_amount: null;
        status: string;
        cost_type: string;
        priority: string;
        sort_order: number;
      }> = [];

      for (const template of templates || []) {
        const lineItems = template.default_line_items as string[] | null;

        if (lineItems && lineItems.length > 0) {
          lineItems.forEach((itemName, index) => {
            budgetItemsToInsert.push({
              project_id: project.id,
              category: template.category,
              item: itemName,
              qty: 1,
              unit: 'ea',
              rate: 0,
              underwriting_amount: 0,
              forecast_amount: 0,
              actual_amount: null,
              status: 'not_started',
              cost_type: 'both',
              priority: 'medium',
              sort_order: template.sort_order * 1000 + index,
            });
          });
        }
      }

      if (budgetItemsToInsert.length > 0) {
        const { error: budgetError } = await supabase
          .from('budget_items')
          .insert(budgetItemsToInsert);

        if (budgetError) {
          console.error('Error seeding budget items:', budgetError);
        }
      }

      return project as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

// Update project mutation
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreateProjectInput> & { id: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.summary(data.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Delete project mutation
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
