'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { IconX } from '@tabler/icons-react'

interface TagBadgeProps {
  name: string
  color: string
  onRemove?: () => void
  size?: 'sm' | 'md'
  className?: string
}

export function TagBadge({
  name,
  color,
  onRemove,
  size = 'sm',
  className,
}: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
        borderWidth: '1px',
      }}
    >
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        )}
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity"
        >
          <IconX className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </span>
  )
}
