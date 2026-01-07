import { z } from 'zod';
import type { Vendor } from '@/types';

// Enum schemas
export const vendorTradeSchema = z.enum([
  'general_contractor',
  'plumber',
  'electrician',
  'hvac',
  'roofer',
  'drywall',
  'painter',
  'flooring',
  'tile',
  'cabinets',
  'countertops',
  'framing',
  'siding',
  'landscaper',
  'concrete',
  'fencing',
  'windows_doors',
  'cleaning',
  'inspector',
  'appraiser',
  'other',
]);

export const vendorStatusSchema = z.enum(['active', 'inactive', 'do_not_use']);

export const reliabilitySchema = z.enum(['excellent', 'good', 'fair', 'poor']);

export const priceLevelSchema = z.enum(['$', '$$', '$$$']);

// Vendor form schema
export const vendorFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, 'Vendor name is required'),
  trade: vendorTradeSchema,
  contact_name: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().email('Invalid email address').nullable().or(z.literal('')),
  website: z.string().url('Invalid URL').nullable().or(z.literal('')),
  address: z.string().nullable(),

  // Qualifications
  licensed: z.boolean(),
  insured: z.boolean(),
  w9_on_file: z.boolean(),

  // Ratings
  rating: z.number().min(1).max(5).nullable(),
  reliability: reliabilitySchema.nullable(),
  price_level: priceLevelSchema.nullable(),

  // Status
  status: vendorStatusSchema,
  notes: z.string().nullable(),
});

// Type inference
export type VendorFormValues = z.infer<typeof vendorFormSchema>;

// Default values for form
export const vendorFormDefaults: VendorFormValues = {
  name: '',
  trade: 'general_contractor',
  contact_name: null,
  phone: null,
  email: null,
  website: null,
  address: null,
  licensed: false,
  insured: false,
  w9_on_file: false,
  rating: null,
  reliability: null,
  price_level: null,
  status: 'active',
  notes: null,
};

// Trade options for select
export const vendorTradeOptions = [
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'painter', label: 'Painter' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'tile', label: 'Tile' },
  { value: 'cabinets', label: 'Cabinets' },
  { value: 'countertops', label: 'Countertops' },
  { value: 'framing', label: 'Framing/Carpentry' },
  { value: 'siding', label: 'Siding' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'fencing', label: 'Fencing' },
  { value: 'windows_doors', label: 'Windows/Doors' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'appraiser', label: 'Appraiser' },
  { value: 'other', label: 'Other' },
] as const;

// Status options for select
export const vendorStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'do_not_use', label: 'Do Not Use' },
] as const;

// Reliability options for select
export const reliabilityOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const;

// Price level options for select
export const priceLevelOptions = [
  { value: '$', label: '$ - Budget' },
  { value: '$$', label: '$$ - Mid-Range' },
  { value: '$$$', label: '$$$ - Premium' },
] as const;

// Helper to transform form values for database submission
export function transformFormToDatabase(values: VendorFormValues) {
  return {
    ...values,
    // Convert empty strings to null for optional URL fields
    email: values.email === '' ? null : values.email,
    website: values.website === '' ? null : values.website,
  };
}

// Helper to transform database values to form values
export function transformDatabaseToForm(vendor: Vendor): VendorFormValues {
  return {
    name: vendor.name,
    trade: vendor.trade,
    contact_name: vendor.contact_name,
    phone: vendor.phone,
    email: vendor.email,
    website: vendor.website,
    address: vendor.address,
    licensed: vendor.licensed,
    insured: vendor.insured,
    w9_on_file: vendor.w9_on_file,
    rating: vendor.rating,
    reliability: vendor.reliability,
    price_level: vendor.price_level,
    status: vendor.status,
    notes: vendor.notes,
  };
}
