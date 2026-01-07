'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconHome,
  IconCurrencyDollar,
  IconCalendar,
  IconNotes,
  IconLoader2,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PercentInput } from '@/components/ui/percent-input';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import {
  projectFormSchema,
  projectFormDefaults,
  propertyTypeOptions,
  projectStatusOptions,
  type ProjectFormValues,
} from '@/lib/validations/project';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  mode?: 'create' | 'edit';
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save Project',
  mode = 'create',
}: ProjectFormProps) {
  const addressInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...projectFormDefaults,
      ...defaultValues,
    },
  });

  // Google Places Autocomplete integration
  usePlacesAutocomplete({
    inputRef: addressInputRef,
    onPlaceSelected: (place) => {
      form.setValue('address', place.address, { shouldValidate: true });
      form.setValue('city', place.city);
      form.setValue('state', place.state);
      form.setValue('zip', place.zip);
      // Also set name from address if creating and name is empty
      if (mode === 'create' && !form.getValues('name')) {
        form.setValue('name', place.address);
      }
    },
  });

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Watch address to sync with name for new projects
  const watchedAddress = form.watch('address');
  React.useEffect(() => {
    if (mode === 'create' && watchedAddress) {
      const currentName = form.getValues('name');
      // Only auto-update name if it's empty or matches the previous address
      if (!currentName || currentName === form.getValues('address')) {
        form.setValue('name', watchedAddress);
      }
    }
  }, [watchedAddress, mode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Property Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHome className="h-5 w-5" />
              Property Information
            </CardTitle>
            <CardDescription>
              Basic details about the property location and specifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address with Autocomplete */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={addressInputRef}
                      value={field.value ?? ''}
                      placeholder="Start typing an address..."
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Start typing and select from the dropdown. City, state, and ZIP will auto-fill.
                  </FormDescription>
                  {/* Show auto-filled location */}
                  {(form.watch('city') || form.watch('state') || form.watch('zip')) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-green-600">✓</span>
                      {form.watch('city') && <span>{form.watch('city')}</span>}
                      {form.watch('state') && <span>, {form.watch('state')}</span>}
                      {form.watch('zip') && <span> {form.watch('zip')}</span>}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Name (auto-populated from address) */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className={cn(mode === 'create' && 'hidden')}>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Property name or nickname"
                    />
                  </FormControl>
                  <FormDescription>
                    Display name for this project (defaults to address)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Type */}
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {propertyTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Property Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="beds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beds</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="99"
                        placeholder="3"
                        className="tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="baths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Baths</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="99"
                        placeholder="2"
                        className="tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sqft"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sqft</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100000"
                        placeholder="1,500"
                        className="tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year_built"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1800"
                        max={new Date().getFullYear() + 1}
                        placeholder="1950"
                        className="tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deal Financials Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="h-5 w-5" />
              Deal Financials
            </CardTitle>
            <CardDescription>
              Purchase price, ARV, and cost assumptions for deal analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Price */}
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="150,000"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ARV */}
              <FormField
                control={form.control}
                name="arv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>After Repair Value (ARV)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="250,000"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Closing Costs */}
              <FormField
                control={form.control}
                name="closing_costs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Costs</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder="3,000"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monthly Holding Costs */}
              <FormField
                control={form.control}
                name="holding_costs_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Holding Costs</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder="1,500"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormDescription>
                      Taxes, insurance, utilities, loan payments
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hold Months */}
              <FormField
                control={form.control}
                name="hold_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hold Period (Months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="60"
                        placeholder="4"
                        className="tabular-nums"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : 4)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selling Cost Percent */}
              <FormField
                control={form.control}
                name="selling_cost_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Costs</FormLabel>
                    <FormControl>
                      <PercentInput
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 8)}
                        placeholder="8"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormDescription>
                      Agent commissions, title, closing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contingency Percent */}
              <FormField
                control={form.control}
                name="contingency_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contingency</FormLabel>
                    <FormControl>
                      <PercentInput
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 10)}
                        placeholder="10"
                        className="tabular-nums"
                      />
                    </FormControl>
                    <FormDescription>
                      Buffer for unexpected costs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Timeline Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              Project Timeline
            </CardTitle>
            <CardDescription>
              Key dates for tracking project progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contract_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Contract Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="close_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Close Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rehab_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Rehab Start</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_complete_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Complete</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="list_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>List Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Sale Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconNotes className="h-5 w-5" />
              Notes
            </CardTitle>
            <CardDescription>
              Additional information about this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes, observations, or reminders about this project..."
                      className="min-h-[100px] resize-y"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
