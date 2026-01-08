-- ============================================================================
-- BUDGET TEMPLATES MIGRATION
-- Adds user-saveable and system budget templates
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE template_type AS ENUM ('system', 'user');
CREATE TYPE scope_level AS ENUM ('light', 'medium', 'heavy', 'gut');

-- ============================================================================
-- BUDGET TEMPLATES TABLE
-- ============================================================================

CREATE TABLE budget_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template Info
  name TEXT NOT NULL,
  description TEXT,

  -- Classification
  template_type template_type NOT NULL DEFAULT 'user',
  property_type property_type, -- Optional: target property type (sfh, duplex, etc.)
  scope_level scope_level, -- light, medium, heavy, gut

  -- Stats
  times_used INTEGER DEFAULT 0,

  -- Flags
  is_favorite BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BUDGET TEMPLATE ITEMS TABLE
-- ============================================================================

CREATE TABLE budget_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,

  -- Item Details (mirrors budget_items structure)
  category budget_category NOT NULL,
  item TEXT NOT NULL,
  description TEXT,

  -- Default Values (optional - user can include estimates)
  qty NUMERIC(10,2) DEFAULT 0,
  unit unit_type DEFAULT 'ls',
  rate NUMERIC(12,2) DEFAULT 0,
  default_amount NUMERIC(12,2) DEFAULT 0, -- Suggested underwriting amount

  -- Classification
  cost_type cost_type DEFAULT 'both',
  default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('high', 'medium', 'low')),
  suggested_trade vendor_trade, -- Recommended vendor type

  -- Ordering
  sort_order INTEGER DEFAULT 0,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_budget_templates_user_id ON budget_templates(user_id);
CREATE INDEX idx_budget_templates_type ON budget_templates(template_type);
CREATE INDEX idx_budget_templates_active ON budget_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_budget_templates_favorite ON budget_templates(user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX idx_budget_template_items_template_id ON budget_template_items(template_id);
CREATE INDEX idx_budget_template_items_category ON budget_template_items(category);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_template_items ENABLE ROW LEVEL SECURITY;

-- Users can view system templates + their own
CREATE POLICY "Users can view templates" ON budget_templates
  FOR SELECT USING (template_type = 'system' OR auth.uid() = user_id);

-- Users can only modify their own user templates
CREATE POLICY "Users can insert own templates" ON budget_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id AND template_type = 'user');

CREATE POLICY "Users can update own templates" ON budget_templates
  FOR UPDATE USING (auth.uid() = user_id AND template_type = 'user');

CREATE POLICY "Users can delete own templates" ON budget_templates
  FOR DELETE USING (auth.uid() = user_id AND template_type = 'user');

-- Template items follow parent template access
CREATE POLICY "Users can view template items" ON budget_template_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND (t.template_type = 'system' OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own template items" ON budget_template_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
      AND t.template_type = 'user'
    )
  );

CREATE POLICY "Users can update own template items" ON budget_template_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
      AND t.template_type = 'user'
    )
  );

CREATE POLICY "Users can delete own template items" ON budget_template_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM budget_templates t
      WHERE t.id = template_id
      AND t.user_id = auth.uid()
      AND t.template_type = 'user'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER budget_templates_updated_at
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEW: Template Summary with Item Counts
-- ============================================================================

CREATE OR REPLACE VIEW budget_template_summary AS
SELECT
  t.*,
  COALESCE(COUNT(DISTINCT i.id), 0)::INTEGER as item_count,
  COALESCE(COUNT(DISTINCT i.category), 0)::INTEGER as category_count,
  COALESCE(SUM(i.default_amount), 0)::NUMERIC as total_estimate,
  COALESCE(
    ARRAY_AGG(DISTINCT i.category ORDER BY i.category) FILTER (WHERE i.category IS NOT NULL),
    ARRAY[]::budget_category[]
  ) as categories
FROM budget_templates t
LEFT JOIN budget_template_items i ON i.template_id = t.id
GROUP BY t.id;

-- ============================================================================
-- SYSTEM TEMPLATES SEED DATA
-- ============================================================================

-- Template 1: Light Cosmetic Refresh
INSERT INTO budget_templates (id, user_id, name, description, template_type, scope_level)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  NULL,
  'Light Cosmetic Refresh',
  'Quick turnaround flip focusing on paint, flooring, fixtures, and minor repairs. Ideal for properties in good structural condition.',
  'system',
  'light'
);

