/*
  # Add Event Form Fields - Phase 3

  ## Overview
  This migration enhances the events table to support the complete event form
  with separate fields for short/full descriptions, event time, venue, highlights,
  and tracking of who updated the event.

  ## Changes Made

  ### 1. Events Table Modifications
  - Add `short_description` (text, required) - Brief 160-200 char summary for event cards
  - Add `full_description` (text, required) - Complete event details with rich text
  - Rename existing `description` to `full_description` to maintain data
  - Add `event_time` (time, optional) - Time of day when event occurs
  - Add `venue` (text, optional) - Location/venue name (max 200 chars)
  - Add `highlights` (text[], optional) - Array of key event highlights (max 10 items)
  - Add `updated_by` (uuid, optional) - References user who last modified the event

  ### 2. URL Redirects Table
  - Create `url_redirects` table to track slug changes
  - Supports automatic redirection from old URLs to new ones
  - Prevents 404 errors when event URLs change
  - Maintains SEO value by preserving old URLs

  ### 3. Security
  - Enable RLS on url_redirects table
  - Anyone can read redirects for URL resolution
  - Only Content Managers and above can create redirects
  - Redirects are permanent once created (no updates/deletes)

  ### 4. Performance
  - Add index on url_redirects (old_slug) for fast lookups
  - Add index on events (updated_by) for audit queries
  - Add index on events (venue) for location-based filtering

  ## Important Notes
  - Existing `description` data is copied to `full_description`
  - `short_description` defaults to first 200 chars of full_description for existing events
  - All existing events maintain their data integrity
  - New fields are added in backwards-compatible way
  - Highlights array supports up to 10 items per event
  - Event time is separate from event_date for flexibility
*/

-- Step 1: Add new columns to events table

-- Add short_description (will be populated from existing description)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE events ADD COLUMN short_description text;
  END IF;
END $$;

-- Add full_description (will replace existing description)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'full_description'
  ) THEN
    ALTER TABLE events ADD COLUMN full_description text;
  END IF;
END $$;

-- Add event_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'event_time'
  ) THEN
    ALTER TABLE events ADD COLUMN event_time time;
  END IF;
END $$;

-- Add venue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'venue'
  ) THEN
    ALTER TABLE events ADD COLUMN venue text;
  END IF;
END $$;

-- Add highlights array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'highlights'
  ) THEN
    ALTER TABLE events ADD COLUMN highlights text[] DEFAULT ARRAY[]::text[];
  END IF;
END $$;

-- Add updated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE events ADD COLUMN updated_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Migrate existing data
-- Copy existing description to full_description if it exists
UPDATE events
SET full_description = description
WHERE full_description IS NULL AND description IS NOT NULL;

-- Create short_description from first 200 characters of description for existing events
UPDATE events
SET short_description = SUBSTRING(description, 1, 200)
WHERE short_description IS NULL AND description IS NOT NULL;

-- Step 3: Drop old description column after data migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'description'
  ) THEN
    ALTER TABLE events DROP COLUMN description;
  END IF;
END $$;

-- Step 4: Add NOT NULL constraints after data migration
ALTER TABLE events ALTER COLUMN short_description SET NOT NULL;
ALTER TABLE events ALTER COLUMN full_description SET NOT NULL;

-- Step 5: Create url_redirects table for slug change tracking
CREATE TABLE IF NOT EXISTS url_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Step 6: Enable RLS on url_redirects
ALTER TABLE url_redirects ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for url_redirects
CREATE POLICY "Anyone authenticated can view redirects"
  ON url_redirects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can create redirects"
  ON url_redirects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- Step 8: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_url_redirects_old_slug
  ON url_redirects(old_slug);

CREATE INDEX IF NOT EXISTS idx_url_redirects_new_slug
  ON url_redirects(new_slug);

CREATE INDEX IF NOT EXISTS idx_url_redirects_event_id
  ON url_redirects(event_id);

CREATE INDEX IF NOT EXISTS idx_events_updated_by
  ON events(updated_by);

CREATE INDEX IF NOT EXISTS idx_events_venue
  ON events(venue) WHERE venue IS NOT NULL;

-- Step 9: Add constraint for venue length
ALTER TABLE events ADD CONSTRAINT venue_length_check
  CHECK (venue IS NULL OR char_length(venue) <= 200);

-- Step 10: Add constraint for short_description length
ALTER TABLE events ADD CONSTRAINT short_description_length_check
  CHECK (char_length(short_description) >= 1 AND char_length(short_description) <= 500);

-- Step 11: Add constraint for highlights array size
ALTER TABLE events ADD CONSTRAINT highlights_array_size_check
  CHECK (array_length(highlights, 1) IS NULL OR array_length(highlights, 1) <= 10);

-- Step 12: Add constraint for each highlight item length
ALTER TABLE events ADD CONSTRAINT highlights_item_length_check
  CHECK (
    highlights IS NULL OR
    NOT EXISTS (
      SELECT 1 FROM unnest(highlights) AS item
      WHERE char_length(item) > 150
    )
  );
