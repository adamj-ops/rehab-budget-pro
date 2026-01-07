import { z } from 'zod';
import type { Project } from '@/types';

// Enum schemas
export const projectStatusSchema = z.enum([
  'lead',
  'analyzing',
  'under_contract',
  'in_rehab',
  'listed',
  'sold',
  'dead',
]);

export const propertyTypeSchema = z.enum([
  'sfh',
  'duplex',
  'triplex',
  'fourplex',
  'townhouse',
  'condo',
]);

// Project form schema - no defaults to avoid type inference issues
export const projectFormSchema = z.object({
  // Property Info
  name: z.string().min(1, 'Property name is required'),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  beds: z.number().nullable(),
  baths: z.number().nullable(),
  sqft: z.number().nullable(),
  year_built: z.number().nullable(),
  property_type: propertyTypeSchema,

  // Financials
  arv: z.number().nullable(),
  purchase_price: z.number().nullable(),
  closing_costs: z.number(),
  holding_costs_monthly: z.number(),
  hold_months: z.number(),
  selling_cost_percent: z.number(),
  contingency_percent: z.number(),

  // Status & Dates
  status: projectStatusSchema,
  contract_date: z.date().nullable(),
  close_date: z.date().nullable(),
  rehab_start_date: z.date().nullable(),
  target_complete_date: z.date().nullable(),
  list_date: z.date().nullable(),
  sale_date: z.date().nullable(),

  // Meta
  notes: z.string().nullable(),
});

// Type inference
export type ProjectFormValues = z.infer<typeof projectFormSchema>;

// Default values for form
export const projectFormDefaults: ProjectFormValues = {
  name: '',
  address: null,
  city: null,
  state: 'MN',
  zip: null,
  beds: null,
  baths: null,
  sqft: null,
  year_built: null,
  property_type: 'sfh',
  arv: null,
  purchase_price: null,
  closing_costs: 0,
  holding_costs_monthly: 0,
  hold_months: 4,
  selling_cost_percent: 8,
  contingency_percent: 10,
  status: 'lead',
  contract_date: null,
  close_date: null,
  rehab_start_date: null,
  target_complete_date: null,
  list_date: null,
  sale_date: null,
  notes: null,
};

// Property type options for select
export const propertyTypeOptions = [
  { value: 'sfh', label: 'Single Family Home' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'triplex', label: 'Triplex' },
  { value: 'fourplex', label: 'Fourplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condo', label: 'Condo' },
] as const;

// Project status options for select
export const projectStatusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'under_contract', label: 'Under Contract' },
  { value: 'in_rehab', label: 'In Rehab' },
  { value: 'listed', label: 'Listed' },
  { value: 'sold', label: 'Sold' },
  { value: 'dead', label: 'Dead' },
] as const;

// Helper to transform form values for database submission
export function transformFormToDatabase(values: ProjectFormValues) {
  return {
    ...values,
    // Convert dates to ISO strings for database
    contract_date: values.contract_date?.toISOString().split('T')[0] ?? null,
    close_date: values.close_date?.toISOString().split('T')[0] ?? null,
    rehab_start_date: values.rehab_start_date?.toISOString().split('T')[0] ?? null,
    target_complete_date: values.target_complete_date?.toISOString().split('T')[0] ?? null,
    list_date: values.list_date?.toISOString().split('T')[0] ?? null,
    sale_date: values.sale_date?.toISOString().split('T')[0] ?? null,
  };
}

// Helper to transform database values to form values
export function transformDatabaseToForm(project: Project): Partial<ProjectFormValues> {
  return {
    name: project.name,
    address: project.address,
    city: project.city,
    state: project.state,
    zip: project.zip,
    beds: project.beds,
    baths: project.baths,
    sqft: project.sqft,
    year_built: project.year_built,
    property_type: project.property_type,
    arv: project.arv,
    purchase_price: project.purchase_price,
    closing_costs: project.closing_costs,
    holding_costs_monthly: project.holding_costs_monthly,
    hold_months: project.hold_months,
    selling_cost_percent: project.selling_cost_percent,
    contingency_percent: project.contingency_percent,
    status: project.status,
    contract_date: project.contract_date ? new Date(project.contract_date) : null,
    close_date: project.close_date ? new Date(project.close_date) : null,
    rehab_start_date: project.rehab_start_date ? new Date(project.rehab_start_date) : null,
    target_complete_date: project.target_complete_date ? new Date(project.target_complete_date) : null,
    list_date: project.list_date ? new Date(project.list_date) : null,
    sale_date: project.sale_date ? new Date(project.sale_date) : null,
    notes: project.notes,
  };
}
