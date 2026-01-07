'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { VendorTag, VendorTagInput } from '@/types'

export function useVendorTags() {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Fetch all tags
  const tagsQuery = useQuery({
    queryKey: ['vendorTags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_tags')
        .select('*')
        .order('name')

      if (error) throw error
      return data as VendorTag[]
    },
  })

  // Fetch tags for a specific vendor
  const useVendorTagAssignments = (vendorId: string) => {
    return useQuery({
      queryKey: ['vendorTagAssignments', vendorId],
      queryFn: async () => {
        // First get the tag IDs assigned to this vendor
        const { data: assignments, error: assignError } = await supabase
          .from('vendor_tag_assignments')
          .select('tag_id')
          .eq('vendor_id', vendorId)

        if (assignError) throw assignError
        if (!assignments || assignments.length === 0) return []

        // Then fetch the full tag details
        const tagIds = assignments.map((a) => a.tag_id)
        const { data: tags, error: tagsError } = await supabase
          .from('vendor_tags')
          .select('*')
          .in('id', tagIds)

        if (tagsError) throw tagsError
        return (tags || []) as VendorTag[]
      },
      enabled: !!vendorId,
    })
  }

  // Create a new tag
  const createTag = useMutation({
    mutationFn: async (tag: VendorTagInput) => {
      const { data, error } = await supabase
        .from('vendor_tags')
        .insert(tag)
        .select()
        .single()

      if (error) throw error
      return data as VendorTag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorTags'] })
    },
  })

  // Update a tag
  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorTag> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as VendorTag
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorTags'] })
      queryClient.invalidateQueries({ queryKey: ['vendorTagAssignments'] })
    },
  })

  // Delete a tag
  const deleteTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('vendor_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorTags'] })
      queryClient.invalidateQueries({ queryKey: ['vendorTagAssignments'] })
    },
  })

  // Assign a tag to a vendor
  const assignTag = useMutation({
    mutationFn: async ({ vendorId, tagId }: { vendorId: string; tagId: string }) => {
      const { error } = await supabase
        .from('vendor_tag_assignments')
        .insert({ vendor_id: vendorId, tag_id: tagId })

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendorTagAssignments', variables.vendorId] })
    },
  })

  // Remove a tag from a vendor
  const unassignTag = useMutation({
    mutationFn: async ({ vendorId, tagId }: { vendorId: string; tagId: string }) => {
      const { error } = await supabase
        .from('vendor_tag_assignments')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('tag_id', tagId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendorTagAssignments', variables.vendorId] })
    },
  })

  return {
    tags: tagsQuery.data ?? [],
    isLoading: tagsQuery.isLoading,
    useVendorTagAssignments,
    createTag,
    updateTag,
    deleteTag,
    assignTag,
    unassignTag,
  }
}
