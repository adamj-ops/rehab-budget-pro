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

// ============================================================================
// Helper validation functions
// ============================================================================

/**
 * Validate ZIP code format (5 or 9 digits with dash).
 */
const zipCodeSchema = z.string()
  .transform((val) => val.trim())
  .pipe(
    z.string()
      .regex(/^\d{5}(-\d{4})?$/, {
        message: 'ZIP code must be 5 digits (e.g., 55401) or 9 digits with dash (55401-1234)',
      })
  )
  .nullable()
  .or(z.literal(''));

/**
 * State abbreviation schema - auto-uppercase and validate.
 */
const stateSchema = z.string()
  .transform((val) => val.trim().toUpperCase())
  .pipe(
    z.string()
      .length(2, 'State must be a 2-letter abbreviation (e.g., MN, CA, TX)')
      .regex(/^[A-Z]{2}$/, 'State must be letters only (e.g., MN)')
  )
  .nullable()
  .or(z.literal(''));

/**
 * Currency amount schema with contextual error messages.
 */
function currencySchema(fieldName: string, options: { max?: number; required?: boolean } = {}) {
  const { max = 100000000, required = false } = options;
  
  let schema = z.number()
    .min(0, `${fieldName} cannot be negative`)
    .max(max, `${fieldName} cannot exceed $${max.toLocaleString()}`);
  
  if (required) {
    return schema;
  }
  return schema.nullable();
}

/**
 * Percentage schema with contextual error messages.
 */
function percentSchema(fieldName: string, options: { max?: number; min?: number } = {}) {
  const { max = 100, min = 0 } = options;
  
  return z.number()
    .min(min, `${fieldName} cannot be less than ${min}%`)
    .max(max, `${fieldName} cannot exceed ${max}%`);
}

// ============================================================================
// Main Project Form Schema
// ============================================================================

