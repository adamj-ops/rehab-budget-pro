'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Draw, DrawStatus } from '@/types'
import { toast } from 'sonner'

type DrawInput = Omit<Draw, 'id' | 'created_at' | 'updated_at'>

interface CreateDrawParams {
  projectId: string
  draw: Partial<DrawInput>
}

interface UpdateDrawParams {
  id: string
  data: Partial<Draw>
}

interface UpdateStatusParams {
  id: string
  status: DrawStatus
  datePaid?: string | null
}

export function useDrawMutations(projectId: string) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Get next draw number
  const getNextDrawNumber = async (): Promise<number> => {
    const { data } = await supabase
      .from('draws')
      .select('draw_number')
      .eq('project_id', projectId)
      .order('draw_number', { ascending: false })
      .limit(1)

    return (data?.[0]?.draw_number ?? 0) + 1
  }

  // Create a new draw
  const createDraw = useMutation({
    mutationFn: async ({ projectId, draw }: CreateDrawParams) => {
      const drawNumber = await getNextDrawNumber()

      const newDraw = {
        project_id: projectId,
        draw_number: drawNumber,
        vendor_id: draw.vendor_id || null,
        milestone: draw.milestone || null,
        description: draw.description || null,
        percent_complete: draw.percent_complete || null,
        amount: draw.amount || 0,
        date_requested: draw.date_requested || new Date().toISOString().split('T')[0],
        date_paid: draw.date_paid || null,
        status: draw.status || 'pending',
        payment_method: draw.payment_method || null,
        reference_number: draw.reference_number || null,
        notes: draw.notes || null,
      }

      const { data, error } = await supabase
        .from('draws')
        .insert(newDraw)
        .select()
        .single()

      if (error) throw error
      return data as Draw
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Draw created')
    },
    onError: (error) => {
      console.error('Error creating draw:', error)
      toast.error('Failed to create draw')
    },
  })

  // Update a draw
  const updateDraw = useMutation({
    mutationFn: async ({ id, data }: UpdateDrawParams) => {
      const { data: result, error } = await supabase
        .from('draws')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as Draw
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Draw updated')
    },
    onError: (error) => {
      console.error('Error updating draw:', error)
      toast.error('Failed to update draw')
    },
  })

  // Update draw status (with optional paid date)
  const updateStatus = useMutation({
    mutationFn: async ({ id, status, datePaid }: UpdateStatusParams) => {
      const updateData: Partial<Draw> = { status }

      // Auto-set date_paid when marking as paid
      if (status === 'paid' && !datePaid) {
        updateData.date_paid = new Date().toISOString().split('T')[0]
      } else if (datePaid) {
        updateData.date_paid = datePaid
      }

      const { data, error } = await supabase
        .from('draws')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Draw
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      const statusLabels: Record<DrawStatus, string> = {
        pending: 'pending',
        approved: 'approved',
        paid: 'paid',
      }
      toast.success(`Draw marked as ${statusLabels[variables.status]}`)
    },
    onError: (error) => {
      console.error('Error updating draw status:', error)
      toast.error('Failed to update draw status')
    },
  })

  // Delete a draw
  const deleteDraw = useMutation({
    mutationFn: async (drawId: string) => {
      const { error } = await supabase
        .from('draws')
        .delete()
        .eq('id', drawId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Draw deleted')
    },
    onError: (error) => {
      console.error('Error deleting draw:', error)
      toast.error('Failed to delete draw')
    },
  })

  return {
    createDraw,
    updateDraw,
    updateStatus,
    deleteDraw,
  }
}