INSERT INTO budget_template_items (template_id, category, item, unit, cost_type, sort_order) VALUES
-- Soft Costs
('a0000000-0000-0000-0000-000000000001', 'soft_costs', 'Permits & Inspections', 'ls', 'both', 100),
('a0000000-0000-0000-0000-000000000001', 'soft_costs', 'Utilities During Construction', 'month', 'both', 101),
-- Interior Paint
('a0000000-0000-0000-0000-000000000001', 'interior_paint', 'Wall Paint', 'sf', 'both', 800),
('a0000000-0000-0000-0000-000000000001', 'interior_paint', 'Ceiling Paint', 'sf', 'both', 801),
('a0000000-0000-0000-0000-000000000001', 'interior_paint', 'Trim Paint', 'lf', 'both', 802),
('a0000000-0000-0000-0000-000000000001', 'interior_paint', 'Door Paint', 'ea', 'both', 803),
-- Flooring
('a0000000-0000-0000-0000-000000000001', 'flooring', 'LVP/Laminate', 'sf', 'both', 900),
('a0000000-0000-0000-0000-000000000001', 'flooring', 'Carpet', 'sf', 'both', 901),
('a0000000-0000-0000-0000-000000000001', 'flooring', 'Transitions/Molding', 'lf', 'materials', 902),
-- Bathrooms (fixtures only)
('a0000000-0000-0000-0000-000000000001', 'bathrooms', 'Toilet', 'ea', 'both', 1200),
('a0000000-0000-0000-0000-000000000001', 'bathrooms', 'Fixtures', 'ea', 'both', 1201),
('a0000000-0000-0000-0000-000000000001', 'bathrooms', 'Mirror', 'ea', 'materials', 1202),
('a0000000-0000-0000-0000-000000000001', 'bathrooms', 'Accessories', 'ls', 'materials', 1203),
-- Kitchen (fixtures only)
('a0000000-0000-0000-0000-000000000001', 'kitchen', 'Hardware', 'ls', 'materials', 1100),
('a0000000-0000-0000-0000-000000000001', 'kitchen', 'Sink & Faucet', 'ea', 'both', 1101),
('a0000000-0000-0000-0000-000000000001', 'kitchen', 'Lighting', 'ea', 'both', 1102),
-- Electrical (fixtures)
('a0000000-0000-0000-0000-000000000001', 'electrical', 'Lighting Fixtures', 'ea', 'both', 600),
('a0000000-0000-0000-0000-000000000001', 'electrical', 'Outlets/Switches', 'ea', 'both', 601),
-- Doors & Windows
('a0000000-0000-0000-0000-000000000001', 'doors_windows', 'Interior Doors', 'ea', 'both', 1300),
('a0000000-0000-0000-0000-000000000001', 'doors_windows', 'Hardware', 'ls', 'materials', 1301),
-- Exterior
('a0000000-0000-0000-0000-000000000001', 'exterior', 'Exterior Paint', 'sf', 'both', 1500),
-- Landscaping
('a0000000-0000-0000-0000-000000000001', 'landscaping', 'Lawn/Sod', 'sf', 'both', 1600),
('a0000000-0000-0000-0000-000000000001', 'landscaping', 'Mulch/Rock', 'ls', 'materials', 1601),
-- Finishing
('a0000000-0000-0000-0000-000000000001', 'finishing', 'Final Clean', 'ls', 'labor', 1700),
('a0000000-0000-0000-0000-000000000001', 'finishing', 'Touch-Up Paint', 'ls', 'both', 1701),
('a0000000-0000-0000-0000-000000000001', 'finishing', 'Punch List Items', 'ls', 'both', 1702),
-- Contingency
('a0000000-0000-0000-0000-000000000001', 'contingency', 'Contingency Fund', 'ls', 'both', 1800);

-- Template 2: Kitchen & Bath Focus
INSERT INTO budget_templates (id, user_id, name, description, template_type, scope_level)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  NULL,
  'Kitchen & Bath Focus',
  'Renovation centered on kitchen and bathroom updates with supporting work. Great ROI for dated but structurally sound homes.',
  'system',
  'medium'
);

