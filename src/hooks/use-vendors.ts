'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Vendor, VendorPaymentSummary, VendorInput } from '@/types';

// Query keys
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
  summaries: () => [...vendorKeys.all, 'summary'] as const,
  summary: (id: string) => [...vendorKeys.summaries(), id] as const,
};

// Fetch all vendors
export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Vendor[];
    },
  });
}

// Fetch vendors with payment summary
export function useVendorSummaries() {
  return useQuery({
    queryKey: vendorKeys.summaries(),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendor_payment_summary')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as VendorPaymentSummary[];
    },
  });
}

// Fetch single vendor
export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!id,
  });
}

// Create vendor mutation input type
type CreateVendorInput = Omit<VendorInput, 'user_id'>;

// Create vendor mutation
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          ...input,
          user_id: null, // TODO: Replace when auth is implemented
        })
        .select()
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

// Update vendor mutation
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CreateVendorInput> & { id: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Vendor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: vendorKeys.summaries() });
    },
  });
}

// Delete vendor mutation
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}

// Assign vendor to budget item
export function useAssignVendorToBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      budgetItemId,
      vendorId,
    }: {
      budgetItemId: string;
      vendorId: string | null;
    }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('budget_items')
        .update({ vendor_id: vendorId })
        .eq('id', budgetItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate project queries to refresh budget items
      queryClient.invalidateQueries({ queryKey: ['project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: vendorKeys.summaries() });
    },
  });
}
