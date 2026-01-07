'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { LineItemPhoto, PhotoType, BudgetItem } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import {
  IconX,
  IconUpload,
  IconPhoto,
  IconTrash,
  IconLoader2,
  IconReceipt,
  IconCamera,
  IconPhotoCheck,
  IconDownload,
  IconMaximize,
} from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PhotoGalleryProps {
  projectId: string;
  budgetItem: BudgetItem;
  onClose: () => void;
}

const PHOTO_TYPE_OPTIONS: { value: PhotoType; label: string; icon: typeof IconReceipt }[] = [
  { value: 'receipt', label: 'Receipt', icon: IconReceipt },
  { value: 'progress', label: 'Progress', icon: IconCamera },
  { value: 'before', label: 'Before', icon: IconPhoto },
  { value: 'after', label: 'After', icon: IconPhotoCheck },
  { value: 'other', label: 'Other', icon: IconPhoto },
];

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  receipt: 'Receipt',
  progress: 'Progress',
  before: 'Before',
  after: 'After',
  other: 'Other',
};

export function PhotoGallery({ projectId, budgetItem, onClose }: PhotoGalleryProps) {
  const queryClient = useQueryClient();
  const [selectedPhotoType, setSelectedPhotoType] = useState<PhotoType>('receipt');
  const [uploading, setUploading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<LineItemPhoto | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<LineItemPhoto | null>(null);

  // Fetch photos for this budget item
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['photos', budgetItem.id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('line_item_photos')
        .select('*')
        .eq('line_item_id', budgetItem.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LineItemPhoto[];
    },
  });

  // Get signed URL for a photo
  const getSignedUrl = async (storagePath: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from('project-photos')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, photoType }: { file: File; photoType: PhotoType }) => {
      const supabase = getSupabaseClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${projectId}/${budgetItem.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data, error: dbError } = await supabase
        .from('line_item_photos')
        .insert({
          line_item_id: budgetItem.id,
          project_id: projectId,
          storage_path: filePath,
          file_name: file.name,
          file_size: file.size,
          photo_type: photoType,
        })
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file if db insert fails
        await supabase.storage.from('project-photos').remove([filePath]);
        throw dbError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', budgetItem.id] });
      toast.success('Photo uploaded successfully');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (photo: LineItemPhoto) => {
      const supabase = getSupabaseClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-photos')
        .remove([photo.storage_path]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from('line_item_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', budgetItem.id] });
      toast.success('Photo deleted');
      setPhotoToDelete(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete photo');
    },
  });

  // Dropzone handler
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          await uploadMutation.mutateAsync({ file, photoType: selectedPhotoType });
        }
      } finally {
        setUploading(false);
      }
    },
    [uploadMutation, selectedPhotoType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  });

  // Photo thumbnail component with lazy URL loading
  const PhotoThumbnail = ({ photo }: { photo: LineItemPhoto }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Load signed URL on mount
    useState(() => {
      getSignedUrl(photo.storage_path)
        .then(setImageUrl)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });

    const isPdf = photo.file_name?.toLowerCase().endsWith('.pdf');

    return (
      <div className="group relative rounded-lg border bg-card overflow-hidden">
        <div className="aspect-square relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <IconPhoto className="h-8 w-8 text-muted-foreground" />
            </div>
          ) : isPdf ? (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <div className="text-center">
                <IconReceipt className="h-10 w-10 mx-auto text-red-500" />
                <p className="text-xs text-red-600 mt-1">PDF</p>
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl || ''}
              alt={photo.caption || 'Photo'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={() => setPreviewPhoto(photo)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              title="View full size"
            >
              <IconMaximize className="h-4 w-4 text-white" />
            </button>
            {imageUrl && (
              <a
                href={imageUrl}
                download={photo.file_name}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                title="Download"
              >
                <IconDownload className="h-4 w-4 text-white" />
              </a>
            )}
            <button
              onClick={() => setPhotoToDelete(photo)}
              className="p-2 rounded-full bg-red-500/50 hover:bg-red-500/70 transition-colors"
              title="Delete"
            >
              <IconTrash className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Photo type badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              photo.photo_type === 'receipt' && 'bg-blue-100 text-blue-700',
              photo.photo_type === 'progress' && 'bg-yellow-100 text-yellow-700',
              photo.photo_type === 'before' && 'bg-orange-100 text-orange-700',
              photo.photo_type === 'after' && 'bg-green-100 text-green-700',
              photo.photo_type === 'other' && 'bg-zinc-100 text-zinc-700'
            )}
          >
            {PHOTO_TYPE_LABELS[photo.photo_type]}
          </span>
        </div>

        {/* File name */}
        <div className="p-2">
          <p className="text-xs text-muted-foreground truncate" title={photo.file_name || ''}>
            {photo.file_name || 'Unknown file'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Photos - {budgetItem.item}</h2>
            <p className="text-sm text-muted-foreground">
              {budgetItem.category} • {formatCurrency(budgetItem.forecast_amount || budgetItem.underwriting_amount)}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Upload Photos</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Photo type:</span>
                <select
                  value={selectedPhotoType}
                  onChange={(e) => setSelectedPhotoType(e.target.value as PhotoType)}
                  className="text-sm p-1 rounded border"
                >
                  {PHOTO_TYPE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
                uploading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : isDragActive ? (
                <div className="flex flex-col items-center gap-2">
                  <IconUpload className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium">Drop files here</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <IconUpload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="font-medium text-primary">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WebP, or PDF (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Photos Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">
              Photos ({photos.length})
            </h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : photos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <IconPhoto className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground mt-2">No photos yet</p>
                <p className="text-xs text-muted-foreground">
                  Upload photos of receipts, progress, or before/after shots
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <PhotoThumbnail key={photo.id} photo={photo} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!photoToDelete} onOpenChange={() => setPhotoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => photoToDelete && deleteMutation.mutate(photoToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <PhotoPreview
          photo={previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          getSignedUrl={getSignedUrl}
        />
      )}
    </div>
  );
}

// Preview Modal Component
function PhotoPreview({
  photo,
  onClose,
  getSignedUrl,
}: {
  photo: LineItemPhoto;
  onClose: () => void;
  getSignedUrl: (path: string) => Promise<string>;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getSignedUrl(photo.storage_path)
      .then(setImageUrl)
      .finally(() => setLoading(false));
  });

  const isPdf = photo.file_name?.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <IconX className="h-6 w-6 text-white" />
      </button>

      {loading ? (
        <IconLoader2 className="h-12 w-12 animate-spin text-white" />
      ) : isPdf ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <IconReceipt className="h-16 w-16 mx-auto text-red-500" />
          <p className="mt-4 font-medium">{photo.file_name}</p>
          <a
            href={imageUrl || ''}
            download={photo.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <IconDownload className="h-4 w-4" />
            Download PDF
          </a>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl || ''}
          alt={photo.caption || 'Photo'}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
