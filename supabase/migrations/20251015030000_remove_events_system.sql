/*
  # Remove Events System

  This migration removes all events-related tables and columns from the database.

  1. Tables to Remove
    - `events` table (if exists)
    - `event_tags` table (if exists)
    - `event_registrations` table (if exists)

  2. Columns to Remove
    - `events_enabled` from site_settings
    - `events_public_access` from site_settings

  3. Storage Buckets to Remove
    - `event-images` bucket (if exists)
*/

-- Drop events table if it exists
DROP TABLE IF EXISTS events CASCADE;

-- Drop event-related tables if they exist
DROP TABLE IF EXISTS event_tags CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;

-- Remove events-related columns from site_settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_enabled'
  ) THEN
    ALTER TABLE site_settings DROP COLUMN events_enabled;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_public_access'
  ) THEN
    ALTER TABLE site_settings DROP COLUMN events_public_access;
  END IF;
END $$;

-- Remove event-images storage bucket if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'event-images'
  ) THEN
    DELETE FROM storage.buckets WHERE id = 'event-images';
  END IF;
END $$;
