'use client';

import * as React from 'react';
import { IconInfoCircle, IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

/**
 * Types for field hint/feedback.
 */
export type FieldHintType = 'info' | 'warning' | 'success' | 'error';

interface FieldHintProps {
  /**
   * The hint message to display
   */
  children: React.ReactNode;
  /**
   * Type of hint (affects styling)
   */
  type?: FieldHintType;
  /**
   * Whether to show an icon
   */
  showIcon?: boolean;
  /**
   * Custom className
   */
  className?: string;
  /**
   * ID for accessibility (aria-describedby)
   */
  id?: string;
}

/**
 * Field hint component for displaying contextual help below form inputs.
 * 
 * Usage:
 * ```tsx
 * <Input name="email" aria-describedby="email-hint" />
 * <FieldHint id="email-hint" type="info">
 *   We'll never share your email
 * </FieldHint>
 * ```
 */
export function FieldHint({
  children,
  type = 'info',
  showIcon = true,
  className,
  id,
}: FieldHintProps) {
  const Icon = {
    info: IconInfoCircle,
    warning: IconAlertTriangle,
    success: IconCheck,
    error: IconX,
  }[type];

  return (
    <p
      id={id}
      className={cn(
        'text-xs mt-1.5 flex items-start gap-1.5',
        type === 'info' && 'text-muted-foreground',
        type === 'warning' && 'text-yellow-600 dark:text-yellow-500',
        type === 'success' && 'text-green-600 dark:text-green-500',
        type === 'error' && 'text-red-600 dark:text-red-500',
        className
      )}
      role={type === 'error' ? 'alert' : undefined}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
      <span>{children}</span>
    </p>
  );
}

/**
 * Props for the FieldValidationIndicator component.
 */
interface FieldValidationIndicatorProps {
  /**
   * Whether the field has an error
   */
  hasError?: boolean;
  /**
   * Whether the field is valid (passed validation)
   */
  isValid?: boolean;
  /**
   * Whether the field has been touched/blurred
   */
  isTouched?: boolean;
  /**
   * Whether to show validation state
   */
  showValidation?: boolean;
  /**
   * Position of the indicator
   */
  position?: 'left' | 'right';
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Inline validation indicator (check/x icon) for form fields.
 * Shows validation state inside or adjacent to input fields.
 */
export function FieldValidationIndicator({
  hasError,
  isValid,
  isTouched,
  showValidation = true,
  position = 'right',
  className,
}: FieldValidationIndicatorProps) {
  // Only show if touched and validation is enabled
  if (!showValidation || !isTouched) {
    return null;
  }

  // Determine which icon to show
  if (hasError) {
    return (
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-red-500',
          position === 'right' ? 'right-3' : 'left-3',
          className
        )}
      >
        <IconX className="h-4 w-4" />
      </div>
    );
  }

  if (isValid) {
    return (
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-green-500',
          position === 'right' ? 'right-3' : 'left-3',
          className
        )}
      >
        <IconCheck className="h-4 w-4" />
      </div>
    );
  }

  return null;
}

/**
 * Input wrapper that adds validation indicator positioning.
 */
interface ValidatedInputWrapperProps {
  children: React.ReactNode;
  hasError?: boolean;
  isValid?: boolean;
  isTouched?: boolean;
  showValidation?: boolean;
  className?: string;
}

export function ValidatedInputWrapper({
  children,
  hasError,
  isValid,
  isTouched,
  showValidation = true,
  className,
}: ValidatedInputWrapperProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <FieldValidationIndicator
        hasError={hasError}
        isValid={isValid}
        isTouched={isTouched}
        showValidation={showValidation}
      />
    </div>
  );
}

/**
 * Character counter for text inputs/textareas.
 */
interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const isNearLimit = current > max * 0.8;
  const isOverLimit = current > max;

  return (
    <span
      className={cn(
        'text-xs tabular-nums',
        isOverLimit && 'text-red-500 font-medium',
        isNearLimit && !isOverLimit && 'text-yellow-600',
        !isNearLimit && 'text-muted-foreground',
        className
      )}
    >
      {current.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
}

/**
 * Required field indicator asterisk.
 */
export function RequiredIndicator({ className }: { className?: string }) {
  return (
    <span
      className={cn('text-red-500 ml-0.5', className)}
      aria-hidden="true"
    >
      *
    </span>
  );
}

/**
 * Field label with optional required indicator.
 */
interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
}

export function FieldLabel({ children, required, htmlFor, className }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('text-sm font-medium text-foreground', className)}
    >
      {children}
      {required && <RequiredIndicator />}
    </label>
  );
}

/**
 * Container for a form field with label, input, hint, and error.
 */
interface FormFieldContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function FormFieldContainer({ children, className }: FormFieldContainerProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {children}
    </div>
  );
}
