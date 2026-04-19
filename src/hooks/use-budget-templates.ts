'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  BudgetTemplate,
  BudgetTemplateItem,
  BudgetTemplateSummary,
  BudgetTemplateWithItems,
  BudgetTemplateInput,
  BudgetTemplateItemInput,
  ApplyTemplateOptions,
  ApplyTemplateResult,
  SaveAsTemplateOptions,
  TemplateType,
  PropertyType,
  ScopeLevel,
  BudgetItem,
} from '@/types';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const budgetTemplateKeys = {
  all: ['budgetTemplates'] as const,
  lists: () => [...budgetTemplateKeys.all, 'list'] as const,
  list: (filters: TemplateFilters) => [...budgetTemplateKeys.lists(), filters] as const,
  details: () => [...budgetTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...budgetTemplateKeys.details(), id] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface TemplateFilters {
  type?: TemplateType | 'all';
  propertyType?: PropertyType;
  scopeLevel?: ScopeLevel;
  search?: string;
  favoritesOnly?: boolean;
  includeInactive?: boolean;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all budget templates with optional filters
 */
export function useBudgetTemplates(filters: TemplateFilters = {}) {
  return useQuery({
    queryKey: budgetTemplateKeys.list(filters),
    queryFn: async (): Promise<BudgetTemplateSummary[]> => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('budget_template_summary')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('times_used', { ascending: false })
        .order('name', { ascending: true });

      // Filter by type
      if (filters.type && filters.type !== 'all') {
        query = query.eq('template_type', filters.type);
      }

      // Filter by property type
      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }

      // Filter by scope level
      if (filters.scopeLevel) {
        query = query.eq('scope_level', filters.scopeLevel);
      }

      // Filter favorites only
      if (filters.favoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      // Filter active only (default)
      if (!filters.includeInactive) {
        query = query.eq('is_active', true);
      }

      // Search in name and description
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as BudgetTemplateSummary[];
    },
  });
}

/**
 * Fetch a single template with all its items
 */
export function useBudgetTemplate(id: string | null) {
  return useQuery({
    queryKey: budgetTemplateKeys.detail(id || ''),
    queryFn: async (): Promise<BudgetTemplateWithItems | null> => {
      if (!id) return null;

      const supabase = getSupabaseClient();

      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (templateError) {
        if (templateError.code === 'PGRST116') return null;
        throw templateError;
      }

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('budget_template_items')
        .select('*')
        .eq('template_id', id)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...template,
        items: items || [],
      } as BudgetTemplateWithItems;
    },
    enabled: !!id,
  });
}

/**
 * Create a new template from scratch
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      template: BudgetTemplateInput;
      items: Omit<BudgetTemplateItemInput, 'template_id'>[];
    }): Promise<BudgetTemplate> => {
      const supabase = getSupabaseClient();

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('budget_templates')
        .insert({
          ...input.template,
          template_type: 'user', // Always user type when creating
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create items if any
      if (input.items.length > 0) {
        const itemsWithTemplateId = input.items.map((item, index) => ({
          ...item,
          template_id: template.id,
          sort_order: item.sort_order ?? index * 10,
        }));

        const { error: itemsError } = await supabase
          .from('budget_template_items')
          .insert(itemsWithTemplateId);

        if (itemsError) throw itemsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success('Template created');
    },
    onError: (error) => {
      toast.error('Failed to create template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Save a project's budget as a new template
 */
