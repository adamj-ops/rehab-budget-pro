-- ============================================================================
-- PROFILES TABLE & AUTH SETUP
-- Creates extended user profiles and re-enables proper RLS policies
-- ============================================================================

-- Drop the temporary permissive policies
DROP POLICY IF EXISTS "Allow all to view projects" ON projects;
DROP POLICY IF EXISTS "Allow all to insert projects" ON projects;
DROP POLICY IF EXISTS "Allow all to update projects" ON projects;
DROP POLICY IF EXISTS "Allow all to delete projects" ON projects;

DROP POLICY IF EXISTS "Allow all to view budget_items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to insert budget_items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to update budget_items" ON budget_items;
DROP POLICY IF EXISTS "Allow all to delete budget_items" ON budget_items;

DROP POLICY IF EXISTS "Allow all to view draws" ON draws;
DROP POLICY IF EXISTS "Allow all to insert draws" ON draws;
DROP POLICY IF EXISTS "Allow all to update draws" ON draws;
DROP POLICY IF EXISTS "Allow all to delete draws" ON draws;

DROP POLICY IF EXISTS "Allow all to view vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to insert vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to update vendors" ON vendors;
DROP POLICY IF EXISTS "Allow all to delete vendors" ON vendors;

DROP POLICY IF EXISTS "Allow all to view line_item_photos" ON line_item_photos;
DROP POLICY IF EXISTS "Allow all to insert line_item_photos" ON line_item_photos;
DROP POLICY IF EXISTS "Allow all to delete line_item_photos" ON line_item_photos;

DROP POLICY IF EXISTS "Allow all to view cost_reference" ON cost_reference;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,

  -- Preferences
  default_market TEXT DEFAULT 'minneapolis_metro',
  default_contingency_percent NUMERIC(5,2) DEFAULT 10.00,
  default_holding_cost_monthly NUMERIC(12,2) DEFAULT 1500.00,
  default_selling_cost_percent NUMERIC(5,2) DEFAULT 8.00,

  -- Subscription/Tier (for future use)
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),

  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- RE-ENABLE PROPER RLS POLICIES
-- ============================================================================

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Vendors policies
CREATE POLICY "Users can view own vendors"
  ON vendors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  USING (auth.uid() = user_id);

-- Budget items policies (through project ownership)
CREATE POLICY "Users can view own budget items"
  ON budget_items FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own budget items"
  ON budget_items FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own budget items"
  ON budget_items FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own budget items"
  ON budget_items FOR DELETE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Draws policies (through project ownership)
CREATE POLICY "Users can view own draws"
  ON draws FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own draws"
  ON draws FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own draws"
  ON draws FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own draws"
  ON draws FOR DELETE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Line item photos policies (through project ownership)
CREATE POLICY "Users can view own line item photos"
  ON line_item_photos FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own line item photos"
  ON line_item_photos FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own line item photos"
  ON line_item_photos FOR DELETE
  USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Cost reference is public (read-only reference data)
CREATE POLICY "Anyone can view cost reference"
  ON cost_reference FOR SELECT
  USING (true);

-- ============================================================================
-- UPDATED_AT TRIGGER FOR PROFILES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