INSERT INTO budget_template_items (template_id, category, item, unit, cost_type, sort_order) VALUES
-- Soft Costs
('a0000000-0000-0000-0000-000000000002', 'soft_costs', 'Permits & Inspections', 'ls', 'both', 100),
('a0000000-0000-0000-0000-000000000002', 'soft_costs', 'Utilities During Construction', 'month', 'both', 101),
-- Demo
('a0000000-0000-0000-0000-000000000002', 'demo', 'Kitchen Demo', 'ls', 'labor', 200),
('a0000000-0000-0000-0000-000000000002', 'demo', 'Bathroom Demo', 'ea', 'labor', 201),
('a0000000-0000-0000-0000-000000000002', 'demo', 'Dumpster/Hauling', 'load', 'both', 202),
-- Plumbing
('a0000000-0000-0000-0000-000000000002', 'plumbing', 'Rough-In Plumbing', 'ls', 'both', 400),
('a0000000-0000-0000-0000-000000000002', 'plumbing', 'Finish Plumbing', 'ls', 'both', 401),
('a0000000-0000-0000-0000-000000000002', 'plumbing', 'Water Heater', 'ea', 'both', 402),
('a0000000-0000-0000-0000-000000000002', 'plumbing', 'Fixtures & Faucets', 'ls', 'both', 403),
-- Electrical
('a0000000-0000-0000-0000-000000000002', 'electrical', 'Rough-In Electrical', 'ls', 'both', 600),
('a0000000-0000-0000-0000-000000000002', 'electrical', 'Finish Electrical', 'ls', 'both', 601),
('a0000000-0000-0000-0000-000000000002', 'electrical', 'Lighting Fixtures', 'ea', 'both', 602),
-- Insulation/Drywall
('a0000000-0000-0000-0000-000000000002', 'insulation_drywall', 'Drywall Repairs', 'sf', 'both', 700),
('a0000000-0000-0000-0000-000000000002', 'insulation_drywall', 'Texture', 'sf', 'both', 701),
-- Interior Paint
('a0000000-0000-0000-0000-000000000002', 'interior_paint', 'Wall Paint', 'sf', 'both', 800),
('a0000000-0000-0000-0000-000000000002', 'interior_paint', 'Ceiling Paint', 'sf', 'both', 801),
('a0000000-0000-0000-0000-000000000002', 'interior_paint', 'Trim Paint', 'lf', 'both', 802),
-- Flooring
('a0000000-0000-0000-0000-000000000002', 'flooring', 'LVP/Laminate', 'sf', 'both', 900),
('a0000000-0000-0000-0000-000000000002', 'flooring', 'Subfloor Prep', 'sf', 'labor', 901),
-- Tile
('a0000000-0000-0000-0000-000000000002', 'tile', 'Bathroom Floor Tile', 'sf', 'both', 1000),
('a0000000-0000-0000-0000-000000000002', 'tile', 'Bathroom Wall Tile', 'sf', 'both', 1001),
('a0000000-0000-0000-0000-000000000002', 'tile', 'Kitchen Backsplash', 'sf', 'both', 1002),
('a0000000-0000-0000-0000-000000000002', 'tile', 'Shower Tile', 'sf', 'both', 1003),
-- Kitchen
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Cabinets', 'lf', 'both', 1100),
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Countertops', 'sf', 'both', 1101),
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Sink & Faucet', 'ea', 'both', 1102),
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Appliances', 'ls', 'materials', 1103),
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Hardware', 'ls', 'materials', 1104),
('a0000000-0000-0000-0000-000000000002', 'kitchen', 'Lighting', 'ea', 'both', 1105),
-- Bathrooms
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Vanity', 'ea', 'both', 1200),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Toilet', 'ea', 'both', 1201),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Tub', 'ea', 'both', 1202),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Shower', 'ea', 'both', 1203),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Fixtures', 'ea', 'both', 1204),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Mirror', 'ea', 'materials', 1205),
('a0000000-0000-0000-0000-000000000002', 'bathrooms', 'Exhaust Fan', 'ea', 'both', 1206),
-- Finishing
('a0000000-0000-0000-0000-000000000002', 'finishing', 'Final Clean', 'ls', 'labor', 1700),
('a0000000-0000-0000-0000-000000000002', 'finishing', 'Touch-Up Paint', 'ls', 'both', 1701),
-- Contingency
('a0000000-0000-0000-0000-000000000002', 'contingency', 'Contingency Fund', 'ls', 'both', 1800);

