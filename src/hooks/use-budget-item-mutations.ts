'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { BudgetItem, BudgetItemInput, ItemStatus } from '@/types'
import { toast } from 'sonner'

interface CreateBudgetItemParams {
  projectId: string
  item: Partial<BudgetItemInput>
}

interface UpdateBudgetItemParams {
  id: string
  data: Partial<BudgetItem>
}

interface BulkUpdateStatusParams {
  itemIds: string[]
  status: ItemStatus
}

interface BulkDeleteParams {
  itemIds: string[]
}

export function useBudgetItemMutations(projectId: string) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Create a new budget item
  const createItem = useMutation({
    mutationFn: async ({ projectId, item }: CreateBudgetItemParams) => {
      // Get max sort_order for this category
      const { data: existingItems } = await supabase
        .from('budget_items')
        .select('sort_order')
        .eq('project_id', projectId)
        .eq('category', item.category)
        .order('sort_order', { ascending: false })
        .limit(1)

      const maxSortOrder = existingItems?.[0]?.sort_order ?? 0

      const newItem = {
        project_id: projectId,
        category: item.category,
        item: item.item || 'New Item',
        description: item.description || null,
        room_area: item.room_area || null,
        qty: item.qty ?? 1,
        unit: item.unit || 'ea',
        rate: item.rate ?? 0,
        underwriting_amount: item.underwriting_amount ?? 0,
        forecast_amount: item.forecast_amount ?? 0,
        actual_amount: item.actual_amount ?? null,
        cost_type: item.cost_type || 'both',
        status: item.status || 'not_started',
        priority: item.priority || 'medium',
        sort_order: maxSortOrder + 1,
        vendor_id: item.vendor_id || null,
        notes: item.notes || null,
      }

      const { data, error } = await supabase
        .from('budget_items')
        .insert(newItem)
        .select()
        .single()

      if (error) throw error
      return data as BudgetItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Line item added')
    },
    onError: (error) => {
      console.error('Error creating budget item:', error)
      toast.error('Failed to add line item')
    },
  })

  // Update a budget item
  const updateItem = useMutation({
    mutationFn: async ({ id, data }: UpdateBudgetItemParams) => {
      const { data: result, error } = await supabase
        .from('budget_items')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as BudgetItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Budget item updated')
    },
    onError: (error) => {
      console.error('Error updating budget item:', error)
      toast.error('Failed to update budget item')
    },
  })

  // Delete a single budget item
  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Line item deleted')
    },
    onError: (error) => {
      console.error('Error deleting budget item:', error)
      toast.error('Failed to delete line item')
    },
  })

  // Bulk update status
  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ itemIds, status }: BulkUpdateStatusParams) => {
      const { data, error } = await supabase
        .from('budget_items')
        .update({ status })
        .in('id', itemIds)
        .select()

      if (error) throw error
      return data as BudgetItem[]
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success(`Updated ${variables.itemIds.length} items to ${variables.status.replace('_', ' ')}`)
    },
    onError: (error) => {
      console.error('Error bulk updating status:', error)
      toast.error('Failed to update items')
    },
  })

  // Bulk delete items
  const bulkDelete = useMutation({
    mutationFn: async ({ itemIds }: BulkDeleteParams) => {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .in('id', itemIds)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success(`Deleted ${variables.itemIds.length} items`)
    },
    onError: (error) => {
      console.error('Error bulk deleting items:', error)
      toast.error('Failed to delete items')
    },
  })

  return {
    createItem,
    updateItem,
    deleteItem,
    bulkUpdateStatus,
    bulkDelete,
  }
}
