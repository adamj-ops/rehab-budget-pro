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

// ============================================================================
// CALCULATION SETTINGS TYPES
// ============================================================================

export type MaoMethod =
  | 'seventy_rule'
  | 'arv_minus_all'
  | 'gross_margin'
  | 'custom_percentage'
  | 'net_profit_target';

export type RoiMethod =
  | 'simple'
  | 'cash_on_cash'
  | 'annualized'
  | 'irr_simplified';

export type ContingencyMethod =
  | 'flat_percent'
  | 'category_weighted'
  | 'tiered'
  | 'scope_based';

export type HoldingCostMethod =
  | 'flat_monthly'
  | 'percentage_of_loan'
  | 'itemized'
  | 'hybrid';

export interface ContingencyCategoryRates {
  soft_costs: number;
  demo: number;
  structural: number;
  plumbing: number;
  hvac: number;
  electrical: number;
  insulation_drywall: number;
  interior_paint: number;
  flooring: number;
  tile: number;
  kitchen: number;
  bathrooms: number;
  doors_windows: number;
  interior_trim: number;
  exterior: number;
  landscaping: number;
  finishing: number;
  contingency: number;
}

export interface ContingencyTier {
  max_budget: number | null;
  percent: number;
}

export interface HoldingCostItems {
  taxes: number;
  insurance: number;
  utilities: number;
  loan_interest: number;
  hoa: number;
  lawn_care: number;
  other: number;
}

export interface CalculationSettings {
  id: string;
  user_id: string;

  // Profile Info
  name: string;
  description: string | null;
  is_default: boolean;

  // MAO Settings
  mao_method: MaoMethod;
  mao_arv_multiplier: number;
  mao_target_profit: number;
  mao_target_profit_percent: number;
  mao_include_holding_costs: boolean;
  mao_include_selling_costs: boolean;
  mao_include_closing_costs: boolean;

  // ROI Settings
  roi_method: RoiMethod;
  roi_annualize: boolean;
  roi_include_opportunity_cost: boolean;
  roi_opportunity_rate: number;
  roi_threshold_excellent: number;
  roi_threshold_good: number;
  roi_threshold_fair: number;
  roi_threshold_poor: number;

  // Contingency Settings
  contingency_method: ContingencyMethod;
  contingency_default_percent: number;
  contingency_category_rates: ContingencyCategoryRates;
  contingency_tiers: ContingencyTier[];

  // Holding Cost Settings
  holding_cost_method: HoldingCostMethod;
  holding_cost_default_monthly: number;
  holding_cost_loan_rate_annual: number;
  holding_cost_include_taxes: boolean;
  holding_cost_include_insurance: boolean;
  holding_cost_include_utilities: boolean;
  holding_cost_include_hoa: boolean;
  holding_cost_items: HoldingCostItems;

  // Selling Cost Settings
  selling_cost_default_percent: number;
  selling_cost_agent_commission: number;
  selling_cost_buyer_concessions: number;
  selling_cost_closing_percent: number;
  selling_cost_fixed_amount: number;

  // Profit Thresholds
  profit_min_acceptable: number;
  profit_target: number;
  profit_excellent: number;
  profit_min_percent: number;
  profit_target_percent: number;
  profit_excellent_percent: number;

  // Variance Alerts
  variance_alert_enabled: boolean;
  variance_warning_percent: number;
  variance_critical_percent: number;
  variance_alert_on_forecast: boolean;
  variance_alert_on_actual: boolean;

  // Custom Formulas
  custom_formulas: Record<string, string>;

  // Meta
  created_at: string;
  updated_at: string;
}

