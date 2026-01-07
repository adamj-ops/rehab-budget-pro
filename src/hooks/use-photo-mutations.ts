'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { LineItemPhoto, PhotoType } from '@/types'
import { toast } from 'sonner'

interface UploadPhotoParams {
  projectId: string
  lineItemId: string
  file: File
  photoType: PhotoType
  caption?: string
}

interface UpdatePhotoParams {
  id: string
  data: Partial<Pick<LineItemPhoto, 'photo_type' | 'caption'>>
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function useLineItemPhotos(lineItemId: string | null) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['lineItemPhotos', lineItemId],
    queryFn: async () => {
      if (!lineItemId) return []

      const { data, error } = await supabase
        .from('line_item_photos')
        .select('*')
        .eq('line_item_id', lineItemId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as LineItemPhoto[]
    },
    enabled: !!lineItemId,
  })
}

export function useProjectPhotos(projectId: string) {
  const supabase = getSupabaseClient()

  return useQuery({
    queryKey: ['projectPhotos', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_item_photos')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as LineItemPhoto[]
    },
  })
}

export function usePhotoMutations(projectId: string) {
  const queryClient = useQueryClient()
  const supabase = getSupabaseClient()

  // Upload a photo
  const uploadPhoto = useMutation({
    mutationFn: async ({ projectId, lineItemId, file, photoType, caption }: UploadPhotoParams) => {
      // Validate file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Accepted: JPG, PNG, WebP, PDF')
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 10MB')
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${crypto.randomUUID()}.${fileExt}`
      const storagePath = `${projectId}/${lineItemId}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error('Failed to upload file to storage')
      }

      // Create database record
      const photoRecord = {
        line_item_id: lineItemId,
        project_id: projectId,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        photo_type: photoType,
        caption: caption || null,
        taken_at: null,
      }

      const { data, error: dbError } = await supabase
        .from('line_item_photos')
        .insert(photoRecord)
        .select()
        .single()

      if (dbError) {
        // Cleanup: delete the uploaded file if DB insert fails
        await supabase.storage.from('project-photos').remove([storagePath])
        throw dbError
      }

      return data as LineItemPhoto
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lineItemPhotos', variables.lineItemId] })
      queryClient.invalidateQueries({ queryKey: ['projectPhotos', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Photo uploaded')
    },
    onError: (error: Error) => {
      console.error('Error uploading photo:', error)
      toast.error(error.message || 'Failed to upload photo')
    },
  })

  // Update photo metadata
  const updatePhoto = useMutation({
    mutationFn: async ({ id, data }: UpdatePhotoParams) => {
      const { data: result, error } = await supabase
        .from('line_item_photos')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result as LineItemPhoto
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lineItemPhotos', data.line_item_id] })
      queryClient.invalidateQueries({ queryKey: ['projectPhotos', projectId] })
      toast.success('Photo updated')
    },
    onError: (error) => {
      console.error('Error updating photo:', error)
      toast.error('Failed to update photo')
    },
  })

  // Delete a photo
  const deletePhoto = useMutation({
    mutationFn: async (photo: LineItemPhoto) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('project-photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue to delete DB record anyway
      }

      // Delete database record
      const { error: dbError } = await supabase
        .from('line_item_photos')
        .delete()
        .eq('id', photo.id)

      if (dbError) throw dbError
    },
    onSuccess: (_, photo) => {
      queryClient.invalidateQueries({ queryKey: ['lineItemPhotos', photo.line_item_id] })
      queryClient.invalidateQueries({ queryKey: ['projectPhotos', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success('Photo deleted')
    },
    onError: (error) => {
      console.error('Error deleting photo:', error)
      toast.error('Failed to delete photo')
    },
  })

  // Get signed URL for viewing a photo
  const getPhotoUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('project-photos')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    if (error) {
      console.error('Error getting signed URL:', error)
      return null
    }

    return data.signedUrl
  }

  return {
    uploadPhoto,
    updatePhoto,
    deletePhoto,
    getPhotoUrl,
  }
}

// Photo type labels for UI
export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  receipt: 'Receipt',
  progress: 'Progress',
  before: 'Before',
  after: 'After',
  other: 'Other',
}

export const PHOTO_TYPE_OPTIONS: { value: PhotoType; label: string }[] = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'progress', label: 'Progress' },
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'other', label: 'Other' },
]
