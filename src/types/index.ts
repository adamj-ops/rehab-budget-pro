// ============================================================================
// REHAB BUDGET PRO - TypeScript Types
// Generated from Supabase schema
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type ProjectStatus =
  | 'lead'
  | 'analyzing'
  | 'under_contract'
  | 'in_rehab'
  | 'listed'
  | 'sold'
  | 'dead';

export type PropertyType =
  | 'sfh'
  | 'duplex'
  | 'triplex'
  | 'fourplex'
  | 'townhouse'
  | 'condo';

export type BudgetCategory =
  | 'soft_costs'
  | 'demo'
  | 'structural'
  | 'plumbing'
  | 'hvac'
  | 'electrical'
  | 'insulation_drywall'
  | 'interior_paint'
  | 'flooring'
  | 'tile'
  | 'kitchen'
  | 'bathrooms'
  | 'doors_windows'
  | 'interior_trim'
  | 'exterior'
  | 'landscaping'
  | 'finishing'
  | 'contingency';

export type UnitType = 'sf' | 'lf' | 'ea' | 'ls' | 'sq' | 'hr' | 'day' | 'week' | 'month' | 'load' | 'ton' | 'set' | 'opening';

export type PhotoType = 'receipt' | 'progress' | 'before' | 'after' | 'other';

export type CostType = 'labor' | 'materials' | 'both';

export type ItemStatus = 'not_started' | 'in_progress' | 'complete' | 'on_hold' | 'cancelled';

export type VendorTrade =
  | 'general_contractor'
  | 'plumber'
  | 'electrician'
  | 'hvac'
  | 'roofer'
  | 'drywall'
  | 'painter'
  | 'flooring'
  | 'tile'
  | 'cabinets'
  | 'countertops'
  | 'framing'
  | 'siding'
  | 'landscaper'
  | 'concrete'
  | 'fencing'
  | 'windows_doors'
  | 'cleaning'
  | 'inspector'
  | 'appraiser'
  | 'other';

export type VendorStatus = 'active' | 'inactive' | 'do_not_use';

export type DrawStatus = 'pending' | 'approved' | 'paid';

export type DrawMilestone =
  | 'project_start'
  | 'demo_complete'
  | 'rough_in'
  | 'drywall'
  | 'finishes'
  | 'final';

export type PaymentMethod =
  | 'check'
  | 'zelle'
  | 'venmo'
  | 'wire'
  | 'cash'
  | 'credit_card'
  | 'other';

export type ContactType =
  | 'phone_call'
  | 'text_message'
  | 'email'
  | 'in_person'
  | 'site_visit'
  | 'quote_request'
  | 'quote_received'
  | 'job_assigned'
  | 'job_completed'
  | 'payment'
  | 'other';

