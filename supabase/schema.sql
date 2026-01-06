-- ============================================================================
-- REHAB BUDGET PRO - Database Schema
-- Simple, focused budget tracking for fix & flip projects
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE project_status AS ENUM (
  'lead',
  'analyzing',
  'under_contract',
  'in_rehab',
  'listed',
  'sold',
  'dead'
);

CREATE TYPE property_type AS ENUM (
  'sfh',
  'duplex',
  'triplex',
  'fourplex',
  'townhouse',
  'condo'
);

CREATE TYPE budget_category AS ENUM (
  'soft_costs',
  'demo',
  'structural',
  'plumbing',
  'hvac',
  'electrical',
  'insulation_drywall',
  'interior_paint',
  'flooring',
  'tile',
  'kitchen',
  'bathrooms',
  'doors_windows',
  'interior_trim',
  'exterior',
  'landscaping',
  'finishing',
  'contingency'
);

CREATE TYPE unit_type AS ENUM (
  'sf',
  'lf',
  'ea',
  'ls',
  'sq',
  'hr',
  'day',
  'week',
  'month'
);

CREATE TYPE cost_type AS ENUM (
  'labor',
  'materials',
  'both'
);

CREATE TYPE item_status AS ENUM (
  'not_started',
  'in_progress',
  'complete',
  'on_hold',
  'cancelled'
);

CREATE TYPE vendor_trade AS ENUM (
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
  'other'
);

CREATE TYPE vendor_status AS ENUM (
  'active',
  'inactive',
  'do_not_use'
);

CREATE TYPE draw_status AS ENUM (
  'pending',
  'approved',
  'paid'
);

CREATE TYPE draw_milestone AS ENUM (
  'project_start',
  'demo_complete',
  'rough_in',
  'drywall',
  'finishes',
  'final'
);

CREATE TYPE payment_method AS ENUM (
  'check',
  'zelle',
  'venmo',
  'wire',
  'cash',
  'credit_card',
  'other'
);

-- ============================================================================
-- 1. PROJECTS TABLE
-- ============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Property Info
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'MN',
  zip TEXT,
  beds NUMERIC(3,1),
  baths NUMERIC(3,1),
  sqft INTEGER,
  year_built INTEGER,
  property_type property_type DEFAULT 'sfh',
  
  -- Financials
  arv NUMERIC(12,2),
  purchase_price NUMERIC(12,2),
  closing_costs NUMERIC(10,2) DEFAULT 0,
  holding_costs_monthly NUMERIC(10,2) DEFAULT 0,
  hold_months NUMERIC(4,1) DEFAULT 4,
  selling_cost_percent NUMERIC(4,2) DEFAULT 8.00,
  contingency_percent NUMERIC(4,2) DEFAULT 10.00,
  
  -- Status & Dates
  status project_status DEFAULT 'lead',
  contract_date DATE,
  close_date DATE,
  rehab_start_date DATE,
  target_complete_date DATE,
  list_date DATE,
  sale_date DATE,
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- 2. VENDORS TABLE (Master List)
-- ============================================================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  trade vendor_trade NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  
  -- Qualifications
  licensed BOOLEAN DEFAULT FALSE,
  insured BOOLEAN DEFAULT FALSE,
  w9_on_file BOOLEAN DEFAULT FALSE,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  reliability TEXT CHECK (reliability IN ('excellent', 'good', 'fair', 'poor')),
  price_level TEXT CHECK (price_level IN ('$', '$$', '$$$')),
  
  -- Status
  status vendor_status DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_trade ON vendors(trade);
CREATE INDEX idx_vendors_status ON vendors(status);

-- ============================================================================
-- 3. BUDGET ITEMS TABLE
-- ============================================================================

CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Item Details
  category budget_category NOT NULL,
  item TEXT NOT NULL,
  description TEXT,
  room_area TEXT, -- Kitchen, Master Bath, etc.
  
  -- Quantities & Costs
  qty NUMERIC(10,2) DEFAULT 1,
  unit unit_type DEFAULT 'ea',
  rate NUMERIC(10,2) DEFAULT 0,
  actual NUMERIC(10,2),
  
  -- Classification
  cost_type cost_type DEFAULT 'both',
  status item_status DEFAULT 'not_started',
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  
  -- Meta
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budget_items_project_id ON budget_items(project_id);
CREATE INDEX idx_budget_items_category ON budget_items(category);
CREATE INDEX idx_budget_items_vendor_id ON budget_items(vendor_id);
CREATE INDEX idx_budget_items_status ON budget_items(status);

-- ============================================================================
-- 4. DRAWS TABLE (Payments)
-- ============================================================================

CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  
  -- Draw Info
  draw_number INTEGER NOT NULL,
  milestone draw_milestone,
  description TEXT,
  percent_complete NUMERIC(5,2),
  amount NUMERIC(10,2) NOT NULL,
  
  -- Dates & Status
  date_requested DATE,
  date_paid DATE,
  status draw_status DEFAULT 'pending',
  
  -- Payment Details
  payment_method payment_method,
  reference_number TEXT,
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_draws_project_id ON draws(project_id);
CREATE INDEX idx_draws_vendor_id ON draws(vendor_id);
CREATE INDEX idx_draws_status ON draws(status);

-- ============================================================================
-- 5. COST REFERENCE TABLE (Lookup/Seed Data)
-- ============================================================================

CREATE TABLE cost_reference (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  category budget_category NOT NULL,
  item TEXT NOT NULL,
  description TEXT,
  unit unit_type DEFAULT 'ea',
  
  -- Price Ranges
  low NUMERIC(10,2),
  mid NUMERIC(10,2),
  high NUMERIC(10,2),
  
  -- Meta
  market TEXT DEFAULT 'minneapolis',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_cost_reference_category ON cost_reference(category);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Project Summary with calculated fields
CREATE VIEW project_summary AS
SELECT 
  p.*,
  
  -- Budget Rollups
  COALESCE(SUM(bi.qty * bi.rate), 0) AS rehab_budget,
  COALESCE(SUM(bi.actual), 0) AS rehab_actual,
  COALESCE(SUM(bi.qty * bi.rate), 0) * (p.contingency_percent / 100) AS contingency_amount,
  
  -- Total Calculations
  COALESCE(SUM(bi.qty * bi.rate), 0) * (1 + p.contingency_percent / 100) AS rehab_budget_with_contingency,
  
  -- Selling Costs
  p.arv * (p.selling_cost_percent / 100) AS selling_costs,
  
  -- Holding Costs Total
  p.holding_costs_monthly * p.hold_months AS holding_costs_total,
  
  -- Total Investment
  p.purchase_price 
    + COALESCE(SUM(bi.qty * bi.rate), 0) * (1 + p.contingency_percent / 100)
    + p.closing_costs 
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100) AS total_investment,
  
  -- Profit & ROI
  p.arv - (
    p.purchase_price 
    + COALESCE(SUM(bi.qty * bi.rate), 0) * (1 + p.contingency_percent / 100)
    + p.closing_costs 
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100)
  ) AS gross_profit,
  
  -- MAO (70% Rule)
  (p.arv * 0.70) - (COALESCE(SUM(bi.qty * bi.rate), 0) * (1 + p.contingency_percent / 100)) AS mao,
  
  -- Item Counts
  COUNT(bi.id) AS total_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'complete') AS completed_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'in_progress') AS in_progress_items

FROM projects p
LEFT JOIN budget_items bi ON bi.project_id = p.id
GROUP BY p.id;

-- Budget by Category
CREATE VIEW budget_by_category AS
SELECT 
  project_id,
  category,
  COUNT(*) AS item_count,
  SUM(qty * rate) AS budget_total,
  SUM(actual) AS actual_total,
  SUM(qty * rate) - COALESCE(SUM(actual), 0) AS variance,
  COUNT(*) FILTER (WHERE status = 'complete') AS completed_count
FROM budget_items
GROUP BY project_id, category
ORDER BY category;

-- Vendor Payment Summary
CREATE VIEW vendor_payment_summary AS
SELECT 
  v.*,
  COUNT(DISTINCT bi.project_id) AS projects_count,
  COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'paid'), 0) AS total_paid,
  COALESCE(SUM(d.amount) FILTER (WHERE d.status = 'pending'), 0) AS pending_amount
FROM vendors v
LEFT JOIN budget_items bi ON bi.vendor_id = v.id
LEFT JOIN draws d ON d.vendor_id = v.id
GROUP BY v.id;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only see their own
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Vendors: Users can only see their own
CREATE POLICY "Users can view own vendors" ON vendors
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vendors" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vendors" ON vendors
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vendors" ON vendors
  FOR DELETE USING (auth.uid() = user_id);

-- Budget Items: Users can manage items for their own projects
CREATE POLICY "Users can view own budget items" ON budget_items
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own budget items" ON budget_items
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own budget items" ON budget_items
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own budget items" ON budget_items
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Draws: Users can manage draws for their own projects
CREATE POLICY "Users can view own draws" ON draws
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own draws" ON draws
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own draws" ON draws
  FOR UPDATE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own draws" ON draws
  FOR DELETE USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Cost Reference: Public read access (seed data)
CREATE POLICY "Anyone can view cost reference" ON cost_reference
  FOR SELECT USING (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER budget_items_updated_at
  BEFORE UPDATE ON budget_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER draws_updated_at
  BEFORE UPDATE ON draws
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
