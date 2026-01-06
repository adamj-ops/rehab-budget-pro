-- ============================================================================
-- THREE-COLUMN BUDGET MODEL + SUPPORTING FEATURES
-- Migration to add: underwriting/forecast/actual columns, photos, templates
-- ============================================================================

-- ============================================================================
-- 1. UPDATE BUDGET_ITEMS TABLE - Add Three-Column Budget Model
-- ============================================================================

-- Add new budget columns
ALTER TABLE budget_items
  ADD COLUMN underwriting_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN forecast_amount NUMERIC(10,2) DEFAULT 0;

-- Rename 'rate' to make the schema clearer (budget is qty * rate)
-- Keep 'rate' as the unit cost, 'actual' becomes actual_amount for consistency
ALTER TABLE budget_items
  RENAME COLUMN actual TO actual_amount;

-- Add computed variance columns using GENERATED ALWAYS
ALTER TABLE budget_items
  ADD COLUMN forecast_variance NUMERIC(10,2)
    GENERATED ALWAYS AS (forecast_amount - underwriting_amount) STORED,
  ADD COLUMN actual_variance NUMERIC(10,2)
    GENERATED ALWAYS AS (actual_amount - COALESCE(forecast_amount, underwriting_amount)) STORED,
  ADD COLUMN total_variance NUMERIC(10,2)
    GENERATED ALWAYS AS (actual_amount - underwriting_amount) STORED;

-- Add comment to clarify the three budget columns
COMMENT ON COLUMN budget_items.underwriting_amount IS 'Pre-deal budget estimate used during acquisition analysis';
COMMENT ON COLUMN budget_items.forecast_amount IS 'Refined budget after walkthrough/contractor bids';
COMMENT ON COLUMN budget_items.actual_amount IS 'Actual spend during/after construction';
COMMENT ON COLUMN budget_items.rate IS 'Unit cost (budget = qty × rate)';

-- ============================================================================
-- 2. CREATE LINE_ITEM_PHOTOS TABLE
-- ============================================================================

