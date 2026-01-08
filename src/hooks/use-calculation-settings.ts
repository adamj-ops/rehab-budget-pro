'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CalculationSettings, CalculationSettingsInput } from '@/types';
import { DEFAULT_CALCULATION_SETTINGS } from '@/types';
import { toast } from 'sonner';

// ============================================================================
// Query Keys
// ============================================================================

export const calculationSettingsKeys = {
  all: ['calculationSettings'] as const,
  lists: () => [...calculationSettingsKeys.all, 'list'] as const,
  detail: (id: string) => [...calculationSettingsKeys.all, 'detail', id] as const,
  default: () => [...calculationSettingsKeys.all, 'default'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all calculation settings for the current user
 */
export function useCalculationSettingsList() {
  return useQuery({
    queryKey: calculationSettingsKeys.lists(),
    queryFn: async (): Promise<CalculationSettings[]> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('calculation_settings')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as CalculationSettings[];
    },
  });
}

/**
 * Fetch the default calculation settings for the current user
 * If no settings exist, returns DEFAULT_CALCULATION_SETTINGS
 */
export function useDefaultCalculationSettings() {
  return useQuery({
    queryKey: calculationSettingsKeys.default(),
    queryFn: async (): Promise<CalculationSettingsInput> => {
      const supabase = getSupabaseClient();

      // First try to get user's default settings
      const { data, error } = await supabase
        .from('calculation_settings')
        .select('*')
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;

      // If user has saved settings, return them (without id, user_id, timestamps)
      if (data) {
        const { id, user_id, created_at, updated_at, ...settings } = data;
        return settings as CalculationSettingsInput;
      }

      // Otherwise return defaults
      return DEFAULT_CALCULATION_SETTINGS;
    },
  });
}

/**
 * Fetch a specific calculation settings by ID
 */
export function useCalculationSettings(id: string | null) {
  return useQuery({
    queryKey: calculationSettingsKeys.detail(id || ''),
    queryFn: async (): Promise<CalculationSettings | null> => {
      if (!id) return null;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('calculation_settings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as CalculationSettings;
    },
    enabled: !!id,
  });
}

/**
 * Create new calculation settings
 */
export function useCreateCalculationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalculationSettingsInput): Promise<CalculationSettings> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('calculation_settings')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculationSettingsKeys.all });
      toast.success('Calculation settings created');
    },
    onError: (error) => {
      toast.error('Failed to create settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update existing calculation settings
 */
export function useUpdateCalculationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalculationSettings> & { id: string }): Promise<CalculationSettings> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('calculation_settings')
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
      queryClient.invalidateQueries({ queryKey: calculationSettingsKeys.all });
      toast.success('Calculation settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Save calculation settings - creates new if no settings exist, updates if they do
 */
export function useSaveCalculationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalculationSettingsInput): Promise<CalculationSettings> => {
      const supabase = getSupabaseClient();

      // Check if user has existing default settings
      const { data: existing } = await supabase
        .from('calculation_settings')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      if (existing) {
        // Update existing settings
        const { data, error } = await supabase
          .from('calculation_settings')
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('calculation_settings')
          .insert({
            ...input,
            is_default: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculationSettingsKeys.all });
      toast.success('Calculation settings saved');
    },
    onError: (error) => {
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Delete calculation settings
 */
export function useDeleteCalculationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('calculation_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculationSettingsKeys.all });
      toast.success('Settings deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Set a calculation settings as default
 */
export function useSetDefaultCalculationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<CalculationSettings> => {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('calculation_settings')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculationSettingsKeys.all });
      toast.success('Default settings updated');
    },
    onError: (error) => {
      toast.error('Failed to update default', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}
