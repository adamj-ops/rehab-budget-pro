'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconGripVertical } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface SortableBudgetRowProps {
  id: string
  children: React.ReactNode
  isSelected?: boolean
  disabled?: boolean
}

export function SortableBudgetRow({
  id,
  children,
  isSelected = false,
  disabled = false,
}: SortableBudgetRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-t hover:bg-muted/50 group',
        isSelected && 'bg-primary/5',
        isDragging && 'opacity-50 bg-muted shadow-lg z-50'
      )}
      {...attributes}
    >
      {/* Drag Handle Cell */}
      <td className="p-1 w-8">
        {!disabled && (
          <button
            type="button"
            {...listeners}
            className={cn(
              'p-1 rounded cursor-grab active:cursor-grabbing',
              'text-muted-foreground/50 hover:text-muted-foreground',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              isDragging && 'opacity-100'
            )}
            title="Drag to reorder"
          >
            <IconGripVertical className="h-4 w-4" />
          </button>
        )}
      </td>
      {children}
    </tr>
  )
}

// Export drag handle for use in regular rows if needed
export function DragHandle({
  listeners,
  isDragging,
}: {
  listeners?: ReturnType<typeof useSortable>['listeners']
  isDragging?: boolean
}) {
  return (
    <button
      type="button"
      {...listeners}
      className={cn(
        'p-1 rounded cursor-grab active:cursor-grabbing',
        'text-muted-foreground/50 hover:text-muted-foreground',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        isDragging && 'opacity-100'
      )}
      title="Drag to reorder"
    >
      <IconGripVertical className="h-4 w-4" />
    </button>
  )
}
