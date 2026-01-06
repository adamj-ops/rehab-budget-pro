'use client'

import type { Editor } from '@tiptap/react'
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconQuote,
  IconSeparator,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconHighlight,
  IconLink,
  IconLinkOff,
} from '@tabler/icons-react'
import { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EditorToolbarProps {
  editor: Editor
  className?: string
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkOpen, setLinkOpen] = useState(false)

  const setLink = useCallback(() => {
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setLinkUrl('')
    setLinkOpen(false)
  }, [editor, linkUrl])

  const openLinkPopover = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    setLinkUrl(previousUrl || '')
    setLinkOpen(true)
  }, [editor])

  return (
    <div className={cn('flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5', className)}>
      {/* History */}
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <IconArrowBackUp className='h-4 w-4' />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <IconArrowForwardUp className='h-4 w-4' />
      </Button>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* Headings */}
      <Toggle
        size='sm'
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <IconH1 className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <IconH2 className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <IconH3 className='h-4 w-4' />
      </Toggle>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* Text formatting */}
      <Toggle
        size='sm'
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <IconBold className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <IconItalic className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <IconStrikethrough className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('code')}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <IconCode className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
      >
        <IconHighlight className='h-4 w-4' />
      </Toggle>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* Lists */}
      <Toggle
        size='sm'
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <IconList className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <IconListNumbers className='h-4 w-4' />
      </Toggle>
      <Toggle
        size='sm'
        pressed={editor.isActive('taskList')}
        onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
      >
        <IconListCheck className='h-4 w-4' />
      </Toggle>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* Block elements */}
      <Toggle
        size='sm'
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <IconQuote className='h-4 w-4' />
      </Toggle>
      <Button
        variant='ghost'
        size='icon'
        className='h-8 w-8'
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <IconSeparator className='h-4 w-4' />
      </Button>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Toggle
            size='sm'
            pressed={editor.isActive('link')}
            onPressedChange={openLinkPopover}
          >
            <IconLink className='h-4 w-4' />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className='w-80' align='start'>
          <div className='grid gap-4'>
            <div className='space-y-2'>
              <h4 className='font-medium leading-none'>Add Link</h4>
              <p className='text-sm text-muted-foreground'>
                Enter the URL for the link
              </p>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='link-url'>URL</Label>
              <Input
                id='link-url'
                placeholder='https://example.com'
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setLink()
                  }
                }}
              />
            </div>
            <div className='flex justify-end gap-2'>
              {editor.isActive('link') && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setLinkOpen(false)
                  }}
                >
                  <IconLinkOff className='mr-2 h-4 w-4' />
                  Remove
                </Button>
              )}
              <Button size='sm' onClick={setLink}>
                {editor.isActive('link') ? 'Update' : 'Add'} Link
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
