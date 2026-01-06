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

export type UnitType = 'sf' | 'lf' | 'ea' | 'ls' | 'sq' | 'hr' | 'day' | 'week' | 'month';

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
  
  // Quantities & Costs
  qty: number;
  unit: UnitType;
  rate: number;
  actual: number | null;
  
  // Classification
  cost_type: CostType;
  status: ItemStatus;
  priority: 'high' | 'medium' | 'low';
  
  // Meta
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Computed (client-side)
  budget?: number;
  variance?: number;
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

// ============================================================================
// VIEW TYPES (Computed/Aggregated)
// ============================================================================

export interface ProjectSummary extends Project {
  // Budget Rollups
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
  budget_total: number;
  actual_total: number;
  variance: number;
  completed_count: number;
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
export type BudgetItemInput = Omit<BudgetItem, 'id' | 'created_at' | 'updated_at' | 'budget' | 'variance'>;
export type DrawInput = Omit<Draw, 'id' | 'created_at' | 'updated_at'>;

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