export function useSaveProjectAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: SaveAsTemplateOptions): Promise<BudgetTemplate> => {
      const supabase = getSupabaseClient();

      // Fetch selected budget items from the project
      const { data: budgetItems, error: fetchError } = await supabase
        .from('budget_items')
        .select('*')
        .eq('project_id', options.projectId)
        .in('id', options.selectedItemIds)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('budget_templates')
        .insert({
          name: options.name,
          description: options.description || null,
          template_type: 'user',
          property_type: options.propertyType || null,
          scope_level: options.scopeLevel || null,
          is_favorite: false,
          is_active: true,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Convert budget items to template items
      if (budgetItems && budgetItems.length > 0) {
        const templateItems = budgetItems.map((item: BudgetItem, index: number) => ({
          template_id: template.id,
          category: item.category,
          item: item.item,
          description: item.description,
          qty: options.includeAmounts ? item.qty : 0,
          unit: item.unit,
          rate: options.includeAmounts ? item.rate : 0,
          default_amount: options.includeAmounts ? item.underwriting_amount : 0,
          cost_type: item.cost_type,
          default_priority: item.priority,
          suggested_trade: null, // Could be derived from vendor's trade if assigned
          sort_order: index * 10,
        }));

        const { error: itemsError } = await supabase
          .from('budget_template_items')
          .insert(templateItems);

        if (itemsError) throw itemsError;
      }

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success('Project saved as template');
    },
    onError: (error) => {
      toast.error('Failed to save as template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update template metadata
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetTemplate> & { id: string }): Promise<BudgetTemplate> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('budget_templates')
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
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success('Template updated');
    },
    onError: (error) => {
      toast.error('Failed to update template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Delete a template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('budget_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success('Template deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Duplicate a template
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<BudgetTemplate> => {
      const supabase = getSupabaseClient();

      // Fetch original template
      const { data: original, error: fetchError } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Fetch original items
      const { data: originalItems, error: itemsError } = await supabase
        .from('budget_template_items')
        .select('*')
        .eq('template_id', id);

      if (itemsError) throw itemsError;

      // Create new template
      const { data: newTemplate, error: createError } = await supabase
        .from('budget_templates')
        .insert({
          name: `${original.name} (Copy)`,
          description: original.description,
          template_type: 'user',
          property_type: original.property_type,
          scope_level: original.scope_level,
          is_favorite: false,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Copy items
      if (originalItems && originalItems.length > 0) {
        const newItems = originalItems.map((item: BudgetTemplateItem) => ({
          template_id: newTemplate.id,
          category: item.category,
          item: item.item,
          description: item.description,
          qty: item.qty,
          unit: item.unit,
          rate: item.rate,
          default_amount: item.default_amount,
          cost_type: item.cost_type,
          default_priority: item.default_priority,
          suggested_trade: item.suggested_trade,
          sort_order: item.sort_order,
        }));

        const { error: copyError } = await supabase
          .from('budget_template_items')
          .insert(newItems);

        if (copyError) throw copyError;
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success('Template duplicated');
    },
    onError: (error) => {
      toast.error('Failed to duplicate template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Toggle template favorite status
 */
export function useToggleTemplateFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }): Promise<BudgetTemplate> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('budget_templates')
        .update({ is_favorite })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });
      toast.success(data.is_favorite ? 'Added to favorites' : 'Removed from favorites');
    },
    onError: (error) => {
      toast.error('Failed to update favorite', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Apply a template to a project
 */
export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ApplyTemplateOptions): Promise<ApplyTemplateResult> => {
      const supabase = getSupabaseClient();
      const result: ApplyTemplateResult = { added: 0, updated: 0, skipped: 0 };

      // Fetch template items
      const { data: templateItems, error: fetchError } = await supabase
        .from('budget_template_items')
        .select('*')
        .eq('template_id', options.templateId)
        .order('sort_order', { ascending: true });

      if (fetchError) throw fetchError;
      if (!templateItems || templateItems.length === 0) {
        throw new Error('Template has no items');
      }

      // Handle replace mode - delete all existing items first
      if (options.conflictResolution === 'replace') {
        const { error: deleteError } = await supabase
          .from('budget_items')
          .delete()
          .eq('project_id', options.projectId);

        if (deleteError) throw deleteError;
      }

      // Fetch existing budget items for the project (for skip/merge modes)
      let existingItems: BudgetItem[] = [];
      if (options.conflictResolution !== 'replace') {
        const { data: existing, error: existingError } = await supabase
          .from('budget_items')
          .select('*')
          .eq('project_id', options.projectId);

        if (existingError) throw existingError;
        existingItems = existing || [];
      }

      // Create a map of existing items by category + item name for quick lookup
      const existingMap = new Map<string, BudgetItem>();
      existingItems.forEach((item) => {
        const key = `${item.category}:${item.item.toLowerCase()}`;
        existingMap.set(key, item);
      });

      // Get max sort order
      const maxSortOrder = existingItems.reduce((max, item) => Math.max(max, item.sort_order || 0), 0);

      // Process template items
      const itemsToInsert: Partial<BudgetItem>[] = [];
      const itemsToUpdate: { id: string; updates: Partial<BudgetItem> }[] = [];

      templateItems.forEach((templateItem: BudgetTemplateItem, index: number) => {
        const key = `${templateItem.category}:${templateItem.item.toLowerCase()}`;
        const existing = existingMap.get(key);

        if (existing) {
          // Item exists
          if (options.conflictResolution === 'skip') {
            result.skipped++;
          } else if (options.conflictResolution === 'merge') {
            // Update amounts if includeAmounts is true
            if (options.includeAmounts) {
              itemsToUpdate.push({
                id: existing.id,
                updates: {
                  underwriting_amount: templateItem.default_amount,
                  qty: templateItem.qty,
                  rate: templateItem.rate,
                },
              });
              result.updated++;
            } else {
              result.skipped++;
            }
          }
        } else {
          // New item - add it
          itemsToInsert.push({
            project_id: options.projectId,
            category: templateItem.category,
            item: templateItem.item,
            description: templateItem.description,
            qty: options.includeAmounts ? templateItem.qty : 0,
            unit: templateItem.unit,
            rate: options.includeAmounts ? templateItem.rate : 0,
            underwriting_amount: options.includeAmounts ? templateItem.default_amount : 0,
            forecast_amount: 0,
            actual_amount: null,
            cost_type: templateItem.cost_type,
            status: 'not_started',
            priority: templateItem.default_priority,
            sort_order: options.conflictResolution === 'replace'
              ? templateItem.sort_order
              : maxSortOrder + 10 + (index * 10),
            notes: null,
          });
          result.added++;
        }
      });

      // Insert new items
      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('budget_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      // Update existing items
      for (const { id, updates } of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from('budget_items')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      // Increment template usage counter
      await supabase
        .from('budget_templates')
        .update({ times_used: supabase.rpc('increment_times_used', { template_id: options.templateId }) })
        .eq('id', options.templateId);

      // Simple increment without RPC (fallback)
      const { data: template } = await supabase
        .from('budget_templates')
        .select('times_used')
        .eq('id', options.templateId)
        .single();

      if (template) {
        await supabase
          .from('budget_templates')
          .update({ times_used: (template.times_used || 0) + 1 })
          .eq('id', options.templateId);
      }

      return result;
    },
    onSuccess: (result, options) => {
      queryClient.invalidateQueries({ queryKey: ['budgetItems', options.projectId] });
      queryClient.invalidateQueries({ queryKey: budgetTemplateKeys.all });

      const parts = [];
      if (result.added > 0) parts.push(`${result.added} added`);
      if (result.updated > 0) parts.push(`${result.updated} updated`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped`);

      toast.success('Template applied', {
        description: parts.join(', '),
      });
    },
    onError: (error) => {
      toast.error('Failed to apply template', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
