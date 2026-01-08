'use client'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { useCallback, useEffect } from 'react'

import { cn } from '@/lib/utils'
import { EditorToolbar } from './editor-toolbar'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  onBlur?: () => void
  placeholder?: string
  editable?: boolean
  className?: string
  toolbarClassName?: string
  minHeight?: string
  maxHeight?: string
  autofocus?: boolean
}

export function RichTextEditor({
  content = '',
  onChange,
  onBlur,
  placeholder = 'Start writing...',
  editable = true,
  className,
  toolbarClassName,
  minHeight = '150px',
  maxHeight = '400px',
  autofocus = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    // Prevent SSR hydration issues
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 cursor-pointer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
    ],
    content,
    editable,
    autofocus,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'prose-headings:font-semibold prose-headings:tracking-tight',
          'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
          'prose-p:leading-relaxed prose-p:my-2',
          'prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
          'prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm',
          'prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg',
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:pl-0',
          '[&_ul[data-type="taskList"]_li]:flex [&_ul[data-type="taskList"]_li]:items-start [&_ul[data-type="taskList"]_li]:gap-2',
          '[&_ul[data-type="taskList"]_input]:mt-1'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    onBlur: () => {
      onBlur?.()
    },
  })

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable)
    }
  }, [editable, editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      {editable && (
        <EditorToolbar editor={editor} className={toolbarClassName} />
      )}
      <div
        className='px-4 py-3 overflow-y-auto'
        style={{ minHeight, maxHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

// Hook to get editor instance for external control
export function useRichTextEditor(options?: {
  content?: string
  placeholder?: string
  editable?: boolean
  onChange?: (content: string) => void
}) {
  const editor = useEditor({
    // Prevent SSR hydration issues
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: options?.placeholder || 'Start writing...',
      }),
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight,
      Typography,
    ],
    content: options?.content || '',
    editable: options?.editable ?? true,
    onUpdate: ({ editor }) => {
      options?.onChange?.(editor.getHTML())
    },
  })

  return editor
}