-- Template 3: Full Gut Renovation
INSERT INTO budget_templates (id, user_id, name, description, template_type, scope_level)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  NULL,
  'Full Gut Renovation',
  'Complete renovation including structural work, all new systems, and full interior/exterior refinishing. For properties needing everything.',
  'system',
  'gut'
);

INSERT INTO budget_template_items (template_id, category, item, unit, cost_type, sort_order) VALUES
-- Soft Costs
('a0000000-0000-0000-0000-000000000003', 'soft_costs', 'Permits & Inspections', 'ls', 'both', 100),
('a0000000-0000-0000-0000-000000000003', 'soft_costs', 'Architecture/Engineering', 'ls', 'labor', 101),
('a0000000-0000-0000-0000-000000000003', 'soft_costs', 'Project Management', 'month', 'labor', 102),
('a0000000-0000-0000-0000-000000000003', 'soft_costs', 'Utilities During Construction', 'month', 'both', 103),
('a0000000-0000-0000-0000-000000000003', 'soft_costs', 'Insurance', 'month', 'both', 104),
-- Demo
('a0000000-0000-0000-0000-000000000003', 'demo', 'Interior Demo', 'sf', 'labor', 200),
('a0000000-0000-0000-0000-000000000003', 'demo', 'Exterior Demo', 'ls', 'labor', 201),
('a0000000-0000-0000-0000-000000000003', 'demo', 'Dumpster/Hauling', 'load', 'both', 202),
('a0000000-0000-0000-0000-000000000003', 'demo', 'Hazmat Abatement', 'ls', 'both', 203),
-- Structural
('a0000000-0000-0000-0000-000000000003', 'structural', 'Foundation Repair', 'ls', 'both', 300),
('a0000000-0000-0000-0000-000000000003', 'structural', 'Structural Framing', 'ls', 'both', 301),
('a0000000-0000-0000-0000-000000000003', 'structural', 'Load-Bearing Walls', 'ls', 'both', 302),
('a0000000-0000-0000-0000-000000000003', 'structural', 'Subfloor Repair/Replacement', 'sf', 'both', 303),
-- Plumbing
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Rough-In Plumbing', 'ls', 'both', 400),
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Finish Plumbing', 'ls', 'both', 401),
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Water Heater', 'ea', 'both', 402),
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Main Line/Sewer', 'ls', 'both', 403),
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Gas Lines', 'ls', 'both', 404),
('a0000000-0000-0000-0000-000000000003', 'plumbing', 'Fixtures & Faucets', 'ls', 'both', 405),
-- HVAC
('a0000000-0000-0000-0000-000000000003', 'hvac', 'Furnace', 'ea', 'both', 500),
('a0000000-0000-0000-0000-000000000003', 'hvac', 'A/C Unit', 'ea', 'both', 501),
('a0000000-0000-0000-0000-000000000003', 'hvac', 'Ductwork', 'ls', 'both', 502),
('a0000000-0000-0000-0000-000000000003', 'hvac', 'Thermostat', 'ea', 'materials', 503),
('a0000000-0000-0000-0000-000000000003', 'hvac', 'Vents/Registers', 'ea', 'both', 504),
-- Electrical
('a0000000-0000-0000-0000-000000000003', 'electrical', 'Panel Upgrade', 'ea', 'both', 600),
('a0000000-0000-0000-0000-000000000003', 'electrical', 'Rough-In Electrical', 'ls', 'both', 601),
('a0000000-0000-0000-0000-000000000003', 'electrical', 'Finish Electrical', 'ls', 'both', 602),
('a0000000-0000-0000-0000-000000000003', 'electrical', 'Fixtures/Outlets/Switches', 'ea', 'both', 603),
('a0000000-0000-0000-0000-000000000003', 'electrical', 'Lighting Fixtures', 'ea', 'both', 604),
-- Insulation/Drywall
('a0000000-0000-0000-0000-000000000003', 'insulation_drywall', 'Insulation', 'sf', 'both', 700),
('a0000000-0000-0000-0000-000000000003', 'insulation_drywall', 'Drywall Hang', 'sf', 'both', 701),
('a0000000-0000-0000-0000-000000000003', 'insulation_drywall', 'Drywall Finish/Tape', 'sf', 'labor', 702),
('a0000000-0000-0000-0000-000000000003', 'insulation_drywall', 'Texture', 'sf', 'both', 703),
-- Interior Paint
('a0000000-0000-0000-0000-000000000003', 'interior_paint', 'Wall Paint', 'sf', 'both', 800),
('a0000000-0000-0000-0000-000000000003', 'interior_paint', 'Ceiling Paint', 'sf', 'both', 801),
('a0000000-0000-0000-0000-000000000003', 'interior_paint', 'Trim Paint', 'lf', 'both', 802),
('a0000000-0000-0000-0000-000000000003', 'interior_paint', 'Door Paint', 'ea', 'both', 803),
('a0000000-0000-0000-0000-000000000003', 'interior_paint', 'Primer', 'sf', 'both', 804),
-- Flooring
('a0000000-0000-0000-0000-000000000003', 'flooring', 'Hardwood', 'sf', 'both', 900),
('a0000000-0000-0000-0000-000000000003', 'flooring', 'LVP/Laminate', 'sf', 'both', 901),
('a0000000-0000-0000-0000-000000000003', 'flooring', 'Carpet', 'sf', 'both', 902),
('a0000000-0000-0000-0000-000000000003', 'flooring', 'Subfloor Prep', 'sf', 'labor', 903),
('a0000000-0000-0000-0000-000000000003', 'flooring', 'Transitions/Molding', 'lf', 'materials', 904),
-- Tile
('a0000000-0000-0000-0000-000000000003', 'tile', 'Bathroom Floor Tile', 'sf', 'both', 1000),
('a0000000-0000-0000-0000-000000000003', 'tile', 'Bathroom Wall Tile', 'sf', 'both', 1001),
('a0000000-0000-0000-0000-000000000003', 'tile', 'Kitchen Backsplash', 'sf', 'both', 1002),
('a0000000-0000-0000-0000-000000000003', 'tile', 'Shower Tile', 'sf', 'both', 1003),
('a0000000-0000-0000-0000-000000000003', 'tile', 'Grout/Caulk', 'ls', 'materials', 1004),
-- Kitchen
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Cabinets', 'lf', 'both', 1100),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Countertops', 'sf', 'both', 1101),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Sink & Faucet', 'ea', 'both', 1102),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Appliances', 'ls', 'materials', 1103),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Backsplash', 'sf', 'both', 1104),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Hardware', 'ls', 'materials', 1105),
('a0000000-0000-0000-0000-000000000003', 'kitchen', 'Lighting', 'ea', 'both', 1106),
-- Bathrooms
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Vanity', 'ea', 'both', 1200),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Toilet', 'ea', 'both', 1201),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Tub', 'ea', 'both', 1202),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Shower', 'ea', 'both', 1203),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Fixtures', 'ea', 'both', 1204),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Mirror', 'ea', 'materials', 1205),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Exhaust Fan', 'ea', 'both', 1206),
('a0000000-0000-0000-0000-000000000003', 'bathrooms', 'Accessories', 'ls', 'materials', 1207),
-- Doors & Windows
('a0000000-0000-0000-0000-000000000003', 'doors_windows', 'Entry Door', 'ea', 'both', 1300),
('a0000000-0000-0000-0000-000000000003', 'doors_windows', 'Interior Doors', 'ea', 'both', 1301),
('a0000000-0000-0000-0000-000000000003', 'doors_windows', 'Window Replacement', 'ea', 'both', 1302),
('a0000000-0000-0000-0000-000000000003', 'doors_windows', 'Sliding Glass Door', 'ea', 'both', 1303),
('a0000000-0000-0000-0000-000000000003', 'doors_windows', 'Hardware', 'ls', 'materials', 1304),
-- Interior Trim
('a0000000-0000-0000-0000-000000000003', 'interior_trim', 'Baseboards', 'lf', 'both', 1400),
('a0000000-0000-0000-0000-000000000003', 'interior_trim', 'Crown Molding', 'lf', 'both', 1401),
('a0000000-0000-0000-0000-000000000003', 'interior_trim', 'Door Casing', 'ea', 'both', 1402),
('a0000000-0000-0000-0000-000000000003', 'interior_trim', 'Window Trim', 'ea', 'both', 1403),
('a0000000-0000-0000-0000-000000000003', 'interior_trim', 'Closet Shelving', 'ea', 'both', 1404),
-- Exterior
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Roof', 'sq', 'both', 1500),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Siding', 'sf', 'both', 1501),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Soffit/Fascia', 'lf', 'both', 1502),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Gutters', 'lf', 'both', 1503),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Exterior Paint', 'sf', 'both', 1504),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Deck/Porch', 'sf', 'both', 1505),
('a0000000-0000-0000-0000-000000000003', 'exterior', 'Garage', 'ls', 'both', 1506),
-- Landscaping
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Lawn/Sod', 'sf', 'both', 1600),
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Trees/Shrubs', 'ea', 'both', 1601),
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Mulch/Rock', 'ls', 'materials', 1602),
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Driveway', 'sf', 'both', 1603),
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Sidewalk', 'sf', 'both', 1604),
('a0000000-0000-0000-0000-000000000003', 'landscaping', 'Fence', 'lf', 'both', 1605),
-- Finishing
('a0000000-0000-0000-0000-000000000003', 'finishing', 'Final Clean', 'ls', 'labor', 1700),
('a0000000-0000-0000-0000-000000000003', 'finishing', 'Staging', 'ls', 'both', 1701),
('a0000000-0000-0000-0000-000000000003', 'finishing', 'Touch-Up Paint', 'ls', 'both', 1702),
('a0000000-0000-0000-0000-000000000003', 'finishing', 'Punch List Items', 'ls', 'both', 1703),
-- Contingency
('a0000000-0000-0000-0000-000000000003', 'contingency', 'Contingency Fund', 'ls', 'both', 1800);

