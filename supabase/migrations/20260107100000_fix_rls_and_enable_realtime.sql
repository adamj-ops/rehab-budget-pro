-- Migration: Fix RLS Policies and Enable Realtime
-- This migration:
-- 1. Recreates RLS policies that properly filter by user_id (using COALESCE for backward compatibility)
-- 2. Recreates views with SECURITY INVOKER to respect RLS
-- 3. Enables realtime for all tables

-- ============================================================================
-- 1. DROP EXISTING PERMISSIVE POLICIES
-- ============================================================================

-- Projects
DROP POLICY IF EXISTS "Allow all to view projects" ON projects;
DROP POLICY IF EXISTS "Allow all to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow all to update projects" ON projects;
DROP POLICY IF EXISTS "Allow all to delete projects" ON projects;

-- Budget Items
DROP POLICY IF EXISTS "Allow all to view budget items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to insert budget items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to update budget items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to delete budget items" ON budget_items;

-- Vendors
DROP POLICY IF EXISTS "Allow all to view vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to insert vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to update vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to delete vendors" ON vendors;

-- Draws
DROP POLICY IF EXISTS "Allow all to view draws" ON draws;
DROP POLICY IF EXISTS "Allow all to insert draws" ON draws;
DROP POLICY IF EXISTS "Allow all to update draws" ON draws;
DROP POLICY IF EXISTS "Allow all to delete draws" ON draws;

-- ============================================================================
-- 2. CREATE PROPER RLS POLICIES
-- These policies:
-- - Filter by user_id when user is authenticated
-- - Allow access to rows with null user_id (for backward compatibility during migration)
-- ============================================================================

-- Projects Policies
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Vendors Policies
CREATE POLICY "vendors_select_policy" ON vendors
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "vendors_insert_policy" ON vendors
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "vendors_update_policy" ON vendors
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "vendors_delete_policy" ON vendors
  FOR DELETE USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Budget Items Policies (via project ownership)
CREATE POLICY "budget_items_select_policy" ON budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_items.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "budget_items_insert_policy" ON budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_items.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "budget_items_update_policy" ON budget_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_items.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "budget_items_delete_policy" ON budget_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_items.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

-- Draws Policies (via project ownership)
CREATE POLICY "draws_select_policy" ON draws
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = draws.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "draws_insert_policy" ON draws
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = draws.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "draws_update_policy" ON draws
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = draws.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

CREATE POLICY "draws_delete_policy" ON draws
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = draws.project_id
      AND (auth.uid() = p.user_id OR p.user_id IS NULL)
    )
  );

-- ============================================================================
-- 3. RECREATE VIEWS WITH SECURITY INVOKER
-- This ensures views respect RLS policies
-- ============================================================================

DROP VIEW IF EXISTS project_summary;
DROP VIEW IF EXISTS budget_by_category;
DROP VIEW IF EXISTS vendor_payment_summary;

-- Project Summary with calculated fields (SECURITY INVOKER)
CREATE VIEW project_summary
WITH (security_invoker = true)
AS
SELECT
  p.*,

  -- Budget Rollups (using the three-column model)
  COALESCE(SUM(bi.underwriting_amount), 0) AS rehab_underwriting,
  COALESCE(SUM(bi.forecast_amount), 0) AS rehab_forecast,
  COALESCE(SUM(bi.actual_amount), 0) AS rehab_actual,

  -- Primary budget is forecast if set, otherwise underwriting
  COALESCE(
    NULLIF(SUM(bi.forecast_amount), 0),
    SUM(bi.underwriting_amount),
    0
  ) AS rehab_budget,

  -- Contingency calculated on primary budget
  COALESCE(
    NULLIF(SUM(bi.forecast_amount), 0),
    SUM(bi.underwriting_amount),
    0
  ) * (p.contingency_percent / 100) AS contingency_amount,

  -- Total with contingency
  COALESCE(
    NULLIF(SUM(bi.forecast_amount), 0),
    SUM(bi.underwriting_amount),
    0
  ) * (1 + p.contingency_percent / 100) AS rehab_budget_with_contingency,

  -- Selling Costs
  p.arv * (p.selling_cost_percent / 100) AS selling_costs,

  -- Holding Costs Total
  p.holding_costs_monthly * p.hold_months AS holding_costs_total,

  -- Total Investment
  p.purchase_price
    + COALESCE(
        NULLIF(SUM(bi.forecast_amount), 0),
        SUM(bi.underwriting_amount),
        0
      ) * (1 + p.contingency_percent / 100)
    + p.closing_costs
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100) AS total_investment,

  -- Profit
  p.arv - (
    p.purchase_price
    + COALESCE(
        NULLIF(SUM(bi.forecast_amount), 0),
        SUM(bi.underwriting_amount),
        0
      ) * (1 + p.contingency_percent / 100)
    + p.closing_costs
    + (p.holding_costs_monthly * p.hold_months)
    + (p.arv * p.selling_cost_percent / 100)
  ) AS gross_profit,

  -- MAO (70% Rule)
  (p.arv * 0.70) - (
    COALESCE(
      NULLIF(SUM(bi.forecast_amount), 0),
      SUM(bi.underwriting_amount),
      0
    ) * (1 + p.contingency_percent / 100)
  ) AS mao,

  -- Item Counts
  COUNT(bi.id) AS total_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'complete') AS completed_items,
  COUNT(bi.id) FILTER (WHERE bi.status = 'in_progress') AS in_progress_items

FROM projects p
LEFT JOIN budget_items bi ON bi.project_id = p.id
GROUP BY p.id;

-- Budget by Category (SECURITY INVOKER)
CREATE VIEW budget_by_category
WITH (security_invoker = true)
AS
SELECT
  project_id,
  category,
  COUNT(*) AS item_count,
  SUM(underwriting_amount) AS underwriting_total,
  SUM(forecast_amount) AS forecast_total,
  SUM(actual_amount) AS actual_total,
  SUM(underwriting_amount) - COALESCE(SUM(actual_amount), 0) AS variance,
  COUNT(*) FILTER (WHERE status = 'complete') AS completed_count
FROM budget_items
GROUP BY project_id, category
ORDER BY category;

-- Vendor Payment Summary (SECURITY INVOKER)
CREATE VIEW vendor_payment_summary
WITH (security_invoker = true)
AS
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
-- 4. ENABLE REALTIME
-- ============================================================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE budget_items;
ALTER PUBLICATION supabase_realtime ADD TABLE vendors;
ALTER PUBLICATION supabase_realtime ADD TABLE draws;

-- ============================================================================
-- 5. ADD COMMENTS
-- ============================================================================

COMMENT ON POLICY "projects_select_policy" ON projects IS 'Users can view their own projects, or projects without an owner (legacy data)';
COMMENT ON POLICY "projects_insert_policy" ON projects IS 'Users can insert projects for themselves';
COMMENT ON POLICY "projects_update_policy" ON projects IS 'Users can update their own projects';
COMMENT ON POLICY "projects_delete_policy" ON projects IS 'Users can delete their own projects';

COMMENT ON VIEW project_summary IS 'Project data with calculated budget totals. Uses SECURITY INVOKER to respect RLS.';
COMMENT ON VIEW budget_by_category IS 'Budget items aggregated by category. Uses SECURITY INVOKER to respect RLS.';
COMMENT ON VIEW vendor_payment_summary IS 'Vendor data with payment totals. Uses SECURITY INVOKER to respect RLS.';
