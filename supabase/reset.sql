-- ============================================================================
-- RESET DATABASE - Drop all existing tables
-- ============================================================================

-- Drop all views first
DROP VIEW IF EXISTS vendor_payment_summary CASCADE;
DROP VIEW IF EXISTS budget_by_category CASCADE;
DROP VIEW IF EXISTS project_summary CASCADE;

-- Drop all tables
DROP TABLE IF EXISTS cost_reference CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS budget_items CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS draw_milestone CASCADE;
DROP TYPE IF EXISTS draw_status CASCADE;
DROP TYPE IF EXISTS vendor_status CASCADE;
DROP TYPE IF EXISTS vendor_trade CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;
DROP TYPE IF EXISTS cost_type CASCADE;
DROP TYPE IF EXISTS unit_type CASCADE;
DROP TYPE IF EXISTS budget_category CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
