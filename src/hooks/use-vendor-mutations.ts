'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Vendor, VendorInput } from '@/types'
import { toast } from 'sonner'

export function useVendorMutations() {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // CREATE vendor
  const createVendor = useMutation({
    mutationFn: async (vendor: VendorInput) => {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select()
        .single()

      if (error) throw error
      return data as Vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vendor: ${error.message}`)
    },
  })

  // UPDATE vendor
  const updateVendor = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Vendor> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendors')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vendor: ${error.message}`)
    },
  })

  // DELETE vendor (with dependency check)
  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      // Check for budget item dependencies
      const { count: budgetItemCount } = await supabase
        .from('budget_items')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', id)

      if (budgetItemCount && budgetItemCount > 0) {
        throw new Error(
          `Cannot delete: vendor is assigned to ${budgetItemCount} budget item${budgetItemCount > 1 ? 's' : ''}`
        )
      }

      // Check for draw dependencies
      const { count: drawCount } = await supabase
        .from('draws')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', id)

      if (drawCount && drawCount > 0) {
        throw new Error(
          `Cannot delete: vendor is assigned to ${drawCount} draw${drawCount > 1 ? 's' : ''}`
        )
      }

      // Safe to delete
      const { error } = await supabase.from('vendors').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    createVendor,
    updateVendor,
    deleteVendor,
  }
}
