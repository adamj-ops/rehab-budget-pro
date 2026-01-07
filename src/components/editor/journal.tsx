'use client'

import { useState, useCallback } from 'react'
import { IconCalendar, IconTag, IconDotsVertical, IconTrash, IconPencil, IconPin, IconPinFilled } from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import DOMPurify from 'dompurify'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RichTextEditor } from './rich-text-editor'

export interface JournalEntry {
  id: string
  title: string
  content: string
  tags?: string[]
  isPinned?: boolean
  createdAt: Date
  updatedAt: Date
}

interface JournalNoteProps {
  entry: JournalEntry
  onUpdate?: (entry: JournalEntry) => void
  onDelete?: (id: string) => void
  onPin?: (id: string, isPinned: boolean) => void
  className?: string
  defaultExpanded?: boolean
}

export function JournalNote({
  entry,
  onUpdate,
  onDelete,
  onPin,
  className,
  defaultExpanded = false,
}: JournalNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [editedTitle, setEditedTitle] = useState(entry.title)
  const [editedContent, setEditedContent] = useState(entry.content)

  const handleSave = useCallback(() => {
    onUpdate?.({
      ...entry,
      title: editedTitle,
      content: editedContent,
      updatedAt: new Date(),
    })
    setIsEditing(false)
  }, [entry, editedTitle, editedContent, onUpdate])

  const handleCancel = useCallback(() => {
    setEditedTitle(entry.title)
    setEditedContent(entry.content)
    setIsEditing(false)
  }, [entry])

  return (
    <Card className={cn('group', className)}>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className='font-semibold'
                placeholder='Note title'
              />
            ) : (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='text-left w-full'
              >
                <h3 className='font-semibold truncate flex items-center gap-2'>
                  {entry.isPinned && <IconPinFilled className='h-4 w-4 text-primary shrink-0' />}
                  {entry.title}
                </h3>
              </button>
            )}
          </div>

          <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
            {!isEditing && (
              <>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => onPin?.(entry.id, !entry.isPinned)}
                >
                  {entry.isPinned ? (
                    <IconPinFilled className='h-4 w-4' />
                  ) : (
                    <IconPin className='h-4 w-4' />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='h-8 w-8'>
                      <IconDotsVertical className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <IconPencil className='mr-2 h-4 w-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(entry.id)}
                      className='text-destructive'
                    >
                      <IconTrash className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className='flex items-center gap-3 text-xs text-muted-foreground mt-1'>
          <span className='flex items-center gap-1'>
            <IconCalendar className='h-3 w-3' />
            {formatDistanceToNow(entry.updatedAt, { addSuffix: true })}
          </span>
          {entry.tags && entry.tags.length > 0 && (
            <div className='flex items-center gap-1'>
              <IconTag className='h-3 w-3' />
              {entry.tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='text-xs px-1.5 py-0'>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      {(isExpanded || isEditing) && (
        <CardContent className='pt-2'>
          {isEditing ? (
            <div className='space-y-4'>
              <RichTextEditor
                content={editedContent}
                onChange={setEditedContent}
                placeholder='Write your notes here...'
                minHeight='200px'
              />
              <div className='flex justify-end gap-2'>
                <Button variant='outline' size='sm' onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size='sm' onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div
              className='prose prose-sm dark:prose-invert max-w-none'
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.content) }}
            />
          )}
        </CardContent>
      )}
    </Card>
  )
}

// New note input component
interface NewNoteInputProps {
  onAdd: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  placeholder?: string
  className?: string
}

export function NewNoteInput({ onAdd, placeholder = 'Add a note...', className }: NewNoteInputProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleAdd = useCallback(() => {
    if (title.trim() || content.trim()) {
      onAdd({
        title: title.trim() || 'Untitled Note',
        content,
        tags: [],
        isPinned: false,
      })
      setTitle('')
      setContent('')
      setIsExpanded(false)
    }
  }, [title, content, onAdd])

  const handleCancel = useCallback(() => {
    setTitle('')
    setContent('')
    setIsExpanded(false)
  }, [])

  if (!isExpanded) {
    return (
      <Card
        className={cn('cursor-pointer hover:bg-muted/50 transition-colors', className)}
        onClick={() => setIsExpanded(true)}
      >
        <CardContent className='py-4'>
          <p className='text-muted-foreground'>{placeholder}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className='pt-4 space-y-4'>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Note title'
          className='font-semibold'
          autoFocus
        />
        <RichTextEditor
          content={content}
          onChange={setContent}
          placeholder='Write your notes here...'
          minHeight='150px'
        />
        <div className='flex justify-end gap-2'>
          <Button variant='outline' size='sm' onClick={handleCancel}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleAdd}>
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Journal list component
interface JournalListProps {
  entries: JournalEntry[]
  onUpdate?: (entry: JournalEntry) => void
  onDelete?: (id: string) => void
  onPin?: (id: string, isPinned: boolean) => void
  onAdd?: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  className?: string
  emptyMessage?: string
}

export function JournalList({
  entries,
  onUpdate,
  onDelete,
  onPin,
  onAdd,
  className,
  emptyMessage = 'No notes yet. Add your first note!',
}: JournalListProps) {
  // Sort entries: pinned first, then by updatedAt
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })

  return (
    <div className={cn('space-y-4', className)}>
      {onAdd && <NewNoteInput onAdd={onAdd} />}

      {sortedEntries.length === 0 ? (
        <p className='text-center text-muted-foreground py-8'>{emptyMessage}</p>
      ) : (
        sortedEntries.map((entry) => (
          <JournalNote
            key={entry.id}
            entry={entry}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onPin={onPin}
          />
        ))
      )}
    </div>
  )
}