CREATE TABLE line_item_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_item_id UUID REFERENCES budget_items(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

  -- File Storage
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,

  -- Photo Classification
  photo_type TEXT DEFAULT 'other' CHECK (photo_type IN ('receipt', 'progress', 'before', 'after', 'other')),
  caption TEXT,
  taken_at TIMESTAMPTZ,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_photos_line_item ON line_item_photos(line_item_id);
CREATE INDEX idx_photos_project ON line_item_photos(project_id);
CREATE INDEX idx_photos_type ON line_item_photos(photo_type);

-- RLS Policies
ALTER TABLE line_item_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos for own projects" ON line_item_photos
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert photos for own projects" ON line_item_photos
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete photos for own projects" ON line_item_photos
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 3. CREATE BUDGET_CATEGORY_TEMPLATES TABLE
-- ============================================================================

CREATE TABLE budget_category_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category budget_category NOT NULL,
  default_line_items JSONB, -- Array of default line item names
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_category_templates_active ON budget_category_templates(is_active, sort_order);

-- Seed category templates
INSERT INTO budget_category_templates (name, category, default_line_items, sort_order) VALUES
('Soft Costs', 'soft_costs', '["Permits & Inspections", "Architecture/Engineering", "Project Management", "Utilities During Construction", "Insurance", "Loan Fees", "Legal/Title"]'::jsonb, 1),

('Demolition', 'demo', '["Interior Demo", "Exterior Demo", "Dumpster/Hauling", "Hazmat Abatement"]'::jsonb, 2),

('Structural', 'structural', '["Foundation Repair", "Structural Framing", "Load-Bearing Walls", "Beam/Column Work", "Subfloor Repair/Replacement"]'::jsonb, 3),

('Plumbing', 'plumbing', '["Rough-In Plumbing", "Finish Plumbing", "Water Heater", "Main Line/Sewer", "Gas Lines", "Fixtures & Faucets"]'::jsonb, 4),

('HVAC', 'hvac', '["Furnace", "A/C Unit", "Ductwork", "Thermostat", "Vents/Registers"]'::jsonb, 5),

('Electrical', 'electrical', '["Panel Upgrade", "Rough-In Electrical", "Finish Electrical", "Fixtures/Outlets/Switches", "Lighting Fixtures"]'::jsonb, 6),

('Insulation & Drywall', 'insulation_drywall', '["Insulation", "Drywall Hang", "Drywall Finish/Tape", "Texture", "Repairs"]'::jsonb, 7),

('Interior Paint', 'interior_paint', '["Wall Paint", "Ceiling Paint", "Trim Paint", "Doors Paint", "Primer"]'::jsonb, 8),

('Flooring', 'flooring', '["Hardwood", "LVP/Laminate", "Carpet", "Tile", "Subfloor Prep", "Transitions/Molding"]'::jsonb, 9),

('Tile', 'tile', '["Bathroom Floor Tile", "Bathroom Wall Tile", "Kitchen Backsplash", "Shower Tile", "Grout/Caulk"]'::jsonb, 10),

('Kitchen', 'kitchen', '["Cabinets", "Countertops", "Sink & Faucet", "Appliances", "Backsplash", "Hardware", "Lighting"]'::jsonb, 11),

('Bathrooms', 'bathrooms', '["Vanity", "Toilet", "Tub", "Shower", "Fixtures", "Mirror", "Exhaust Fan", "Accessories"]'::jsonb, 12),

('Doors & Windows', 'doors_windows', '["Entry Door", "Interior Doors", "Window Replacement", "Sliding Glass Door", "Storm Door", "Hardware"]'::jsonb, 13),

('Interior Trim', 'interior_trim', '["Baseboards", "Crown Molding", "Door Casing", "Window Trim", "Closet Shelving"]'::jsonb, 14),

('Exterior', 'exterior', '["Roof", "Siding", "Soffit/Fascia", "Gutters", "Exterior Paint", "Deck/Porch", "Garage"]'::jsonb, 15),

('Landscaping', 'landscaping', '["Lawn/Sod", "Trees/Shrubs", "Mulch/Rock", "Driveway", "Sidewalk", "Fence", "Grading/Drainage"]'::jsonb, 16),

('Finishing', 'finishing', '["Final Clean", "Staging", "Touch-Up Paint", "Punch List Items"]'::jsonb, 17),

('Contingency', 'contingency', '["Contingency Fund"]'::jsonb, 18);

-- Public read access for templates
ALTER TABLE budget_category_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category templates" ON budget_category_templates
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- 4. UPDATE VIEWS FOR THREE-COLUMN MODEL
-- ============================================================================

-- Drop existing views
DROP VIEW IF EXISTS budget_by_category CASCADE;
DROP VIEW IF EXISTS project_summary CASCADE;

-- Recreate project_summary with three-column budget support
CREATE VIEW project_summary AS
SELECT
  p.*,

  -- Budget Rollups (using underwriting as base, but calculate all three)
  COALESCE(SUM(bi.underwriting_amount), 0) AS underwriting_total,
  COALESCE(SUM(bi.forecast_amount), 0) AS forecast_total,
  COALESCE(SUM(bi.actual_amount), 0) AS actual_total,

  -- Use forecast as primary budget if set, otherwise underwriting
  COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) AS rehab_budget,
  COALESCE(SUM(bi.actual_amount), 0) AS rehab_actual,

  -- Contingency (based on forecast or underwriting)
  COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) * (p.contingency_percent / 100) AS contingency_amount,

  -- Total Calculations
  COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) * (1 + p.contingency_percent / 100) AS rehab_budget_with_contingency,

  -- Selling Costs
  p.arv * (p.selling_cost_percent / 100) AS selling_costs,

  -- Holding Costs Total
  p.holding_costs_monthly * p.hold_months AS holding_costs_total,

  -- Total Investment
  p.purchase_price
    + COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) * (1 + p.contingency_percent / 100)
    + p.closing_costs
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100) AS total_investment,

  -- Profit & ROI
  p.arv - (
    p.purchase_price
    + COALESCE(SUM(COALESCE(bi.forecast_amount, bi.underwriting_amount)), 0) * (1 + p.contingency_percent / 100)
    + p.closing_costs
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100)
  ) AS gross_profit,

  -- MAO (70% Rule using underwriting)
  (p.arv * 0.70) - (COALESCE(SUM(bi.underwriting_amount), 0) * (1 + p.contingency_percent / 100)) AS mao,

  -- Item Counts
  COUNT(bi.id) AS total_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'complete') AS completed_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'in_progress') AS in_progress_items

FROM projects p
LEFT JOIN budget_items bi ON bi.project_id = p.id
GROUP BY p.id;

-- Recreate budget_by_category with three-column support
CREATE VIEW budget_by_category AS
SELECT
  project_id,
  category,
  COUNT(*) AS item_count,

  -- Three-column totals
  SUM(underwriting_amount) AS underwriting_total,
  SUM(forecast_amount) AS forecast_total,
  SUM(actual_amount) AS actual_total,

  -- Variances
  SUM(forecast_variance) AS forecast_variance_total,
  SUM(actual_variance) AS actual_variance_total,
  SUM(total_variance) AS total_variance_total,

  COUNT(*) FILTER (WHERE status = 'complete') AS completed_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'not_started') AS not_started_count

FROM budget_items
GROUP BY project_id, category
ORDER BY category;

-- ============================================================================
-- 5. DATA MIGRATION - Populate new columns from existing data
-- ============================================================================

-- Copy existing qty * rate into underwriting_amount
UPDATE budget_items
SET underwriting_amount = COALESCE(qty * rate, 0)
WHERE underwriting_amount = 0;

-- If there are actual amounts, copy them to actual_amount (already renamed above)
-- The actual_amount column already exists from the rename

COMMENT ON TABLE budget_items IS 'Budget line items with three-column model: Underwriting (pre-deal) → Forecast (post-walkthrough) → Actual (real spend)';
COMMENT ON TABLE line_item_photos IS 'Photo attachments for budget line items (receipts, progress, before/after)';
COMMENT ON TABLE budget_category_templates IS 'Pre-seeded category templates with default line items for new projects';
