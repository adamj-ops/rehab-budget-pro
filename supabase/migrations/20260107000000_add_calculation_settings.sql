-- ============================================================================
-- CALCULATION SETTINGS MIGRATION
-- Adds user-configurable calculation algorithms
-- ============================================================================

-- Create enum for MAO calculation methods
CREATE TYPE mao_method AS ENUM (
  'seventy_rule',        -- Classic: ARV × 70% - Rehab
  'arv_minus_all',       -- ARV - All Costs - Target Profit
  'gross_margin',        -- ARV × (1 - Target Margin%) - Rehab
  'custom_percentage',   -- ARV × Custom% - Rehab
  'net_profit_target'    -- Work backward from desired profit
);

-- Create enum for ROI calculation methods
CREATE TYPE roi_method AS ENUM (
  'simple',              -- Profit / Total Investment
  'cash_on_cash',        -- Annual Cash Flow / Cash Invested
  'annualized',          -- (Profit / Investment) × (12 / Hold Months)
  'irr_simplified'       -- Simple IRR approximation
);

-- Create enum for contingency calculation methods
CREATE TYPE contingency_method AS ENUM (
  'flat_percent',        -- Single % applied to all
  'category_weighted',   -- Different % per category risk level
  'tiered',              -- % increases with budget size
  'scope_based'          -- % based on project scope/type
);

-- Create enum for holding cost calculation methods
CREATE TYPE holding_cost_method AS ENUM (
  'flat_monthly',        -- Fixed monthly rate
  'percentage_of_loan',  -- % of purchase price monthly
  'itemized',            -- Sum of individual items
  'hybrid'               -- Base + variable components
);

-- ============================================================================
-- CALCULATION SETTINGS TABLE
-- ============================================================================

CREATE TABLE calculation_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Info
  name TEXT NOT NULL DEFAULT 'Default',
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,

  -- ============================================================================
  -- MAO (Maximum Allowable Offer) Settings
  -- ============================================================================
  mao_method mao_method DEFAULT 'seventy_rule',
  mao_arv_multiplier NUMERIC(5,4) DEFAULT 0.7000,  -- For percentage rules (70% = 0.70)
  mao_target_profit NUMERIC(12,2) DEFAULT 30000,    -- Fixed profit target
  mao_target_profit_percent NUMERIC(5,2) DEFAULT 15.00,  -- Profit as % of ARV
  mao_include_holding_costs BOOLEAN DEFAULT TRUE,
  mao_include_selling_costs BOOLEAN DEFAULT TRUE,
  mao_include_closing_costs BOOLEAN DEFAULT TRUE,

  -- ============================================================================
  -- ROI Calculation Settings
  -- ============================================================================
  roi_method roi_method DEFAULT 'simple',
  roi_annualize BOOLEAN DEFAULT FALSE,
  roi_include_opportunity_cost BOOLEAN DEFAULT FALSE,
  roi_opportunity_rate NUMERIC(5,2) DEFAULT 5.00,  -- Assumed alternative return %

  -- ROI Threshold Colors (for UI display)
  roi_threshold_excellent NUMERIC(5,2) DEFAULT 25.00,
  roi_threshold_good NUMERIC(5,2) DEFAULT 15.00,
  roi_threshold_fair NUMERIC(5,2) DEFAULT 10.00,
  roi_threshold_poor NUMERIC(5,2) DEFAULT 5.00,

  -- ============================================================================
  -- Contingency Settings
  -- ============================================================================
  contingency_method contingency_method DEFAULT 'flat_percent',
  contingency_default_percent NUMERIC(5,2) DEFAULT 10.00,

  -- Category-specific contingency rates (JSON for flexibility)
  -- e.g., {"structural": 15, "plumbing": 12, "electrical": 12, "cosmetic": 8}
  contingency_category_rates JSONB DEFAULT '{
    "soft_costs": 5,
    "demo": 10,
    "structural": 15,
    "plumbing": 12,
    "hvac": 12,
    "electrical": 12,
    "insulation_drywall": 10,
    "interior_paint": 8,
    "flooring": 8,
    "tile": 10,
    "kitchen": 10,
    "bathrooms": 12,
    "doors_windows": 8,
    "interior_trim": 8,
    "exterior": 12,
    "landscaping": 8,
    "finishing": 5,
    "contingency": 0
  }'::jsonb,

  -- Tiered contingency (JSON array)
  -- e.g., [{"max_budget": 50000, "percent": 15}, {"max_budget": 100000, "percent": 12}]
  contingency_tiers JSONB DEFAULT '[
    {"max_budget": 25000, "percent": 15},
    {"max_budget": 50000, "percent": 12},
    {"max_budget": 100000, "percent": 10},
    {"max_budget": null, "percent": 8}
  ]'::jsonb,

  -- ============================================================================
  -- Holding Cost Settings
  -- ============================================================================
  holding_cost_method holding_cost_method DEFAULT 'flat_monthly',
  holding_cost_default_monthly NUMERIC(10,2) DEFAULT 1500,
  holding_cost_loan_rate_annual NUMERIC(5,2) DEFAULT 12.00,  -- Annual interest rate
  holding_cost_include_taxes BOOLEAN DEFAULT TRUE,
  holding_cost_include_insurance BOOLEAN DEFAULT TRUE,
  holding_cost_include_utilities BOOLEAN DEFAULT TRUE,
  holding_cost_include_hoa BOOLEAN DEFAULT FALSE,

  -- Itemized holding costs (default monthly amounts)
  holding_cost_items JSONB DEFAULT '{
    "taxes": 250,
    "insurance": 150,
    "utilities": 200,
    "loan_interest": 800,
    "hoa": 0,
    "lawn_care": 100,
    "other": 0
  }'::jsonb,

  -- ============================================================================
  -- Selling Cost Settings
  -- ============================================================================
  selling_cost_default_percent NUMERIC(5,2) DEFAULT 8.00,
  selling_cost_agent_commission NUMERIC(5,2) DEFAULT 5.00,
  selling_cost_buyer_concessions NUMERIC(5,2) DEFAULT 2.00,
  selling_cost_closing_percent NUMERIC(5,2) DEFAULT 1.00,
  selling_cost_fixed_amount NUMERIC(10,2) DEFAULT 0,  -- Additional fixed costs

  -- ============================================================================
  -- Profit Threshold Settings (for deal scoring)
  -- ============================================================================
  profit_min_acceptable NUMERIC(12,2) DEFAULT 20000,
  profit_target NUMERIC(12,2) DEFAULT 35000,
  profit_excellent NUMERIC(12,2) DEFAULT 50000,

  profit_min_percent NUMERIC(5,2) DEFAULT 10.00,
  profit_target_percent NUMERIC(5,2) DEFAULT 15.00,
  profit_excellent_percent NUMERIC(5,2) DEFAULT 20.00,

  -- ============================================================================
  -- Budget Variance Alert Settings
  -- ============================================================================
  variance_alert_enabled BOOLEAN DEFAULT TRUE,
  variance_warning_percent NUMERIC(5,2) DEFAULT 5.00,   -- Yellow alert
  variance_critical_percent NUMERIC(5,2) DEFAULT 10.00, -- Red alert
  variance_alert_on_forecast BOOLEAN DEFAULT TRUE,      -- Alert on forecast vs underwriting
  variance_alert_on_actual BOOLEAN DEFAULT TRUE,        -- Alert on actual vs forecast

  -- ============================================================================
  -- Advanced Formula Customization
  -- ============================================================================
  -- Custom formulas stored as expressions (future feature)
  custom_formulas JSONB DEFAULT '{}'::jsonb,

  -- ============================================================================
  -- Meta
  -- ============================================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calculation_settings_user_id ON calculation_settings(user_id);