export type JournalPageType =
  | 'note'
  | 'meeting'
  | 'checklist'
  | 'idea'
  | 'research'
  | 'site_visit';

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Project {
  id: string;
  user_id: string;
  
  // Property Info
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  year_built: number | null;
  property_type: PropertyType;
  
  // Financials
  arv: number | null;
  purchase_price: number | null;
  closing_costs: number;
  holding_costs_monthly: number;
  hold_months: number;
  selling_cost_percent: number;
  contingency_percent: number;
  
  // Status & Dates
  status: ProjectStatus;
  contract_date: string | null;
  close_date: string | null;
  rehab_start_date: string | null;
  target_complete_date: string | null;
  list_date: string | null;
  sale_date: string | null;
  
  // Meta
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  
  // Basic Info
  name: string;
  trade: VendorTrade;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  
  // Qualifications
  licensed: boolean;
  insured: boolean;
  w9_on_file: boolean;
  
  // Ratings
  rating: number | null;
  reliability: 'excellent' | 'good' | 'fair' | 'poor' | null;
  price_level: '$' | '$$' | '$$$' | null;
  
  // Status
  status: VendorStatus;
  notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  project_id: string;
  vendor_id: string | null;

  // Item Details
  category: BudgetCategory;
  item: string;
  description: string | null;
  room_area: string | null;

  // Quantities & Costs (Three-Column Budget Model)
  qty: number;
  unit: UnitType;
  rate: number;
  underwriting_amount: number;  // Pre-deal estimate
  forecast_amount: number;       // Post-walkthrough/bid estimate
  actual_amount: number | null;  // Real spend

  // Computed Variances (generated columns)
  forecast_variance: number | null;  // Forecast - Underwriting
  actual_variance: number | null;    // Actual - Forecast
  total_variance: number | null;     // Actual - Underwriting

  // Classification
  cost_type: CostType;
  status: ItemStatus;
  priority: 'high' | 'medium' | 'low';

  // Meta
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Draw {
  id: string;
  project_id: string;
  vendor_id: string | null;
  
  // Draw Info
  draw_number: number;
  milestone: DrawMilestone | null;
  description: string | null;
  percent_complete: number | null;
  amount: number;
  
  // Dates & Status
  date_requested: string | null;
  date_paid: string | null;
  status: DrawStatus;
  
  // Payment Details
  payment_method: PaymentMethod | null;
  reference_number: string | null;
  
  // Meta
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CostReference {
  id: string;
  category: BudgetCategory;
  item: string;
  description: string | null;
  unit: UnitType;
  low: number | null;
  mid: number | null;
  high: number | null;
  market: string;
  notes: string | null;
  updated_at: string;
}

export interface LineItemPhoto {
  id: string;
  line_item_id: string;
  project_id: string;

  // File Storage
  storage_path: string;
  file_name: string | null;
  file_size: number | null;

  // Photo Classification
  photo_type: PhotoType;
  caption: string | null;
  taken_at: string | null;

  created_at: string;
}

export interface BudgetCategoryTemplate {
  id: string;
  name: string;
  category: BudgetCategory;
  default_line_items: string[] | null; // JSON array of line item names
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface VendorTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorTagAssignment {
  id: string;
  vendor_id: string;
  tag_id: string;
  created_at: string;
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  user_id: string;
  project_id: string | null;

  // Contact Details
  contact_type: ContactType;
  contact_date: string;
  subject: string | null;
  notes: string | null;

  // Follow-up
  follow_up_date: string | null;
  follow_up_completed: boolean;

  created_at: string;
  updated_at: string;
}

export interface JournalPage {
  id: string;
  user_id: string;
  project_id: string | null; // Optional project tag
  
  // Page content
  title: string;
  content: string | null; // Rich text HTML
  icon: string; // Emoji icon
  
  // Classification
  page_type: JournalPageType;
  
  // Flags
  is_pinned: boolean;
  is_archived: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// Extended type with project details for display
export interface JournalPageWithProject extends JournalPage {
  project?: {
    id: string;
    project_name: string;
    address_full: string | null;
  } | null;
}

// ============================================================================
// VIEW TYPES (Computed/Aggregated)
// ============================================================================

export interface ProjectSummary extends Project {
  // Three-Column Budget Rollups
  underwriting_total: number;
  forecast_total: number;
  actual_total: number;

  // Primary Budget (uses forecast if set, otherwise underwriting)
  rehab_budget: number;
  rehab_actual: number;
  contingency_amount: number;
  rehab_budget_with_contingency: number;

  // Calculated Costs
  selling_costs: number;
  holding_costs_total: number;
  total_investment: number;
  gross_profit: number;
  mao: number;

  // Progress
  total_items: number;
  completed_items: number;
  in_progress_items: number;
}

export interface BudgetByCategory {
  project_id: string;
  category: BudgetCategory;
  item_count: number;

  // Three-Column Totals
  underwriting_total: number;
  forecast_total: number;
  actual_total: number;

  // Variances
  forecast_variance_total: number;
  actual_variance_total: number;
  total_variance_total: number;

  // Progress
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
}

export interface VendorPaymentSummary extends Vendor {
  projects_count: number;
  total_paid: number;
  pending_amount: number;
}

// ============================================================================
// FORM/INPUT TYPES
// ============================================================================

export type ProjectInput = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type VendorInput = Omit<Vendor, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type BudgetItemInput = Omit<BudgetItem, 'id' | 'created_at' | 'updated_at' | 'forecast_variance' | 'actual_variance' | 'total_variance'>;
export type DrawInput = Omit<Draw, 'id' | 'created_at' | 'updated_at'>;
export type LineItemPhotoInput = Omit<LineItemPhoto, 'id' | 'created_at'>;
export type VendorTagInput = Omit<VendorTag, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type VendorContactInput = Omit<VendorContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type JournalPageInput = Omit<JournalPage, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface CategoryConfig {
  value: BudgetCategory;
  label: string;
  icon?: string;
  color?: string;
}

export const BUDGET_CATEGORIES: CategoryConfig[] = [
  { value: 'soft_costs', label: 'Soft Costs' },
  { value: 'demo', label: 'Demo' },
  { value: 'structural', label: 'Structural/Framing' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'insulation_drywall', label: 'Insulation/Drywall' },
  { value: 'interior_paint', label: 'Interior Paint' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'tile', label: 'Tile' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathrooms', label: 'Bathrooms' },
  { value: 'doors_windows', label: 'Doors/Windows' },
  { value: 'interior_trim', label: 'Interior Trim' },
  { value: 'exterior', label: 'Exterior' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'finishing', label: 'Finishing Touches' },
  { value: 'contingency', label: 'Contingency' },
];

export const UNIT_LABELS: Record<UnitType, string> = {
  sf: 'SF',
  lf: 'LF',
  ea: 'EA',
  ls: 'LS',
  sq: 'SQ',
  hr: 'HR',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  load: 'Load',
  ton: 'Ton',
  set: 'Set',
  opening: 'Opening',
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  complete: 'Complete',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: 'Lead',
  analyzing: 'Analyzing',
  under_contract: 'Under Contract',
  in_rehab: 'In Rehab',
  listed: 'Listed',
  sold: 'Sold',
  dead: 'Dead',
};

export const VENDOR_TRADE_LABELS: Record<VendorTrade, string> = {
  general_contractor: 'General Contractor',
  plumber: 'Plumber',
  electrician: 'Electrician',
  hvac: 'HVAC',
  roofer: 'Roofer',
  drywall: 'Drywall',
  painter: 'Painter',
  flooring: 'Flooring',
  tile: 'Tile',
  cabinets: 'Cabinets',
  countertops: 'Countertops',
  framing: 'Framing/Carpentry',
  siding: 'Siding',
  landscaper: 'Landscaper',
  concrete: 'Concrete',
  fencing: 'Fencing',
  windows_doors: 'Windows/Doors',
  cleaning: 'Cleaning',
  inspector: 'Inspector',
  appraiser: 'Appraiser',
  other: 'Other',
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  phone_call: 'Phone Call',
  text_message: 'Text Message',
  email: 'Email',
  in_person: 'In Person',
  site_visit: 'Site Visit',
  quote_request: 'Quote Request',
  quote_received: 'Quote Received',
  job_assigned: 'Job Assigned',
  job_completed: 'Job Completed',
  payment: 'Payment',
  other: 'Other',
};

export const TAG_COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6b7280', label: 'Gray' },
] as const;

export const JOURNAL_PAGE_TYPE_CONFIG: Record<JournalPageType, { label: string; icon: string; color: string }> = {
  note: { label: 'Note', icon: '📝', color: 'text-blue-500' },
  meeting: { label: 'Meeting', icon: '🤝', color: 'text-purple-500' },
  checklist: { label: 'Checklist', icon: '📋', color: 'text-green-500' },
  idea: { label: 'Idea', icon: '💡', color: 'text-yellow-500' },
  research: { label: 'Research', icon: '🔍', color: 'text-cyan-500' },
  site_visit: { label: 'Site Visit', icon: '📸', color: 'text-orange-500' },
};

export const JOURNAL_PAGE_TYPES: JournalPageType[] = [
  'note',
  'meeting',
  'checklist',
  'idea',
  'research',
  'site_visit',
];
