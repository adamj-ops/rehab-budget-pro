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

// ============================================================================
// Enhanced Phone Validation
// ============================================================================

/**
 * Common email domain typos and their corrections.
 */
const EMAIL_TYPO_CORRECTIONS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'icloud.co': 'icloud.com',
};

/**
 * Check if an email domain might be a typo.
 */
export function checkEmailTypo(email: string): { hasPotentialTypo: boolean; suggestion?: string } {
  if (!email || !email.includes('@')) {
    return { hasPotentialTypo: false };
  }
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { hasPotentialTypo: false };
  }
  
  const correction = EMAIL_TYPO_CORRECTIONS[domain];
  if (correction) {
    return {
      hasPotentialTypo: true,
      suggestion: email.replace(/@.*$/, `@${correction}`),
    };
  }
  
  return { hasPotentialTypo: false };
}

/**
 * Phone schema with flexible format support and normalization.
 * Accepts: 555-123-4567, (555) 123-4567, 555.123.4567, 5551234567, +1 555-123-4567
 */
const phoneSchema = z.string()
  .transform((val) => val.trim())
  .pipe(
    z.string()
      .refine((val) => {
        if (!val) return true; // Allow empty
        // Remove all non-digits
        const digitsOnly = val.replace(/\D/g, '');
        // Must be 10 digits (US) or 11 digits (with country code)
        return digitsOnly.length === 10 || (digitsOnly.length === 11 && digitsOnly.startsWith('1'));
      }, {
        message: 'Phone must be a valid US number (10 digits, e.g., 555-123-4567)',
      })
  )
  .nullable()
  .or(z.literal(''));

/**
 * Email schema with better error messages.
 */
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(
    z.string()
      .email('Invalid email format - use name@domain.com')
      .max(254, 'Email address is too long')
      .refine((val) => {
        if (!val) return true;
        // Check for common invalid patterns
        const domain = val.split('@')[1];
        if (!domain || !domain.includes('.')) {
          return false;
        }
        return true;
      }, {
        message: 'Email must include a valid domain (e.g., @gmail.com)',
      })
  )
  .nullable()
  .or(z.literal(''));

/**
 * Website URL schema with protocol prefix handling.
 */
const websiteSchema = z.string()
  .trim()
  .transform((val) => {
    if (!val) return val;
    // Auto-prefix https:// if no protocol specified
    if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
      return `https://${val}`;
    }
    return val;
  })
  .pipe(
    z.string()
      .url('Invalid website URL')
      .max(500, 'Website URL is too long')
  )
  .nullable()
  .or(z.literal(''));

// ============================================================================
// Main Vendor Form Schema
// ============================================================================

// Vendor form schema with improved error messages
export const vendorFormSchema = z.object({
  // Basic Info
  name: z.string()
    .trim()
    .min(1, 'Vendor name is required')
    .max(200, 'Vendor name cannot exceed 200 characters'),
  trade: vendorTradeSchema,
  contact_name: z.string()
    .trim()
    .max(200, 'Contact name cannot exceed 200 characters')
    .nullable(),
  phone: phoneSchema,
  email: emailSchema,
  website: websiteSchema,
  address: z.string()
    .trim()
    .max(500, 'Address cannot exceed 500 characters')
    .nullable(),

  // Qualifications
  licensed: z.boolean(),
  insured: z.boolean(),
  w9_on_file: z.boolean(),

  // Ratings
  rating: z.number()
    .int('Rating must be a whole number (1-5 stars)')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot exceed 5 stars')
    .nullable(),
  reliability: reliabilitySchema.nullable(),
  price_level: priceLevelSchema.nullable(),

  // Status
  status: vendorStatusSchema,
  notes: z.string()
    .max(5000, 'Notes cannot exceed 5,000 characters')
    .nullable(),
});

// ============================================================================
// Validation Warnings
// ============================================================================

/**
 * Type for validation warnings (distinct from errors).
 */
export interface VendorValidationWarning {
  path: string;
  message: string;
  severity: 'warning' | 'info';
  suggestion?: string;
}

/**
 * Check vendor form values for potential issues (warnings, not errors).
 */
export function getVendorFormWarnings(values: VendorFormValues): VendorValidationWarning[] {
  const warnings: VendorValidationWarning[] = [];

  // Check for email typos
  if (values.email) {
    const typoCheck = checkEmailTypo(values.email);
    if (typoCheck.hasPotentialTypo) {
      warnings.push({
        path: 'email',
        message: `Did you mean "${typoCheck.suggestion}"?`,
        severity: 'warning',
        suggestion: typoCheck.suggestion,
      });
    }
  }

  // Licensed contractor warning
  const licensedTrades = ['electrician', 'plumber', 'hvac', 'general_contractor'];
  if (licensedTrades.includes(values.trade) && !values.licensed) {
    warnings.push({
      path: 'licensed',
      message: `${values.trade.replace('_', ' ')} typically requires a license - verify compliance`,
      severity: 'warning',
    });
  }

  // Insurance warning for major trades
  const highRiskTrades = ['roofer', 'electrician', 'plumber', 'hvac', 'general_contractor', 'framing'];
  if (highRiskTrades.includes(values.trade) && !values.insured) {
    warnings.push({
      path: 'insured',
      message: 'This trade involves higher risk - consider requiring insurance',
      severity: 'warning',
    });
  }

  // Do not use status with good rating
  if (values.status === 'do_not_use' && values.rating && values.rating >= 4) {
    warnings.push({
      path: 'status',
      message: 'Vendor marked "Do Not Use" but has a 4+ star rating - add notes explaining why',
      severity: 'info',
    });
  }

  // Missing contact info
  if (!values.phone && !values.email) {
    warnings.push({
      path: 'phone',
      message: 'No contact information - consider adding phone or email',
      severity: 'info',
    });
  }

  // W9 reminder for active vendors
  if (values.status === 'active' && !values.w9_on_file) {
    warnings.push({
      path: 'w9_on_file',
      message: 'Remember to collect W-9 before making payments over $600/year',
      severity: 'info',
    });
  }

  return warnings;
}

/**
 * Normalize phone number to (XXX) XXX-XXXX format.
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const nationalNumber = digits.startsWith('1') && digits.length === 11 
    ? digits.slice(1) 
    : digits;
  
  if (nationalNumber.length !== 10) {
    return phone; // Return as-is if not valid
  }
  
  return `(${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
}

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
