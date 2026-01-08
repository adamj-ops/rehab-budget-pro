'use client';

import * as React from 'react';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ValidatedInputProps extends React.ComponentProps<'input'> {
  /** Whether the field has been touched (blurred at least once) */
  isTouched?: boolean;
  /** Whether the field is currently valid */
  isValid?: boolean;
  /** Whether the field has an error */
  hasError?: boolean;
  /** Show validation icons on the right side of the input */
  showValidationIcon?: boolean;
  /** Custom icon to show when valid */
  validIcon?: React.ReactNode;
  /** Custom icon to show when invalid */
  invalidIcon?: React.ReactNode;
}

/**
 * Input component with built-in validation state visual feedback.
 * Shows colored border and optional icons based on validation state.
 */
const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      className,
      isTouched = false,
      isValid = false,
      hasError = false,
      showValidationIcon = true,
      validIcon,
      invalidIcon,
      ...props
    },
    ref
  ) => {
    // Only show validation state if field has been touched
    const showValidState = isTouched && isValid && !hasError;
    const showInvalidState = isTouched && hasError;

    return (
      <div className="relative">
        <Input
          ref={ref}
          className={cn(
            // Base styling handled by Input component
            // Additional validation state styling
            showValidState && 'border-green-500 focus-visible:ring-green-500/50 pr-10',
            showInvalidState && 'border-destructive focus-visible:ring-destructive/50 pr-10',
            className
          )}
          {...props}
        />
        {showValidationIcon && isTouched && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {showValidState && (
              validIcon || <IconCheck className="h-4 w-4 text-green-500" />
            )}
            {showInvalidState && (
              invalidIcon || <IconAlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
      </div>
    );
  }
);
ValidatedInput.displayName = 'ValidatedInput';

/**
 * Hook to manage input validation state with onBlur tracking
 */
export function useInputValidation(
  error: unknown,
  isDirty: boolean = false
) {
  const [isTouched, setIsTouched] = React.useState(false);

  const handleBlur = React.useCallback(() => {
    setIsTouched(true);
  }, []);

  const hasError = Boolean(error);
  const isValid = isDirty && !hasError;

  return {
    isTouched,
    isValid,
    hasError,
    onBlur: handleBlur,
    // Reset function for forms
    reset: () => setIsTouched(false),
  };
}

export { ValidatedInput };
