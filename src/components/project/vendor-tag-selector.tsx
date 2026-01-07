'use client'

import * as React from 'react'
import type { VendorTag } from '@/types'
import { TAG_COLORS } from '@/types'
import { cn } from '@/lib/utils'
import { useVendorTags } from '@/hooks/use-vendor-tags'
import { TagBadge } from '@/components/ui/tag-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  IconPlus,
  IconCheck,
  IconTag,
  IconLoader2,
} from '@tabler/icons-react'

interface VendorTagSelectorProps {
  vendorId: string
  assignedTags: VendorTag[]
  onAssign: (tagId: string) => void
  onUnassign: (tagId: string) => void
  className?: string
}

export function VendorTagSelector({
  vendorId,
  assignedTags,
  onAssign,
  onUnassign,
  className,
}: VendorTagSelectorProps) {
  const { tags, createTag, isLoading } = useVendorTags()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [newTagName, setNewTagName] = React.useState('')
  const [newTagColor, setNewTagColor] = React.useState<string>(TAG_COLORS[6].value) // Default indigo

  const assignedTagIds = new Set(assignedTags.map((t) => t.id))

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const newTag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
        description: null,
      })
      // Auto-assign the new tag to this vendor
      onAssign(newTag.id)
      setNewTagName('')
      setIsCreating(false)
    } catch (error) {
      console.error('Failed to create tag:', error)
    }
  }

  const handleToggleTag = (tag: VendorTag) => {
    if (assignedTagIds.has(tag.id)) {
      onUnassign(tag.id)
    } else {
      onAssign(tag.id)
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {/* Display assigned tags */}
      {assignedTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={() => onUnassign(tag.id)}
        />
      ))}

      {/* Add tag button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <IconTag className="h-3 w-3 mr-1" />
            {assignedTags.length === 0 ? 'Add tags' : 'Add'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          {isCreating ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Tag Name</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag()
                    if (e.key === 'Escape') setIsCreating(false)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex flex-wrap gap-1">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewTagColor(color.value)}
                      className={cn(
                        'h-6 w-6 rounded-full transition-transform hover:scale-110',
                        newTagColor === color.value && 'ring-2 ring-offset-2 ring-primary'
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                  className="flex-1 h-7 text-xs"
                >
                  {createTag.isPending ? (
                    <IconLoader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : tags.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No tags yet. Create one!
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {tags.map((tag) => {
                    const isAssigned = assignedTagIds.has(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left transition-colors',
                          isAssigned
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        )}
                      >
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 truncate">{tag.name}</span>
                        {isAssigned && (
                          <IconCheck className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="w-full h-7 text-xs"
              >
                <IconPlus className="h-3 w-3 mr-1" />
                Create New Tag
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
