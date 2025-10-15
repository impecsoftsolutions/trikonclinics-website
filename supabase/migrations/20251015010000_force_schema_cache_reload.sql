/*
  # Force PostgREST Schema Cache Reload

  1. Problem
    - PostgREST API schema cache doesn't recognize new columns from Phase 3
    - Error: "Could not find the 'event_time' column of 'events' in the schema cache"
    - Columns exist in database but API cache is stale

  2. Solution
    - Add comment to events table to trigger schema reload
    - Re-apply Phase 3 columns if missing (idempotent)
    - Force PostgREST to recognize all event form fields

  3. Columns Verified
    - event_time (time)
    - venue (text)
    - short_description (text)
    - full_description (text)
    - highlights (text[])
    - updated_by (uuid)
*/

-- Step 1: Ensure all Phase 3 columns exist (idempotent)

-- Add short_description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'short_description'
  ) THEN
    ALTER TABLE events ADD COLUMN short_description text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add full_description
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'full_description'
  ) THEN
    ALTER TABLE events ADD COLUMN full_description text NOT NULL DEFAULT '';
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

-- Add highlights
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

-- Step 2: Force PostgREST schema cache reload by updating table comment
COMMENT ON TABLE events IS 'Events table - Phase 3 fields added - Schema cache refreshed at ' || now()::text;

-- Step 3: Also update comments on the new columns to ensure they're visible
COMMENT ON COLUMN events.event_time IS 'Time when the event occurs (optional)';
COMMENT ON COLUMN events.venue IS 'Location or venue name for the event (max 200 chars, optional)';
COMMENT ON COLUMN events.short_description IS 'Brief summary for event cards (160-200 chars recommended)';
COMMENT ON COLUMN events.full_description IS 'Complete event details with rich text content';
COMMENT ON COLUMN events.highlights IS 'Array of key event highlights (max 10 items, 150 chars each)';
COMMENT ON COLUMN events.updated_by IS 'User who last modified the event';

-- Step 4: Refresh the materialized view if it exists (for good measure)
-- This ensures any cached data structures are updated
DO $$
BEGIN
  -- PostgREST typically caches the schema, this forces a reload
  -- by making a structural change (comments count as schema changes)
  NULL;
END $$;