-- Template 4: Investor Flip Standard
INSERT INTO budget_templates (id, user_id, name, description, template_type, scope_level)
VALUES (
  'a0000000-0000-0000-0000-000000000004',
  NULL,
  'Investor Flip Standard',
  'Typical investor flip scope without major structural or system replacements. Covers most common rehab needs for a profitable flip.',
  'system',
  'heavy'
);

INSERT INTO budget_template_items (template_id, category, item, unit, cost_type, sort_order) VALUES
-- Soft Costs
('a0000000-0000-0000-0000-000000000004', 'soft_costs', 'Permits & Inspections', 'ls', 'both', 100),
('a0000000-0000-0000-0000-000000000004', 'soft_costs', 'Utilities During Construction', 'month', 'both', 101),
-- Demo
('a0000000-0000-0000-0000-000000000004', 'demo', 'Interior Demo', 'sf', 'labor', 200),
('a0000000-0000-0000-0000-000000000004', 'demo', 'Dumpster/Hauling', 'load', 'both', 201),
-- Plumbing
('a0000000-0000-0000-0000-000000000004', 'plumbing', 'Rough-In Plumbing', 'ls', 'both', 400),
('a0000000-0000-0000-0000-000000000004', 'plumbing', 'Finish Plumbing', 'ls', 'both', 401),
('a0000000-0000-0000-0000-000000000004', 'plumbing', 'Water Heater', 'ea', 'both', 402),
('a0000000-0000-0000-0000-000000000004', 'plumbing', 'Fixtures & Faucets', 'ls', 'both', 403),
-- Electrical
('a0000000-0000-0000-0000-000000000004', 'electrical', 'Rough-In Electrical', 'ls', 'both', 600),
('a0000000-0000-0000-0000-000000000004', 'electrical', 'Finish Electrical', 'ls', 'both', 601),
('a0000000-0000-0000-0000-000000000004', 'electrical', 'Fixtures/Outlets/Switches', 'ea', 'both', 602),
('a0000000-0000-0000-0000-000000000004', 'electrical', 'Lighting Fixtures', 'ea', 'both', 603),
-- Insulation/Drywall
('a0000000-0000-0000-0000-000000000004', 'insulation_drywall', 'Drywall Repairs', 'sf', 'both', 700),
('a0000000-0000-0000-0000-000000000004', 'insulation_drywall', 'Drywall Finish/Tape', 'sf', 'labor', 701),
('a0000000-0000-0000-0000-000000000004', 'insulation_drywall', 'Texture', 'sf', 'both', 702),
-- Interior Paint
('a0000000-0000-0000-0000-000000000004', 'interior_paint', 'Wall Paint', 'sf', 'both', 800),
('a0000000-0000-0000-0000-000000000004', 'interior_paint', 'Ceiling Paint', 'sf', 'both', 801),
('a0000000-0000-0000-0000-000000000004', 'interior_paint', 'Trim Paint', 'lf', 'both', 802),
('a0000000-0000-0000-0000-000000000004', 'interior_paint', 'Door Paint', 'ea', 'both', 803),
-- Flooring
('a0000000-0000-0000-0000-000000000004', 'flooring', 'LVP/Laminate', 'sf', 'both', 900),
('a0000000-0000-0000-0000-000000000004', 'flooring', 'Carpet', 'sf', 'both', 901),
('a0000000-0000-0000-0000-000000000004', 'flooring', 'Subfloor Prep', 'sf', 'labor', 902),
('a0000000-0000-0000-0000-000000000004', 'flooring', 'Transitions/Molding', 'lf', 'materials', 903),
-- Tile
('a0000000-0000-0000-0000-000000000004', 'tile', 'Bathroom Floor Tile', 'sf', 'both', 1000),
('a0000000-0000-0000-0000-000000000004', 'tile', 'Bathroom Wall Tile', 'sf', 'both', 1001),
('a0000000-0000-0000-0000-000000000004', 'tile', 'Kitchen Backsplash', 'sf', 'both', 1002),
('a0000000-0000-0000-0000-000000000004', 'tile', 'Shower Tile', 'sf', 'both', 1003),
-- Kitchen
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Cabinets', 'lf', 'both', 1100),
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Countertops', 'sf', 'both', 1101),
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Sink & Faucet', 'ea', 'both', 1102),
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Appliances', 'ls', 'materials', 1103),
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Hardware', 'ls', 'materials', 1104),
('a0000000-0000-0000-0000-000000000004', 'kitchen', 'Lighting', 'ea', 'both', 1105),
-- Bathrooms
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Vanity', 'ea', 'both', 1200),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Toilet', 'ea', 'both', 1201),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Tub', 'ea', 'both', 1202),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Shower', 'ea', 'both', 1203),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Fixtures', 'ea', 'both', 1204),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Mirror', 'ea', 'materials', 1205),
('a0000000-0000-0000-0000-000000000004', 'bathrooms', 'Exhaust Fan', 'ea', 'both', 1206),
-- Doors & Windows
('a0000000-0000-0000-0000-000000000004', 'doors_windows', 'Entry Door', 'ea', 'both', 1300),
('a0000000-0000-0000-0000-000000000004', 'doors_windows', 'Interior Doors', 'ea', 'both', 1301),
('a0000000-0000-0000-0000-000000000004', 'doors_windows', 'Hardware', 'ls', 'materials', 1302),
-- Interior Trim
('a0000000-0000-0000-0000-000000000004', 'interior_trim', 'Baseboards', 'lf', 'both', 1400),
('a0000000-0000-0000-0000-000000000004', 'interior_trim', 'Door Casing', 'ea', 'both', 1401),
('a0000000-0000-0000-0000-000000000004', 'interior_trim', 'Window Trim', 'ea', 'both', 1402),
-- Exterior
('a0000000-0000-0000-0000-000000000004', 'exterior', 'Exterior Paint', 'sf', 'both', 1500),
('a0000000-0000-0000-0000-000000000004', 'exterior', 'Gutters', 'lf', 'both', 1501),
-- Landscaping
('a0000000-0000-0000-0000-000000000004', 'landscaping', 'Lawn/Sod', 'sf', 'both', 1600),
('a0000000-0000-0000-0000-000000000004', 'landscaping', 'Mulch/Rock', 'ls', 'materials', 1601),
-- Finishing
('a0000000-0000-0000-0000-000000000004', 'finishing', 'Final Clean', 'ls', 'labor', 1700),
('a0000000-0000-0000-0000-000000000004', 'finishing', 'Touch-Up Paint', 'ls', 'both', 1701),
('a0000000-0000-0000-0000-000000000004', 'finishing', 'Punch List Items', 'ls', 'both', 1702),
-- Contingency
('a0000000-0000-0000-0000-000000000004', 'contingency', 'Contingency Fund', 'ls', 'both', 1800);

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE budget_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_template_items;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE budget_templates IS 'Reusable budget structures that can be applied to new projects';
COMMENT ON TABLE budget_template_items IS 'Individual line items within a budget template';
COMMENT ON VIEW budget_template_summary IS 'Template metadata with aggregated item counts and totals';
