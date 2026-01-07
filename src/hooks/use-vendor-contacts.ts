'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { VendorContact, VendorContactInput } from '@/types'

export function useVendorContacts(vendorId: string) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Fetch contacts for a vendor
  const contactsQuery = useQuery({
    queryKey: ['vendorContacts', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_contacts')
        .select(`
          *,
          projects (
            id,
            name
          )
        `)
        .eq('vendor_id', vendorId)
        .order('contact_date', { ascending: false })

      if (error) throw error
      return data as (VendorContact & { projects: { id: string; name: string } | null })[]
    },
    enabled: !!vendorId,
  })

  // Create a new contact
  const createContact = useMutation({
    mutationFn: async (contact: VendorContactInput) => {
      const { data, error } = await supabase
        .from('vendor_contacts')
        .insert(contact)
        .select()
        .single()

      if (error) throw error
      return data as VendorContact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorContacts', vendorId] })
    },
  })

  // Update a contact
  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorContact> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as VendorContact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorContacts', vendorId] })
    },
  })

  // Delete a contact
  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('vendor_contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorContacts', vendorId] })
    },
  })

  // Mark follow-up as complete
  const completeFollowUp = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('vendor_contacts')
        .update({ follow_up_completed: true })
        .eq('id', contactId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorContacts', vendorId] })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    createContact,
    updateContact,
    deleteContact,
    completeFollowUp,
  }
}
