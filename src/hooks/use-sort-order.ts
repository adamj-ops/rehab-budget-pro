'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ReorderItemsParams {
  itemIds: string[]  // Ordered array of item IDs
}

interface UpdateSortOrderParams {
  id: string
  sort_order: number
}

export function useSortOrderMutations(projectId: string) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Batch update sort orders for multiple items
  const reorderItems = useMutation({
    mutationFn: async ({ itemIds }: ReorderItemsParams) => {
      // Update each item with its new sort_order based on array position
      const updates = itemIds.map((id, index) => ({
        id,
        sort_order: index,
      }))

      // Use Promise.all to update all items
      const results = await Promise.all(
        updates.map(({ id, sort_order }) =>
          supabase
            .from('budget_items')
            .update({ sort_order })
            .eq('id', id)
        )
      )

      // Check for errors
      const error = results.find((r) => r.error)?.error
      if (error) throw error

      return updates
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      console.error('Error reordering items:', error)
      toast.error('Failed to save new order')
    },
  })

  // Update single item sort order
  const updateSortOrder = useMutation({
    mutationFn: async ({ id, sort_order }: UpdateSortOrderParams) => {
      const { data, error } = await supabase
        .from('budget_items')
        .update({ sort_order })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (error) => {
      console.error('Error updating sort order:', error)
      toast.error('Failed to update order')
    },
  })

  return {
    reorderItems,
    updateSortOrder,
  }
}
