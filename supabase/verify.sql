-- Verification script to check schema and data

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Count rows in each table
SELECT
  'projects' AS table_name, COUNT(*) AS row_count FROM projects
UNION ALL
SELECT 'vendors', COUNT(*) FROM vendors
UNION ALL
SELECT 'budget_items', COUNT(*) FROM budget_items
UNION ALL
SELECT 'draws', COUNT(*) FROM draws
UNION ALL
SELECT 'cost_reference', COUNT(*) FROM cost_reference;

-- Verify enum types exist
SELECT
  t.typname AS enum_name,
  COUNT(e.enumlabel) AS value_count
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE t.typname IN (
  'project_status', 'property_type', 'budget_category',
  'unit_type', 'cost_type', 'item_status', 'vendor_trade',
  'vendor_status', 'draw_status', 'draw_milestone', 'payment_method'
)
GROUP BY t.typname
ORDER BY t.typname;

-- Sample cost reference data
SELECT category, COUNT(*) AS item_count
FROM cost_reference
GROUP BY category
ORDER BY category;
