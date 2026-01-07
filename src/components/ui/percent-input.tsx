'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface PercentInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  maxDecimals?: number;
}

const PercentInput = React.forwardRef<HTMLInputElement, PercentInputProps>(
  ({ className, value, onChange, maxDecimals = 2, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Format number to display string
    const formatPercent = (num: number | null | undefined): string => {
      if (num === null || num === undefined || isNaN(num)) return '';
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      });
    };

    // Parse display string to number
    const parseValue = (str: string): number | null => {
      if (!str) return null;
      const cleaned = str.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Sync external value changes to display
    React.useEffect(() => {
      setDisplayValue(formatPercent(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Only allow valid number patterns
      const validPattern = /^[0-9]*\.?[0-9]*$/;

      if (!validPattern.test(rawValue) && rawValue !== '') {
        return;
      }

      setDisplayValue(rawValue);

      const numericValue = parseValue(rawValue);
      // Clamp to 0-100 range
      if (numericValue !== null && numericValue > 100) {
        onChange(100);
      } else {
        onChange(numericValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Format the value on blur
      setDisplayValue(formatPercent(value));
      props.onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Show raw number on focus for easier editing
      if (value !== null && value !== undefined) {
        setDisplayValue(value.toString());
      }
      // Select all text
      e.target.select();
      props.onFocus?.(e);
    };

    return (
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-7 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          %
        </span>
      </div>
    );
  }
);
PercentInput.displayName = 'PercentInput';

export { PercentInput };
