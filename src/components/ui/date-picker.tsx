'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { IconCalendar } from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A button-triggered popover that lets the user pick a single date.
 *
 * The trigger button displays a calendar icon and either the formatted selected date or a placeholder.
 *
 * @param value - The currently selected Date, or `null` if none is selected.
 * @param onChange - Callback invoked with the selected `Date` when a date is chosen, or `undefined` if the selection is cleared.
 * @param placeholder - Text to show in the trigger when no date is selected. Defaults to `"Pick a date"`.
 * @param disabled - If `true`, disables interaction with the trigger button.
 * @param className - Additional CSS classes applied to the trigger button.
 * @returns The DatePicker React element.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}