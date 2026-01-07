'use client'

import * as React from 'react'
import type { BudgetItem, LineItemPhoto, PhotoType } from '@/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IconUpload,
  IconPhoto,
  IconFile,
  IconX,
  IconLoader2,
  IconTrash,
  IconReceipt,
  IconCamera,
  IconPhotoEdit,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useLineItemPhotos, usePhotoMutations, PHOTO_TYPE_OPTIONS, PHOTO_TYPE_LABELS } from '@/hooks/use-photo-mutations'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface PhotoUploadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  budgetItem: BudgetItem
}

const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf'
const MAX_FILE_SIZE_MB = 10

export function PhotoUploadSheet({
  open,
  onOpenChange,
  projectId,
  budgetItem,
}: PhotoUploadSheetProps) {
  const { data: photos = [], isLoading } = useLineItemPhotos(open ? budgetItem.id : null)
  const { uploadPhoto, deletePhoto, getPhotoUrl } = usePhotoMutations(projectId)

  // Upload state
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [photoType, setPhotoType] = React.useState<PhotoType>('progress')
  const [caption, setCaption] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Delete state
  const [deletePhotoData, setDeletePhotoData] = React.useState<LineItemPhoto | null>(null)

  // Photo URLs cache
  const [photoUrls, setPhotoUrls] = React.useState<Record<string, string>>({})

  // Fetch signed URLs for photos
  React.useEffect(() => {
    if (open && photos.length > 0) {
      photos.forEach(async (photo) => {
        if (!photoUrls[photo.id]) {
          const url = await getPhotoUrl(photo.storage_path)
          if (url) {
            setPhotoUrls((prev) => ({ ...prev, [photo.id]: url }))
          }
        }
      })
    }
  }, [open, photos, getPhotoUrl, photoUrls])

  // Reset state when sheet closes
  React.useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setCaption('')
      setPhotoType('progress')
      setIsDragOver(false)
    }
  }, [open])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPG, PNG, WebP, or PDF.')
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    setSelectedFile(file)

    // Auto-detect photo type from filename
    const nameLower = file.name.toLowerCase()
    if (nameLower.includes('receipt') || nameLower.includes('invoice')) {
      setPhotoType('receipt')
    } else if (nameLower.includes('before')) {
      setPhotoType('before')
    } else if (nameLower.includes('after')) {
      setPhotoType('after')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    uploadPhoto.mutate(
      {
        projectId,
        lineItemId: budgetItem.id,
        file: selectedFile,
        photoType,
        caption: caption || undefined,
      },
      {
        onSuccess: () => {
          setSelectedFile(null)
          setCaption('')
          setPhotoType('progress')
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },
      }
    )
  }

  const handleDeleteConfirm = () => {
    if (deletePhotoData) {
      deletePhoto.mutate(deletePhotoData, {
        onSuccess: () => {
          setDeletePhotoData(null)
          // Remove from cache
          setPhotoUrls((prev) => {
            const next = { ...prev }
            delete next[deletePhotoData.id]
            return next
          })
        },
      })
    }
  }

  const getPhotoTypeIcon = (type: PhotoType) => {
    switch (type) {
      case 'receipt':
        return <IconReceipt className="h-3 w-3" />
      case 'before':
      case 'after':
        return <IconPhotoEdit className="h-3 w-3" />
      case 'progress':
        return <IconCamera className="h-3 w-3" />
      default:
        return <IconPhoto className="h-3 w-3" />
    }
  }

  const isPdf = (fileName: string | null) => {
    return fileName?.toLowerCase().endsWith('.pdf')
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Photos & Receipts</SheetTitle>
            <SheetDescription>
              {budgetItem.item} - Upload receipts, progress photos, or before/after images
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                selectedFile && 'border-green-500 bg-green-50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    {isPdf(selectedFile.name) ? (
                      <IconFile className="h-8 w-8" />
                    ) : (
                      <IconPhoto className="h-8 w-8" />
                    )}
                  </div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <IconX className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <IconUpload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop a file here, or{' '}
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, or PDF up to {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Photo Type & Caption (shown when file selected) */}
            {selectedFile && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoType">Type</Label>
                    <Select
                      value={photoType}
                      onValueChange={(value) => setPhotoType(value as PhotoType)}
                    >
                      <SelectTrigger id="photoType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHOTO_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Input
                      id="caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a note..."
                    />
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadPhoto.isPending}
                  className="w-full"
                >
                  {uploadPhoto.isPending ? (
                    <>
                      <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <IconUpload className="h-4 w-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Existing Photos */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                Uploaded Photos ({photos.length})
              </h4>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <IconLoader2 className="h-6 w-6 mx-auto animate-spin" />
                  <p className="text-sm mt-2">Loading photos...</p>
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <IconPhoto className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm mt-2">No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative group rounded-lg border overflow-hidden bg-muted"
                    >
                      {/* Photo Preview */}
                      <div className="aspect-square relative">
                        {isPdf(photo.file_name) ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
                            <IconFile className="h-12 w-12 text-red-500" />
                          </div>
                        ) : photoUrls[photo.id] ? (
                          <img
                            src={photoUrls[photo.id]}
                            alt={photo.caption || photo.file_name || 'Photo'}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}

                        {/* Type Badge */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                              photo.photo_type === 'receipt' && 'bg-green-100 text-green-700',
                              photo.photo_type === 'progress' && 'bg-blue-100 text-blue-700',
                              photo.photo_type === 'before' && 'bg-orange-100 text-orange-700',
                              photo.photo_type === 'after' && 'bg-purple-100 text-purple-700',
                              photo.photo_type === 'other' && 'bg-zinc-100 text-zinc-700'
                            )}
                          >
                            {getPhotoTypeIcon(photo.photo_type)}
                            {PHOTO_TYPE_LABELS[photo.photo_type]}
                          </span>
                        </div>

                        {/* Delete Button (on hover) */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletePhotoData(photo)}
                          >
                            <IconTrash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Caption / Filename */}
                      <div className="p-2">
                        <p className="text-xs truncate">
                          {photo.caption || photo.file_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {photo.file_size
                            ? `${(photo.file_size / 1024).toFixed(0)} KB`
                            : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletePhotoData}
        onOpenChange={(open) => !open && setDeletePhotoData(null)}
        title="Delete Photo"
        description="Are you sure you want to delete this photo? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isPending={deletePhoto.isPending}
      />
    </>
  )
}
