'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useVendorsRealtime } from '@/hooks/use-realtime';
import type { Vendor, VendorTrade, VendorStatus } from '@/types';

// Query keys
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};

// Fetch all vendors with real-time updates
export function useVendors() {
  // Enable real-time subscription for vendors
  useVendorsRealtime();

  return useQuery({
    queryKey: vendorKeys.lists(),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Vendor[];
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

// Create vendor input type
interface CreateVendorInput {
  name: string;
  trade: VendorTrade;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  licensed?: boolean;
  insured?: boolean;
  w9_on_file?: boolean;
  rating?: number | null;
  reliability?: 'excellent' | 'good' | 'fair' | 'poor' | null;
  price_level?: '$' | '$$' | '$$$' | null;
  status?: VendorStatus;
  notes?: string | null;
}

// Create vendor mutation
export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          ...input,
          user_id: user?.id ?? null, // Use authenticated user's ID
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
    },
  });
}

// Delete vendor mutation
export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('vendors').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
    },
  });
}
