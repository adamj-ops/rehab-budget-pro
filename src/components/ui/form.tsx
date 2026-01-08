'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { IconAlertCircle, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(({ className, required, children, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-[0.8rem] text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  showIcon?: boolean;
}

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  FormMessageProps
>(({ className, children, showIcon = true, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        'text-[0.8rem] font-medium text-destructive flex items-center gap-1',
        className
      )}
      {...props}
    >
      {showIcon && <IconAlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

/**
 * Success message component for validated fields
 */
const FormSuccessMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { showIcon?: boolean }
>(({ className, children, showIcon = true, ...props }, ref) => {
  if (!children) return null;

  return (
    <p
      ref={ref}
      className={cn(
        'text-[0.8rem] font-medium text-green-600 flex items-center gap-1',
        className
      )}
      {...props}
    >
      {showIcon && <IconCheck className="h-3.5 w-3.5 flex-shrink-0" />}
      {children}
    </p>
  );
});
FormSuccessMessage.displayName = 'FormSuccessMessage';

/**
 * Warning message component for field-level warnings
 */
const FormWarningMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { showIcon?: boolean }
>(({ className, children, showIcon = true, ...props }, ref) => {
  if (!children) return null;

  return (
    <p
      ref={ref}
      className={cn(
        'text-[0.8rem] font-medium text-yellow-600 flex items-center gap-1',
        className
      )}
      {...props}
    >
      {showIcon && <IconAlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
      {children}
    </p>
  );
});
FormWarningMessage.displayName = 'FormWarningMessage';

/**
 * Character count component for text fields
 */
interface FormCharacterCountProps extends React.HTMLAttributes<HTMLSpanElement> {
  current: number;
  max: number;
}

const FormCharacterCount = React.forwardRef<
  HTMLSpanElement,
  FormCharacterCountProps
>(({ className, current, max, ...props }, ref) => {
  const isOverLimit = current > max;
  const isNearLimit = current >= max * 0.9;

  return (
    <span
      ref={ref}
      className={cn(
        'text-[0.75rem] tabular-nums',
        isOverLimit
          ? 'text-destructive font-medium'
          : isNearLimit
          ? 'text-yellow-600'
          : 'text-muted-foreground',
        className
      )}
      {...props}
    >
      {current}/{max}
    </span>
  );
});
FormCharacterCount.displayName = 'FormCharacterCount';

/**
 * Input wrapper with validation state visual feedback
 */
interface FormInputWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  showValidationIcon?: boolean;
  isValid?: boolean;
  isInvalid?: boolean;
}

const FormInputWrapper = React.forwardRef<
  HTMLDivElement,
  FormInputWrapperProps
>(({ className, children, showValidationIcon = false, isValid, isInvalid, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      {...props}
    >
      {children}
      {showValidationIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValid && <IconCheck className="h-4 w-4 text-green-600" />}
          {isInvalid && <IconAlertCircle className="h-4 w-4 text-destructive" />}
        </div>
      )}
    </div>
  );
});
FormInputWrapper.displayName = 'FormInputWrapper';

/**
 * Form error summary component - shows at top of form when there are multiple errors
 */
interface FormErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  errors: Record<string, { message?: string }>;
  title?: string;
}

const FormErrorSummary = React.forwardRef<
  HTMLDivElement,
  FormErrorSummaryProps
>(({ className, errors, title = 'Please fix the following errors:', ...props }, ref) => {
  const errorMessages = Object.entries(errors)
    .filter(([_, error]) => error?.message)
    .map(([field, error]) => ({ field, message: error.message }));

  if (errorMessages.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">{title}</p>
          <ul className="mt-2 space-y-1 text-sm text-destructive">
            {errorMessages.map(({ field, message }) => (
              <li key={field} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-destructive" />
                {message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});
FormErrorSummary.displayName = 'FormErrorSummary';

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormSuccessMessage,
  FormWarningMessage,
  FormCharacterCount,
  FormInputWrapper,
  FormErrorSummary,
  FormField,
};
