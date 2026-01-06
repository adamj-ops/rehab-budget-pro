-- Temporary migration to allow anonymous access during development (before auth is implemented)
-- This should be removed once proper authentication is in place

-- Drop existing RLS policies on projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create permissive policies for development
CREATE POLICY "Allow all to view projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert projects" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update projects" ON projects
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete projects" ON projects
  FOR DELETE USING (true);

-- Drop existing RLS policies on budget_items
DROP POLICY IF EXISTS "Users can view budget items for own projects" ON budget_items;
DROP POLICY IF EXISTS "Users can insert budget items for own projects" ON budget_items;
DROP POLICY IF EXISTS "Users can update budget items for own projects" ON budget_items;
DROP POLICY IF EXISTS "Users can delete budget items for own projects" ON budget_items;

-- Create permissive policies for budget_items
CREATE POLICY "Allow all to view budget items" ON budget_items
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert budget items" ON budget_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update budget items" ON budget_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete budget items" ON budget_items
  FOR DELETE USING (true);

-- Drop existing RLS policies on vendors
DROP POLICY IF EXISTS "Users can view own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;

-- Create permissive policies for vendors
CREATE POLICY "Allow all to view vendors" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert vendors" ON vendors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update vendors" ON vendors
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete vendors" ON vendors
  FOR DELETE USING (true);

-- Drop existing RLS policies on draws
DROP POLICY IF EXISTS "Users can view draws for own projects" ON draws;
DROP POLICY IF EXISTS "Users can insert draws for own projects" ON draws;
DROP POLICY IF EXISTS "Users can update draws for own projects" ON draws;
DROP POLICY IF EXISTS "Users can delete draws for own projects" ON draws;

-- Create permissive policies for draws
CREATE POLICY "Allow all to view draws" ON draws
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert draws" ON draws
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update draws" ON draws
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete draws" ON draws
  FOR DELETE USING (true);

COMMENT ON POLICY "Allow all to view projects" ON projects IS 'TEMPORARY: Remove once auth is implemented';
COMMENT ON POLICY "Allow all to insert projects" ON projects IS 'TEMPORARY: Remove once auth is implemented';
