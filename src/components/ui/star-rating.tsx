'use client'

import * as React from 'react'
import { IconStar, IconStarFilled, IconX } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number | null
  onChange?: (value: number | null) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showClear?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showClear = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const displayValue = hoverValue ?? value ?? 0

  const handleClick = (starValue: number) => {
    if (!readonly && onChange) {
      // Click same value to toggle off
      if (value === starValue) {
        onChange(null)
      } else {
        onChange(starValue)
      }
    }
  }

  const handleClear = () => {
    if (!readonly && onChange) {
      onChange(null)
    }
  }

  const handleMouseEnter = (starValue: number) => {
    if (!readonly) {
      setHoverValue(starValue)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null)
    }
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayValue
          const StarIcon = isFilled ? IconStarFilled : IconStar

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              disabled={readonly}
              className={cn(
                'transition-colors',
                readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
                isFilled ? 'text-yellow-500' : 'text-zinc-300'
              )}
            >
              <StarIcon className={sizeClasses[size]} />
            </button>
          )
        })}
      </div>
      {showClear && !readonly && value !== null && (
        <button
          type="button"
          onClick={handleClear}
          className="text-zinc-400 hover:text-zinc-600 transition-colors ml-1"
          title="Clear rating"
        >
          <IconX className={sizeClasses[size]} />
        </button>
      )}
    </div>
  )
}
