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
  IconChevronDown,
  IconSettings,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { usePlacesAutocomplete } from '@/hooks/use-places-autocomplete';
import { DealCalculator } from '@/components/project/deal-calculator';
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
  const [showAdvanced, setShowAdvanced] = React.useState(
    mode === 'edit' // Show advanced by default in edit mode
  );
  const [timelineOpen, setTimelineOpen] = React.useState(mode === 'edit');
  const [notesOpen, setNotesOpen] = React.useState(
    mode === 'edit' && !!defaultValues?.notes
  );

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      ...projectFormDefaults,
      ...defaultValues,
    },
  });

  // Watch values for live calculations
  const watchedValues = form.watch([
    'arv',
    'purchase_price',
    'closing_costs',
    'holding_costs_monthly',
    'hold_months',
    'selling_cost_percent',
    'contingency_percent',
  ]);

  const [arv, purchasePrice, closingCosts, holdingCostsMonthly, holdMonths, sellingCostPercent, contingencyPercent] = watchedValues;

  // Google Places Autocomplete integration
  usePlacesAutocomplete({
    inputRef: addressInputRef,
    onPlaceSelected: (place) => {
      form.setValue('address', place.address, { shouldValidate: true });
      form.setValue('city', place.city);
      form.setValue('state', place.state);
      form.setValue('zip', place.zip);
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
      if (!currentName || currentName === form.getValues('address')) {
        form.setValue('name', watchedAddress);
      }
    }
  }, [watchedAddress, mode, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid lg:grid-cols-[1fr,340px] gap-6">
          {/* Main Form Column */}
          <div className="space-y-6">
            {/* Essential Info Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <IconHome className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address - Most Important Field */}
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
                          className="text-lg"
                          autoFocus={mode === 'create'}
                        />
                      </FormControl>
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

                {/* Property Name - Hidden for create, shown for edit */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className={cn(mode === 'create' && 'hidden')}>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Property name or nickname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quick Property Info Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <FormField
                    control={form.control}
                    name="property_type"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                            placeholder="1500"
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

            {/* Deal Numbers Card - The Key Inputs */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Deal Numbers
                </CardTitle>
                <CardDescription>
                  The two most important numbers for your analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ARV and Purchase Price - Side by Side, Prominent */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Purchase Price
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="150,000"
                            className="tabular-nums text-lg h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="arv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          After Repair Value (ARV)
                        </FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="250,000"
                            className="tabular-nums text-lg h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Mobile Deal Calculator */}
                <div className="lg:hidden">
                  <DealCalculator
                    arv={arv}
                    purchasePrice={purchasePrice}
                    closingCosts={closingCosts}
                    holdingCostsMonthly={holdingCostsMonthly}
                    holdMonths={holdMonths}
                    sellingCostPercent={sellingCostPercent}
                    contingencyPercent={contingencyPercent}
                  />
                </div>

                {/* Project Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue />
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

                {/* Advanced Cost Assumptions */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="gap-2 text-muted-foreground hover:text-foreground p-0 h-auto"
                    >
                      <IconSettings className="h-4 w-4" />
                      Cost Assumptions
                      <IconChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          showAdvanced && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
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

                      <FormField
                        control={form.control}
                        name="holding_costs_monthly"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Holding</FormLabel>
                            <FormControl>
                              <CurrencyInput
                                value={field.value}
                                onChange={(v) => field.onChange(v ?? 0)}
                                placeholder="1,500"
                                className="tabular-nums"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Taxes, insurance, utilities
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hold_months"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hold Period</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  max="60"
                                  className="tabular-nums pr-16"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) =>
                                    field.onChange(
                                      e.target.value ? parseFloat(e.target.value) : 4
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  months
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                            <FormDescription className="text-xs">
                              Agent, title, closing
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                            <FormDescription className="text-xs">
                              Budget buffer
                            </FormDescription>
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
                                  field.onChange(
                                    e.target.value ? parseInt(e.target.value, 10) : null
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Timeline - Collapsible */}
            <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <IconCalendar className="h-5 w-5" />
                        Project Timeline
                      </CardTitle>
                      <IconChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform',
                          timelineOpen && 'rotate-180'
                        )}
                      />
                    </div>
                    {!timelineOpen && (
                      <CardDescription>
                        Click to add important dates
                      </CardDescription>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="contract_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Contract</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select"
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
                            <FormLabel>Close</FormLabel>
                            <FormControl>
                              <DatePicker
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select"
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
                                placeholder="Select"
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
                                placeholder="Select"
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
                                placeholder="Select"
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
                                placeholder="Select"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Notes - Collapsible */}
            <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <IconNotes className="h-5 w-5" />
                        Notes
                      </CardTitle>
                      <IconChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform',
                          notesOpen && 'rotate-180'
                        )}
                      />
                    </div>
                    {!notesOpen && (
                      <CardDescription>Click to add notes</CardDescription>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes about this project..."
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
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-4">
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
              <Button type="submit" disabled={isSubmitting} size="lg">
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
          </div>

          {/* Sidebar - Deal Calculator (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <DealCalculator
                arv={arv}
                purchasePrice={purchasePrice}
                closingCosts={closingCosts}
                holdingCostsMonthly={holdingCostsMonthly}
                holdMonths={holdMonths}
                sellingCostPercent={sellingCostPercent}
                contingencyPercent={contingencyPercent}
              />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
