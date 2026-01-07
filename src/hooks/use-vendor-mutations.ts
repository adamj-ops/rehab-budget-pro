'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Vendor, VendorInput } from '@/types'
import { toast } from 'sonner'

export function useVendorMutations() {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // CREATE vendor with optimistic update
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
    onMutate: async (newVendor) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vendors'] })

      // Snapshot previous value
      const previousVendors = queryClient.getQueryData<Vendor[]>(['vendors'])

      // Optimistically add to cache with temp ID
      const optimisticVendor: Vendor = {
        ...newVendor,
        id: `temp-${Date.now()}`,
        user_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Vendor[]>(['vendors'], (old) =>
        old ? [...old, optimisticVendor] : [optimisticVendor]
      )

      return { previousVendors }
    },
    onError: (error: Error, _newVendor, context) => {
      // Rollback on error
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors'], context.previousVendors)
      }
      toast.error(`Failed to create vendor: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('Vendor created successfully')
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  // UPDATE vendor with optimistic update
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
    onMutate: async (updatedVendor) => {
      await queryClient.cancelQueries({ queryKey: ['vendors'] })

      const previousVendors = queryClient.getQueryData<Vendor[]>(['vendors'])

      // Optimistically update in cache
      queryClient.setQueryData<Vendor[]>(['vendors'], (old) =>
        old?.map((vendor) =>
          vendor.id === updatedVendor.id
            ? { ...vendor, ...updatedVendor, updated_at: new Date().toISOString() }
            : vendor
        )
      )

      return { previousVendors }
    },
    onError: (error: Error, _updatedVendor, context) => {
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors'], context.previousVendors)
      }
      toast.error(`Failed to update vendor: ${error.message}`)
    },
    onSuccess: () => {
      toast.success('Vendor updated successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  // DELETE vendor with optimistic update (includes dependency check)
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
      return id
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['vendors'] })

      const previousVendors = queryClient.getQueryData<Vendor[]>(['vendors'])

      // Optimistically remove from cache
      queryClient.setQueryData<Vendor[]>(['vendors'], (old) =>
        old?.filter((vendor) => vendor.id !== deletedId)
      )

      return { previousVendors }
    },
    onError: (error: Error, _deletedId, context) => {
      // Rollback - restore the deleted vendor
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors'], context.previousVendors)
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Vendor deleted successfully')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })

  return {
    createVendor,
    updateVendor,
    deleteVendor,
  }
}
