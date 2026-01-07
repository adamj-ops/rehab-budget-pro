-- ============================================================================
-- PORTFOLIO DASHBOARD VIEWS
-- Creates aggregated views for portfolio-level analytics
-- ============================================================================

-- Portfolio summary view (aggregated metrics across all projects)
CREATE OR REPLACE VIEW portfolio_summary AS
SELECT
  user_id,
  COUNT(*)::integer as total_projects,
  COUNT(*) FILTER (WHERE status NOT IN ('sold', 'dead'))::integer as active_projects,
  COUNT(*) FILTER (WHERE status = 'lead')::integer as lead_count,
  COUNT(*) FILTER (WHERE status = 'analyzing')::integer as analyzing_count,
  COUNT(*) FILTER (WHERE status = 'under_contract')::integer as under_contract_count,
  COUNT(*) FILTER (WHERE status = 'in_rehab')::integer as in_rehab_count,
  COUNT(*) FILTER (WHERE status = 'listed')::integer as listed_count,
  COUNT(*) FILTER (WHERE status = 'sold')::integer as sold_count,

  -- Financial aggregates
  COALESCE(SUM(arv) FILTER (WHERE status NOT IN ('sold', 'dead')), 0)::numeric as total_arv,
  COALESCE(SUM(total_investment) FILTER (WHERE status NOT IN ('sold', 'dead')), 0)::numeric as capital_deployed,
  COALESCE(SUM(gross_profit) FILTER (WHERE status = 'sold'), 0)::numeric as total_profit,
  COALESCE(AVG(CASE WHEN total_investment > 0 THEN (gross_profit / total_investment * 100) ELSE 0 END) FILTER (WHERE status = 'sold'), 0)::numeric as avg_roi,

  -- Budget aggregates
  COALESCE(SUM(rehab_budget), 0)::numeric as total_budget,
  COALESCE(SUM(rehab_actual), 0)::numeric as total_actual,

  -- Risk indicators
  COUNT(*) FILTER (WHERE rehab_actual > rehab_budget AND status = 'in_rehab')::integer as over_budget_count,
  COUNT(*) FILTER (WHERE target_complete_date < NOW() AND status = 'in_rehab')::integer as behind_schedule_count
FROM project_summary
GROUP BY user_id;

-- Enable RLS on the view (through the underlying table)
COMMENT ON VIEW portfolio_summary IS 'Aggregated portfolio metrics across all user projects';

-- Category totals view (budget breakdown by category across all active projects)
CREATE OR REPLACE VIEW category_totals AS
SELECT
  p.user_id,
  bi.category,
  COALESCE(SUM(bi.underwriting_amount), 0)::numeric as total_underwriting,
  COALESCE(SUM(bi.forecast_amount), 0)::numeric as total_forecast,
  COALESCE(SUM(bi.actual_amount), 0)::numeric as total_actual,
  COALESCE(SUM(COALESCE(NULLIF(bi.forecast_amount, 0), bi.underwriting_amount)), 0)::numeric as total_budget,
  COALESCE(SUM(bi.actual_amount) - SUM(COALESCE(NULLIF(bi.forecast_amount, 0), bi.underwriting_amount)), 0)::numeric as variance,
  COUNT(*)::integer as item_count
FROM budget_items bi
JOIN projects p ON bi.project_id = p.id
WHERE p.status NOT IN ('sold', 'dead')
GROUP BY p.user_id, bi.category
ORDER BY total_actual DESC;

COMMENT ON VIEW category_totals IS 'Budget totals grouped by category for portfolio analysis';

-- Projects with risk indicators view
CREATE OR REPLACE VIEW projects_with_risks AS
SELECT
  ps.*,
  CASE WHEN rehab_actual > rehab_budget AND status = 'in_rehab' THEN true ELSE false END as is_over_budget,
  CASE WHEN target_complete_date < NOW() AND status = 'in_rehab' THEN true ELSE false END as is_behind_schedule,
  CASE WHEN total_investment > 0 AND (gross_profit / total_investment * 100) < 10 THEN true ELSE false END as is_low_roi,
  COALESCE(rehab_actual - rehab_budget, 0)::numeric as budget_variance,
  CASE
    WHEN target_complete_date IS NOT NULL AND status = 'in_rehab'
    THEN GREATEST(0, EXTRACT(DAY FROM NOW() - target_complete_date)::integer)
    ELSE 0
  END as days_overdue,
  CASE
    WHEN contingency_amount > 0
    THEN LEAST(100, GREATEST(0, ((rehab_actual - rehab_budget) / contingency_amount * 100)))::numeric
    ELSE 0
  END as contingency_used_percent
FROM project_summary ps;

COMMENT ON VIEW projects_with_risks IS 'Projects with computed risk indicators for alerts';

-- Grant access to authenticated users (RLS will filter by user_id)
-- Note: Views inherit RLS from their underlying tables
