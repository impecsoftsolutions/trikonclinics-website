/*
  # Events & News System - ROLLBACK Script

  ## Purpose
  This script completely removes all events system tables, policies, and indexes
  created by the 20251014000000_create_events_system.sql migration.

  ## Usage
  Run this script to undo the events system migration and return to the previous state.
  This is safe to run and will not affect any other system data.

  ## What Gets Removed
  - All RLS policies for events tables
  - All indexes for events tables
  - All events tables (tags, events, event_images, event_videos, event_tags, event_error_logs)

  ## Data Loss Warning
  Running this script will permanently delete:
  - All events and news articles
  - All event images and videos
  - All tags
  - All error logs

  Make sure to backup any important data before running this rollback!
*/

-- Drop all RLS policies first

-- Tags policies
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Content Manager and above can create tags" ON tags;
DROP POLICY IF EXISTS "Content Manager and above can update tags" ON tags;
DROP POLICY IF EXISTS "Admin and above can delete tags" ON tags;

-- Events policies
DROP POLICY IF EXISTS "Authenticated users can view all events" ON events;
DROP POLICY IF EXISTS "Content Manager and above can create events" ON events;
DROP POLICY IF EXISTS "Content Manager and above can update events" ON events;
DROP POLICY IF EXISTS "Admin and above can delete events" ON events;

-- Event images policies
DROP POLICY IF EXISTS "Authenticated users can view all event images" ON event_images;
DROP POLICY IF EXISTS "Content Manager and above can insert event images" ON event_images;
DROP POLICY IF EXISTS "Content Manager and above can update event images" ON event_images;
DROP POLICY IF EXISTS "Admin and above can delete event images" ON event_images;

-- Event videos policies
DROP POLICY IF EXISTS "Authenticated users can view all event videos" ON event_videos;
DROP POLICY IF EXISTS "Content Manager and above can insert event videos" ON event_videos;
DROP POLICY IF EXISTS "Content Manager and above can update event videos" ON event_videos;
DROP POLICY IF EXISTS "Admin and above can delete event videos" ON event_videos;

-- Event tags policies
DROP POLICY IF EXISTS "Authenticated users can view event tags" ON event_tags;
DROP POLICY IF EXISTS "Content Manager and above can insert event tags" ON event_tags;
DROP POLICY IF EXISTS "Content Manager and above can delete event tags" ON event_tags;

-- Event error logs policies
DROP POLICY IF EXISTS "Admin and above can view error logs" ON event_error_logs;
DROP POLICY IF EXISTS "Anyone authenticated can insert error logs" ON event_error_logs;

-- Drop all indexes

-- Events indexes
DROP INDEX IF EXISTS idx_events_status_date;
DROP INDEX IF EXISTS idx_events_slug;
DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_events_is_featured;

-- Event images indexes
DROP INDEX IF EXISTS idx_event_images_event_id_order;

-- Event videos indexes
DROP INDEX IF EXISTS idx_event_videos_event_id_order;

-- Tags indexes
DROP INDEX IF EXISTS idx_tags_slug;
DROP INDEX IF EXISTS idx_tags_name;

-- Event tags indexes
DROP INDEX IF EXISTS idx_event_tags_event_id;
DROP INDEX IF EXISTS idx_event_tags_tag_id;

-- Error logs indexes
DROP INDEX IF EXISTS idx_event_error_logs_created_at;
DROP INDEX IF EXISTS idx_event_error_logs_error_type;

-- Drop all tables (in correct order to handle foreign key constraints)

-- Drop junction table first
DROP TABLE IF EXISTS event_tags CASCADE;

-- Drop child tables
DROP TABLE IF EXISTS event_videos CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;

-- Drop parent tables
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS tags CASCADE;

-- Drop error logs table
DROP TABLE IF EXISTS event_error_logs CASCADE;
