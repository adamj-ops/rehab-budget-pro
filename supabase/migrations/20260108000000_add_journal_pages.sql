-- ============================================================================
-- JOURNAL PAGES - Notion-style notebook for project documentation
-- ============================================================================

-- Page type enum
CREATE TYPE journal_page_type AS ENUM (
  'note',
  'meeting',
  'checklist',
  'idea',
  'research',
  'site_visit'
);

-- Main journal pages table
CREATE TABLE journal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Optional project tag
  
  -- Page content
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT, -- Rich text HTML
  icon TEXT DEFAULT '📝', -- Emoji icon
  
  -- Classification
  page_type journal_page_type DEFAULT 'note',
  
  -- Flags
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_journal_pages_user_id ON journal_pages(user_id);
CREATE INDEX idx_journal_pages_project_id ON journal_pages(project_id);
CREATE INDEX idx_journal_pages_created_at ON journal_pages(created_at DESC);
CREATE INDEX idx_journal_pages_is_pinned ON journal_pages(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_journal_pages_is_archived ON journal_pages(is_archived);

-- Full-text search index
CREATE INDEX idx_journal_pages_search ON journal_pages 
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Auto-update updated_at trigger
CREATE TRIGGER update_journal_pages_updated_at
  BEFORE UPDATE ON journal_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE journal_pages ENABLE ROW LEVEL SECURITY;

-- For development: Allow all access (matches existing pattern)
CREATE POLICY "Allow all to view journal pages" ON journal_pages
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert journal pages" ON journal_pages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update journal pages" ON journal_pages
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete journal pages" ON journal_pages
  FOR DELETE USING (true);

-- Comments for documentation
COMMENT ON TABLE journal_pages IS 'Notion-style journal/notebook pages with optional project tagging';
COMMENT ON COLUMN journal_pages.project_id IS 'Optional link to a project - NULL for general notes';
COMMENT ON COLUMN journal_pages.icon IS 'Emoji icon displayed with the page title';
COMMENT ON COLUMN journal_pages.page_type IS 'Classification: note, meeting, checklist, idea, research, site_visit';

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE journal_pages;
