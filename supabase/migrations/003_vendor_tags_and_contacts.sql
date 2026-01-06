-- ============================================================================
-- Migration: Vendor Tags and Contact History
-- Description: Add custom tags/categories for vendors and contact history logging
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE contact_type AS ENUM (
  'phone_call',
  'text_message',
  'email',
  'in_person',
  'site_visit',
  'quote_request',
  'quote_received',
  'job_assigned',
  'job_completed',
  'payment',
  'other'
);

-- ============================================================================
-- VENDOR TAGS TABLE
-- ============================================================================

CREATE TABLE vendor_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique tag names per user
  UNIQUE(user_id, name)
);

-- Indexes
CREATE INDEX idx_vendor_tags_user_id ON vendor_tags(user_id);

-- ============================================================================
-- VENDOR TAG ASSIGNMENTS (Junction Table)
-- ============================================================================

CREATE TABLE vendor_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES vendor_tags(id) ON DELETE CASCADE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate assignments
  UNIQUE(vendor_id, tag_id)
);

-- Indexes
CREATE INDEX idx_vendor_tag_assignments_vendor_id ON vendor_tag_assignments(vendor_id);
CREATE INDEX idx_vendor_tag_assignments_tag_id ON vendor_tag_assignments(tag_id);

-- ============================================================================
-- VENDOR CONTACTS (Contact History)
-- ============================================================================

CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Optional project context

  -- Contact Details
  contact_type contact_type NOT NULL,
  contact_date TIMESTAMPTZ DEFAULT NOW(),
  subject TEXT,
  notes TEXT,

  -- Follow-up
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX idx_vendor_contacts_user_id ON vendor_contacts(user_id);
CREATE INDEX idx_vendor_contacts_project_id ON vendor_contacts(project_id);
CREATE INDEX idx_vendor_contacts_contact_date ON vendor_contacts(contact_date DESC);
CREATE INDEX idx_vendor_contacts_follow_up ON vendor_contacts(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND follow_up_completed = FALSE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE vendor_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

-- Vendor Tags: Users can only see their own tags
CREATE POLICY "Users can view own tags" ON vendor_tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tags" ON vendor_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tags" ON vendor_tags
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tags" ON vendor_tags
  FOR DELETE USING (auth.uid() = user_id);

-- Tag Assignments: Users can manage assignments for their own vendors
CREATE POLICY "Users can view own tag assignments" ON vendor_tag_assignments
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own tag assignments" ON vendor_tag_assignments
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own tag assignments" ON vendor_tag_assignments
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Vendor Contacts: Users can manage contacts for their own vendors
CREATE POLICY "Users can view own vendor contacts" ON vendor_contacts
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own vendor contacts" ON vendor_contacts
  FOR INSERT WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own vendor contacts" ON vendor_contacts
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own vendor contacts" ON vendor_contacts
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER vendor_tags_updated_at
  BEFORE UPDATE ON vendor_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER vendor_contacts_updated_at
  BEFORE UPDATE ON vendor_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Vendor with tags view
CREATE VIEW vendor_with_tags AS
SELECT
  v.*,
  COALESCE(
    json_agg(
      json_build_object('id', vt.id, 'name', vt.name, 'color', vt.color)
    ) FILTER (WHERE vt.id IS NOT NULL),
    '[]'::json
  ) AS tags
FROM vendors v
LEFT JOIN vendor_tag_assignments vta ON vta.vendor_id = v.id
LEFT JOIN vendor_tags vt ON vt.id = vta.tag_id
GROUP BY v.id;

-- Vendor contact summary
CREATE VIEW vendor_contact_summary AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  COUNT(vc.id) AS total_contacts,
  MAX(vc.contact_date) AS last_contact_date,
  COUNT(vc.id) FILTER (WHERE vc.follow_up_date IS NOT NULL AND vc.follow_up_completed = FALSE) AS pending_follow_ups
FROM vendors v
LEFT JOIN vendor_contacts vc ON vc.vendor_id = v.id
GROUP BY v.id, v.name;
