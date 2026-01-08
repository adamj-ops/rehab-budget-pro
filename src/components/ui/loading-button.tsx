'use client';

import * as React from 'react';
import { IconLoader2 } from '@tabler/icons-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

interface LoadingButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  asChild?: boolean;
}

/**
 * Button with built-in loading state
 * Shows a spinner and optional loading text when isLoading is true
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    isLoading = false, 
    loadingText,
    disabled,
    className,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'relative',
          isLoading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </span>
        )}
        <span className={cn(isLoading && !loadingText && 'opacity-0')}>
          {isLoading && loadingText ? null : children}
        </span>
      </Button>
    );
  }
);
LoadingButton.displayName = 'LoadingButton';

/**
 * Overlay to show on forms/cards when a mutation is pending
 */
function LoadingOverlay({ 
  message = 'Saving...', 
  className 
}: { 
  message?: string; 
  className?: string;
}) {
  return (
    <div className={cn(
      'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg',
      className
    )}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="h-4 w-4 animate-spin" />
        {message}
      </div>
    </div>
  );
}

/**
 * Spinner component for inline loading states
 */
function Spinner({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-6 w-6',
  };
  
  return (
    <IconLoader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
}

/**
 * Inline loading indicator with text
 */
function InlineLoading({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Spinner size="sm" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Row loading state - shows skeleton effect over a table row
 */
function RowLoading({ columns = 9, className }: { columns?: number; className?: string }) {
  return (
    <tr className={cn('relative', className)}>
      <td colSpan={columns} className="p-0">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
          <Spinner />
        </div>
      </td>
    </tr>
  );
}

export { LoadingButton, LoadingOverlay, Spinner, InlineLoading, RowLoading };