CREATE INDEX idx_calculation_settings_default ON calculation_settings(user_id, is_default) WHERE is_default = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE calculation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculation settings" ON calculation_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own calculation settings" ON calculation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calculation settings" ON calculation_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculation settings" ON calculation_settings
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER calculation_settings_updated_at
  BEFORE UPDATE ON calculation_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Ensure only one default profile per user
CREATE OR REPLACE FUNCTION ensure_single_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE calculation_settings
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_calculation_settings
  BEFORE INSERT OR UPDATE ON calculation_settings
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_settings();

-- ============================================================================
-- PROJECT-LEVEL SETTINGS OVERRIDE (optional per-project customization)
-- ============================================================================

-- Add calculation settings reference to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS calculation_settings_id UUID REFERENCES calculation_settings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_calculation_settings ON projects(calculation_settings_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR CALCULATIONS
-- ============================================================================

-- Calculate MAO based on settings
CREATE OR REPLACE FUNCTION calculate_mao_with_settings(
  p_arv NUMERIC,
  p_rehab_budget NUMERIC,
  p_holding_costs NUMERIC,
  p_selling_costs NUMERIC,
  p_closing_costs NUMERIC,
  p_settings calculation_settings
) RETURNS NUMERIC AS $$
DECLARE
  v_mao NUMERIC;
  v_total_costs NUMERIC;
BEGIN
  -- Calculate total costs to include
  v_total_costs := p_rehab_budget;

  IF p_settings.mao_include_holding_costs THEN
    v_total_costs := v_total_costs + p_holding_costs;
  END IF;

  IF p_settings.mao_include_selling_costs THEN
    v_total_costs := v_total_costs + p_selling_costs;
  END IF;

  IF p_settings.mao_include_closing_costs THEN
    v_total_costs := v_total_costs + p_closing_costs;
  END IF;

  -- Calculate MAO based on method
  CASE p_settings.mao_method
    WHEN 'seventy_rule' THEN
      v_mao := (p_arv * p_settings.mao_arv_multiplier) - v_total_costs;
    WHEN 'custom_percentage' THEN
      v_mao := (p_arv * p_settings.mao_arv_multiplier) - v_total_costs;
    WHEN 'arv_minus_all' THEN
      v_mao := p_arv - v_total_costs - p_settings.mao_target_profit;
    WHEN 'gross_margin' THEN
      v_mao := (p_arv * (1 - p_settings.mao_target_profit_percent / 100)) - v_total_costs;
    WHEN 'net_profit_target' THEN
      v_mao := p_arv - v_total_costs - p_settings.mao_target_profit;
    ELSE
      v_mao := (p_arv * 0.70) - v_total_costs;
  END CASE;

  RETURN COALESCE(v_mao, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate category-weighted contingency
CREATE OR REPLACE FUNCTION calculate_weighted_contingency(
  p_project_id UUID,
  p_category_rates JSONB
) RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC := 0;
  v_category RECORD;
BEGIN
  FOR v_category IN
    SELECT
      category,
      COALESCE(SUM(
        CASE WHEN forecast_amount > 0 THEN forecast_amount ELSE underwriting_amount END
      ), 0) as budget
    FROM budget_items
    WHERE project_id = p_project_id
    GROUP BY category
  LOOP
    v_total := v_total + (
      v_category.budget *
      COALESCE((p_category_rates->>v_category.category::TEXT)::NUMERIC, 10) / 100
    );
  END LOOP;

  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE calculation_settings IS 'User-configurable calculation algorithms and thresholds for deal analysis';
