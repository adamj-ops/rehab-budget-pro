'use client';

import * as React from 'react';
import { IconAlertTriangle, IconInfoCircle, IconX, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Error/warning item for the validation summary.
 */
export interface ValidationItem {
  path: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

interface ValidationSummaryProps {
  /**
   * Validation errors (blocking submission)
   */
  errors?: ValidationItem[];
  /**
   * Validation warnings (non-blocking, informational)
   */
  warnings?: ValidationItem[];
  /**
   * Callback when user clicks on an item to scroll to field
   */
  onItemClick?: (path: string) => void;
  /**
   * Whether the summary is collapsible
   */
  collapsible?: boolean;
  /**
   * Initial collapsed state (only used if collapsible is true)
   */
  defaultCollapsed?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Whether to show the summary when there are no issues
   */
  showWhenEmpty?: boolean;
}

/**
 * Validation summary component that displays form errors and warnings.
 * 
 * Features:
 * - Shows error count and warning count
 * - Clickable items to scroll to the affected field
 * - Collapsible for long lists
 * - Distinct styling for errors vs warnings
 */
export function ValidationSummary({
  errors = [],
  warnings = [],
  onItemClick,
  collapsible = false,
  defaultCollapsed = false,
  className,
  showWhenEmpty = false,
}: ValidationSummaryProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const hasIssues = hasErrors || hasWarnings;

  // Don't render if no issues and showWhenEmpty is false
  if (!hasIssues && !showWhenEmpty) {
    return null;
  }

  const totalCount = errors.length + warnings.length;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        hasErrors && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30',
        !hasErrors && hasWarnings && 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30',
        !hasIssues && 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <IconAlertTriangle className="h-5 w-5 text-red-500" />
          ) : hasWarnings ? (
            <IconInfoCircle className="h-5 w-5 text-yellow-600" />
          ) : (
            <IconInfoCircle className="h-5 w-5 text-green-600" />
          )}
          
          <span className={cn(
            'font-medium',
            hasErrors && 'text-red-700 dark:text-red-400',
            !hasErrors && hasWarnings && 'text-yellow-700 dark:text-yellow-400',
            !hasIssues && 'text-green-700 dark:text-green-400'
          )}>
            {!hasIssues ? (
              'All fields validated'
            ) : (
              <>
                {errors.length > 0 && (
                  <span>{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
                )}
                {errors.length > 0 && warnings.length > 0 && ' and '}
                {warnings.length > 0 && (
                  <span>{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>
                )}
              </>
            )}
          </span>
        </div>

        {collapsible && hasIssues && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? (
              <IconChevronDown className="h-4 w-4" />
            ) : (
              <IconChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Items list */}
      {hasIssues && !isCollapsed && (
        <ul className="mt-3 space-y-2">
          {errors.map((error, index) => (
            <ValidationSummaryItem
              key={`error-${error.path}-${index}`}
              item={{ ...error, type: 'error' }}
              onClick={onItemClick}
            />
          ))}
          {warnings.map((warning, index) => (
            <ValidationSummaryItem
              key={`warning-${warning.path}-${index}`}
              item={{ ...warning, type: warning.type || 'warning' }}
              onClick={onItemClick}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Individual validation item in the summary.
 */
interface ValidationSummaryItemProps {
  item: ValidationItem;
  onClick?: (path: string) => void;
}

function ValidationSummaryItem({ item, onClick }: ValidationSummaryItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(item.path);
    } else {
      // Default behavior: try to scroll to and focus the field
      const field = document.querySelector(`[name="${item.path}"], #${item.path}`);
      if (field) {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (field instanceof HTMLElement) {
          field.focus();
        }
      }
    }
  };

  return (
    <li
      className={cn(
        'flex items-start gap-2 text-sm cursor-pointer rounded px-2 py-1 -mx-2 transition-colors',
        item.type === 'error' && 'text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30',
        item.type === 'warning' && 'text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        item.type === 'info' && 'text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <span className="font-medium shrink-0">
        {formatFieldLabel(item.path)}:
      </span>
      <span>{item.message}</span>
    </li>
  );
}

/**
 * Convert a field path to a human-readable label.
 */
function formatFieldLabel(path: string): string {
  // Handle nested paths like "address.city"
  const lastPart = path.split('.').pop() || path;
  
  // Convert snake_case or camelCase to Title Case
  return lastPart
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Hook to scroll to and focus a form field by name/path.
 */
export function useScrollToField() {
  return React.useCallback((path: string) => {
    // Try multiple selectors
    const selectors = [
      `[name="${path}"]`,
      `#${path}`,
      `[data-field="${path}"]`,
    ];

    for (const selector of selectors) {
      try {
        const field = document.querySelector(selector);
        if (field) {
          field.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            if (field instanceof HTMLElement) {
              field.focus();
            }
          }, 300);
          return true;
        }
      } catch {
        // Invalid selector, continue to next
      }
    }
    return false;
  }, []);
}