export type CalculationSettingsInput = Omit<CalculationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// Default calculation settings
export const DEFAULT_CALCULATION_SETTINGS: CalculationSettingsInput = {
  name: 'Default',
  description: null,
  is_default: true,

  // MAO defaults
  mao_method: 'seventy_rule',
  mao_arv_multiplier: 0.70,
  mao_target_profit: 30000,
  mao_target_profit_percent: 15,
  mao_include_holding_costs: true,
  mao_include_selling_costs: true,
  mao_include_closing_costs: true,

  // ROI defaults
  roi_method: 'simple',
  roi_annualize: false,
  roi_include_opportunity_cost: false,
  roi_opportunity_rate: 5,
  roi_threshold_excellent: 25,
  roi_threshold_good: 15,
  roi_threshold_fair: 10,
  roi_threshold_poor: 5,

  // Contingency defaults
  contingency_method: 'flat_percent',
  contingency_default_percent: 10,
  contingency_category_rates: {
    soft_costs: 5,
    demo: 10,
    structural: 15,
    plumbing: 12,
    hvac: 12,
    electrical: 12,
    insulation_drywall: 10,
    interior_paint: 8,
    flooring: 8,
    tile: 10,
    kitchen: 10,
    bathrooms: 12,
    doors_windows: 8,
    interior_trim: 8,
    exterior: 12,
    landscaping: 8,
    finishing: 5,
    contingency: 0,
  },
  contingency_tiers: [
    { max_budget: 25000, percent: 15 },
    { max_budget: 50000, percent: 12 },
    { max_budget: 100000, percent: 10 },
    { max_budget: null, percent: 8 },
  ],

  // Holding cost defaults
  holding_cost_method: 'flat_monthly',
  holding_cost_default_monthly: 1500,
  holding_cost_loan_rate_annual: 12,
  holding_cost_include_taxes: true,
  holding_cost_include_insurance: true,
  holding_cost_include_utilities: true,
  holding_cost_include_hoa: false,
  holding_cost_items: {
    taxes: 250,
    insurance: 150,
    utilities: 200,
    loan_interest: 800,
    hoa: 0,
    lawn_care: 100,
    other: 0,
  },

  // Selling cost defaults
  selling_cost_default_percent: 8,
  selling_cost_agent_commission: 5,
  selling_cost_buyer_concessions: 2,
  selling_cost_closing_percent: 1,
  selling_cost_fixed_amount: 0,

  // Profit thresholds
  profit_min_acceptable: 20000,
  profit_target: 35000,
  profit_excellent: 50000,
  profit_min_percent: 10,
  profit_target_percent: 15,
  profit_excellent_percent: 20,

  // Variance alerts
  variance_alert_enabled: true,
  variance_warning_percent: 5,
  variance_critical_percent: 10,
  variance_alert_on_forecast: true,
  variance_alert_on_actual: true,

  // Custom formulas
  custom_formulas: {},
};

// Labels for calculation methods
export const MAO_METHOD_LABELS: Record<MaoMethod, string> = {
  seventy_rule: '70% Rule',
  arv_minus_all: 'ARV Minus All Costs',
  gross_margin: 'Gross Margin Target',
  custom_percentage: 'Custom Percentage',
  net_profit_target: 'Net Profit Target',
};

export const MAO_METHOD_DESCRIPTIONS: Record<MaoMethod, string> = {
  seventy_rule: 'Classic formula: ARV × 70% - Rehab Budget',
  arv_minus_all: 'ARV - All Costs - Target Profit',
  gross_margin: 'ARV × (1 - Target Margin%) - Costs',
  custom_percentage: 'ARV × Custom% - Rehab Budget',
  net_profit_target: 'Work backward from desired profit',
};

export const ROI_METHOD_LABELS: Record<RoiMethod, string> = {
  simple: 'Simple ROI',
  cash_on_cash: 'Cash-on-Cash Return',
  annualized: 'Annualized ROI',
  irr_simplified: 'IRR (Simplified)',
};

export const ROI_METHOD_DESCRIPTIONS: Record<RoiMethod, string> = {
  simple: 'Profit ÷ Total Investment × 100',
  cash_on_cash: 'Annual Cash Flow ÷ Cash Invested × 100',
  annualized: '(Profit ÷ Investment) × (12 ÷ Hold Months)',
  irr_simplified: 'Approximated Internal Rate of Return',
};

export const CONTINGENCY_METHOD_LABELS: Record<ContingencyMethod, string> = {
  flat_percent: 'Flat Percentage',
  category_weighted: 'Category-Weighted',
  tiered: 'Budget-Tiered',
  scope_based: 'Scope-Based',
};

export const CONTINGENCY_METHOD_DESCRIPTIONS: Record<ContingencyMethod, string> = {
  flat_percent: 'Single percentage applied to entire budget',
  category_weighted: 'Different rates for each category based on risk',
  tiered: 'Percentage varies based on total budget size',
  scope_based: 'Percentage based on project scope and type',
};

export const HOLDING_COST_METHOD_LABELS: Record<HoldingCostMethod, string> = {
  flat_monthly: 'Flat Monthly Rate',
  percentage_of_loan: 'Percentage of Loan',
  itemized: 'Itemized Breakdown',
  hybrid: 'Hybrid (Base + Variable)',
};

export const HOLDING_COST_METHOD_DESCRIPTIONS: Record<HoldingCostMethod, string> = {
  flat_monthly: 'Fixed monthly amount for all holding costs',
  percentage_of_loan: 'Monthly cost as percentage of purchase price',
  itemized: 'Sum of individual cost items',
  hybrid: 'Base rate plus variable components',
};