// Project form schema with improved error messages and cross-field validation
export const projectFormSchema = z.object({
  // Property Info
  name: z.string()
    .trim()
    .min(1, 'Property name is required - typically the street address')
    .max(200, 'Property name cannot exceed 200 characters'),
  address: z.string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters')
    .nullable(),
  city: z.string()
    .trim()
    .max(100, 'City name cannot exceed 100 characters')
    .nullable(),
  state: stateSchema,
  zip: zipCodeSchema,
  beds: z.number()
    .int('Bedrooms must be a whole number')
    .min(0, 'Bedrooms cannot be negative')
    .max(50, 'Bedrooms seems too high - max is 50')
    .nullable(),
  baths: z.number()
    .min(0, 'Bathrooms cannot be negative')
    .max(50, 'Bathrooms seems too high - max is 50')
    .multipleOf(0.5, 'Bathrooms should be in increments of 0.5 (e.g., 1, 1.5, 2)')
    .nullable(),
  sqft: z.number()
    .int('Square footage must be a whole number')
    .min(0, 'Square footage cannot be negative')
    .max(100000, 'Square footage cannot exceed 100,000')
    .nullable(),
  year_built: z.number()
    .int('Year built must be a whole number')
    .min(1800, 'Year built must be after 1800')
    .max(new Date().getFullYear() + 1, `Year built cannot be in the future`)
    .nullable(),
  property_type: propertyTypeSchema,

  // Financials - with contextual error messages
  arv: currencySchema('ARV (After Repair Value)'),
  purchase_price: currencySchema('Purchase price'),
  closing_costs: z.number()
    .min(0, 'Closing costs cannot be negative')
    .max(1000000, 'Closing costs cannot exceed $1,000,000'),
  holding_costs_monthly: z.number()
    .min(0, 'Monthly holding costs cannot be negative')
    .max(100000, 'Monthly holding costs cannot exceed $100,000'),
  hold_months: z.number()
    .int('Hold months must be a whole number')
    .min(0, 'Hold months cannot be negative')
    .max(60, 'Hold months cannot exceed 60 (5 years)'),
  selling_cost_percent: percentSchema('Selling cost percentage', { max: 20 }),
  contingency_percent: percentSchema('Contingency percentage', { max: 50 }),

  // Status & Dates
  status: projectStatusSchema,
  contract_date: z.date().nullable(),
  close_date: z.date().nullable(),
  rehab_start_date: z.date().nullable(),
  target_complete_date: z.date().nullable(),
  list_date: z.date().nullable(),
  sale_date: z.date().nullable(),

  // Meta
  notes: z.string()
    .max(10000, 'Notes cannot exceed 10,000 characters')
    .nullable(),
})
// Cross-field validations
.refine(
  (data) => {
    // Close date should be after contract date
    if (data.contract_date && data.close_date && data.close_date < data.contract_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Close date must be after contract date',
    path: ['close_date'],
  }
)
.refine(
  (data) => {
    // Rehab start should be after close date
    if (data.close_date && data.rehab_start_date && data.rehab_start_date < data.close_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Rehab start date should be on or after close date',
    path: ['rehab_start_date'],
  }
)
.refine(
  (data) => {
    // Target complete should be after rehab start
    if (data.rehab_start_date && data.target_complete_date && data.target_complete_date < data.rehab_start_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Target completion date must be after rehab start date',
    path: ['target_complete_date'],
  }
)
.refine(
  (data) => {
    // List date should be after rehab start
    if (data.rehab_start_date && data.list_date && data.list_date < data.rehab_start_date) {
      return false;
    }
    return true;
  },
  {
    message: 'List date should be after rehab starts',
    path: ['list_date'],
  }
)
.refine(
  (data) => {
    // Sale date should be after list date
    if (data.list_date && data.sale_date && data.sale_date < data.list_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Sale date must be after list date',
    path: ['sale_date'],
  }
);

// ============================================================================
// Validation Warnings (non-blocking)
// ============================================================================

/**
 * Type for validation warnings (distinct from errors).
 * Warnings don't prevent form submission but inform the user.
 */
export interface ValidationWarning {
  path: string;
  message: string;
  severity: 'warning' | 'info';
}

/**
 * Check project form values for potential issues (warnings, not errors).
 * Returns array of warnings that should be shown to the user.
 */
export function getProjectFormWarnings(values: ProjectFormValues): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // ARV vs Purchase Price check
  if (values.arv && values.purchase_price) {
    const ratio = values.arv / values.purchase_price;
    
    if (ratio < 1) {
      warnings.push({
        path: 'arv',
        message: 'ARV is less than purchase price - this deal may not be profitable',
        severity: 'warning',
      });
    } else if (ratio < 1.1) {
      warnings.push({
        path: 'arv',
        message: 'ARV is less than 10% above purchase price - margins may be thin',
        severity: 'info',
      });
    }
  }

  // Holding costs check
  if (values.holding_costs_monthly && values.hold_months) {
    const totalHolding = values.holding_costs_monthly * values.hold_months;
    if (values.arv && totalHolding > values.arv * 0.1) {
      warnings.push({
        path: 'holding_costs_monthly',
        message: 'Total holding costs exceed 10% of ARV - consider reducing hold time',
        severity: 'warning',
      });
    }
  }

  // Old construction check
  if (values.year_built && values.year_built < 1950) {
    warnings.push({
      path: 'year_built',
      message: 'Pre-1950 construction may have lead paint, asbestos, or other considerations',
      severity: 'info',
    });
  }

  // Large property check
  if (values.sqft && values.sqft > 5000) {
    warnings.push({
      path: 'sqft',
      message: 'Large property (5000+ sqft) - rehab costs may be higher than typical',
      severity: 'info',
    });
  }

  // Contingency too low
  if (values.contingency_percent < 5 && values.status !== 'sold') {
    warnings.push({
      path: 'contingency_percent',
      message: 'Contingency below 5% is risky - unexpected costs are common in rehabs',
      severity: 'warning',
    });
  }

  // Long hold period
  if (values.hold_months > 12) {
    warnings.push({
      path: 'hold_months',
      message: 'Hold period over 12 months may increase carrying costs significantly',
      severity: 'info',
    });
  }

  return warnings;
}

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

/**
 * Convert project form values into a shape suitable for database storage.
 *
 * Date fields are converted to `YYYY-MM-DD` strings; other fields are preserved.
 *
 * @param values - The project form values to transform
 * @returns The transformed object with date fields as `YYYY-MM-DD` strings or `null`
 */
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

/**
 * Convert a Project database record into values suitable for the project form.
 *
 * @param project - The database `Project` object to convert.
 * @returns A partial `ProjectFormValues` object with the same fields as the form; any date strings on the input are converted to `Date` objects and missing dates become `null`.
 */
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