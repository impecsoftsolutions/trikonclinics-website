-- ============================================================================
-- FIX EVENT SAVE ERROR - SCHEMA CACHE ISSUE
-- ============================================================================
--
-- PROBLEM:
--   Event form cannot save
--   Error: "Could not find the 'event_time' column of 'events' in the schema cache"
--
-- ROOT CAUSE:
--   Phase 3 columns were never added to the events table
--   PostgREST API schema cache doesn't recognize the new columns
--
-- SOLUTION:
--   1. Add all missing Phase 3 columns
--   2. Force PostgREST to reload its schema cache
--
-- HOW TO APPLY:
--   1. Go to: https://supabase.com/dashboard
--   2. Open your project
--   3. Click "SQL Editor" in left sidebar
--   4. Click "New Query"
--   5. Copy and paste this ENTIRE SQL script
--   6. Click "Run"
--   7. You should see "Success. No rows returned"
--   8. Event form will now save successfully!
--
-- ============================================================================

-- STEP 1: Add all Phase 3 columns to events table
-- These columns enable the full event form functionality

-- Add short_description (brief summary for event cards)
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description text DEFAULT '';

-- Add full_description (complete event details)
ALTER TABLE events ADD COLUMN IF NOT EXISTS full_description text DEFAULT '';

-- Add event_time (time of day when event occurs)
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time time;

-- Add venue (location or venue name)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;

-- Add highlights (array of key event highlights)
ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT ARRAY[]::text[];

-- Add updated_by (track who last modified the event)
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by uuid;

-- STEP 2: Add foreign key constraint for updated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_updated_by_fkey'
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- STEP 3: Create url_redirects table (for slug change tracking)
CREATE TABLE IF NOT EXISTS url_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- STEP 4: Enable RLS on url_redirects
ALTER TABLE url_redirects ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies for url_redirects
DROP POLICY IF EXISTS "Anyone authenticated can view redirects" ON url_redirects;
CREATE POLICY "Anyone authenticated can view redirects"
  ON url_redirects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Content Manager and above can create redirects" ON url_redirects;
CREATE POLICY "Content Manager and above can create redirects"
  ON url_redirects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'content_manager')
      AND users.is_enabled = true
    )
  );

-- STEP 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_url_redirects_old_slug ON url_redirects(old_slug);
CREATE INDEX IF NOT EXISTS idx_url_redirects_new_slug ON url_redirects(new_slug);
CREATE INDEX IF NOT EXISTS idx_url_redirects_event_id ON url_redirects(event_id);
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON events(updated_by);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue) WHERE venue IS NOT NULL;

-- STEP 7: Add constraints for data validation
ALTER TABLE events DROP CONSTRAINT IF EXISTS venue_length_check;
ALTER TABLE events ADD CONSTRAINT venue_length_check
  CHECK (venue IS NULL OR char_length(venue) <= 200);

ALTER TABLE events DROP CONSTRAINT IF EXISTS short_description_length_check;
ALTER TABLE events ADD CONSTRAINT short_description_length_check
  CHECK (short_description IS NULL OR (char_length(short_description) >= 1 AND char_length(short_description) <= 500));

ALTER TABLE events DROP CONSTRAINT IF EXISTS highlights_array_size_check;
ALTER TABLE events ADD CONSTRAINT highlights_array_size_check
  CHECK (array_length(highlights, 1) IS NULL OR array_length(highlights, 1) <= 10);

-- STEP 8: Force PostgREST schema cache reload
-- This is CRITICAL - without this, the API won't recognize the new columns
COMMENT ON TABLE events IS 'Events table - Phase 3 columns added - Schema cache refreshed';
COMMENT ON COLUMN events.event_time IS 'Time when the event occurs (optional)';
COMMENT ON COLUMN events.venue IS 'Location or venue name for the event (max 200 chars, optional)';
COMMENT ON COLUMN events.short_description IS 'Brief summary for event cards (160-200 chars recommended)';
COMMENT ON COLUMN events.full_description IS 'Complete event details with rich text content';
COMMENT ON COLUMN events.highlights IS 'Array of key event highlights (max 10 items, 150 chars each)';
COMMENT ON COLUMN events.updated_by IS 'User who last modified the event';

-- STEP 9: Send reload notification to PostgREST
-- This forces PostgREST to immediately refresh its schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
--
-- After running this SQL, verify the columns exist:
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'events'
-- AND column_name IN ('event_time', 'venue', 'short_description', 'full_description', 'highlights', 'updated_by')
-- ORDER BY column_name;
--
-- You should see all 6 columns listed.
--
-- ============================================================================
-- WHAT THIS FIXES
-- ============================================================================
--
-- BEFORE: Event form shows error when saving:
--   "Could not find the 'event_time' column of 'events' in the schema cache"
--
-- AFTER: Event form saves successfully with all fields:
--   ✓ Event Title
--   ✓ URL Slug (auto-generated)
--   ✓ Event Date
--   ✓ Event Time (new!)
--   ✓ Venue / Location (new!)
--   ✓ Category (multi-select)
--   ✓ Status (draft/published)
--   ✓ Featured Event checkbox
--   ✓ Short Description (new!)
--   ✓ Full Description (new!)
--   ✓ Key Highlights (new!)
--   ✓ Featured Image
--   ✓ Photo Gallery
--   ✓ YouTube Videos
--
-- ============================================================================
