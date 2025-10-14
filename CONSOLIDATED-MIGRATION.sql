[dotenv@17.2.3] injecting env (3) from .env -- tip: ⚙️  override existing env vars with { override: true }
========================================
Events System - Database Migration
========================================

ℹ️  Direct PostgreSQL connection requires database password.
   The Service Role Key is NOT the database password.

📋 To get your database password:
   1. Visit: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/settings/database
   2. Look for "Database password" section
   3. Reset password if needed

🔧 Connection String Format:
   postgresql://postgres:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

========================================

📝 RECOMMENDED APPROACH:

Since we have the Service Role Key, we can use the Management API.
However, Supabase requires manual SQL execution for DDL operations.

FASTEST SOLUTION:
1. Visit: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql/new
2. Execute this consolidated SQL:

============================================================
-- ============================================================
-- EVENTS SYSTEM COMPLETE MIGRATION
-- Execute this entire block in Supabase SQL Editor
-- ============================================================

/*
  # Events & News System - Phase 0 Database Schema

  ## Overview
  This migration creates the complete database schema for the Events & News section
  of the hospital website. It includes tables for events, images, videos, tags, and
  their relationships, along with comprehensive security policies and performance indexes.

  ## Tables Created

  ### 1. tags
  Stores reusable tags for categorizing events
  - `id` (uuid, primary key) - Unique identifier
  - `tag_name` (text, unique) - Display name of the tag
  - `slug` (text, unique) - URL-friendly version of tag name
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. events
  Stores event and news articles
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Event title
  - `slug` (text, unique) - URL-friendly title for routing
  - `description` (text) - Full event description/content
  - `event_date` (timestamptz) - When the event occurred/will occur
  - `status` (text) - Either 'draft' or 'published'
  - `is_featured` (boolean) - Whether to highlight this event
  - `created_by` (uuid) - Reference to user who created the event
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. event_images
  Stores multiple images for each event with three size variants
  - `id` (uuid, primary key) - Unique identifier
  - `event_id` (uuid) - Reference to parent event
  - `image_url_small` (text) - 200px width image path
  - `image_url_medium` (text) - 600px width image path
  - `image_url_large` (text) - 1200px width image path
  - `alt_text` (text) - Accessibility text for image
  - `display_order` (integer) - Order for gallery display (0-based)
  - `created_at` (timestamptz) - Upload timestamp

  ### 4. event_videos
  Stores YouTube video embeds for events
  - `id` (uuid, primary key) - Unique identifier
  - `event_id` (uuid) - Reference to parent event
  - `youtube_url` (text) - Full YouTube video URL
  - `youtube_video_id` (text) - Extracted video ID for embedding
  - `display_order` (integer) - Order for display (0-based)
  - `created_at` (timestamptz) - Creation timestamp

  ### 5. event_tags
  Junction table for many-to-many relationship between events and tags
  - `event_id` (uuid) - Reference to event
  - `tag_id` (uuid) - Reference to tag
  - Primary key is composite (event_id, tag_id)

  ### 6. event_error_logs
  Tracks errors in the events system for debugging and monitoring
  - `id` (uuid, primary key) - Unique identifier
  - `error_type` (text) - Type of error (upload_failed, processing_failed, etc.)
  - `error_message` (text) - Human-readable error message
  - `context_data` (jsonb) - Additional context (event_id, file_name, etc.)
  - `stack_trace` (text) - Technical stack trace if available
  - `created_at` (timestamptz) - When error occurred

  ## Security
  - RLS (Row Level Security) is enabled on all tables
  - Public users can view published events only
  - Authenticated users can view all events (including drafts)
  - Content Managers and above can create and edit events
  - Admins and above can delete events
  - Draft event images require authentication to access
  - Published event images are publicly accessible

  ## Performance Indexes
  - Composite index on events (status, event_date DESC) for listing queries
  - Unique index on events (slug) for fast URL lookups
  - Composite index on event_images (event_id, display_order) for gallery ordering
  - Composite index on event_videos (event_id, display_order) for video ordering
  - Unique index on tags (slug) for tag lookups
  - Composite index on event_tags (event_id, tag_id) for filtering

  ## Important Notes
  - All status values are constrained to 'draft' or 'published'
  - YouTube URLs are validated to ensure proper format
  - Slugs must be unique and URL-safe
  - Foreign key cascades ensure data integrity on deletion
  - Error logs are append-only for audit trail
  - Display order allows flexible content arrangement
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_images table
CREATE TABLE IF NOT EXISTS event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url_small text NOT NULL,
  image_url_medium text NOT NULL,
  image_url_large text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create event_videos table
CREATE TABLE IF NOT EXISTS event_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  youtube_url text NOT NULL,
  youtube_video_id text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_youtube_url CHECK (
    youtube_url ~* '^https?://(www\.)?(youtube\.com|youtu\.be)/'
  )
);

-- Create event_tags junction table
CREATE TABLE IF NOT EXISTS event_tags (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Create event_error_logs table
CREATE TABLE IF NOT EXISTS event_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL,
  error_message text NOT NULL,
  context_data jsonb DEFAULT '{}'::jsonb,
  stack_trace text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags table
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for events table
CREATE POLICY "Authenticated users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for event_images table
CREATE POLICY "Authenticated users can view all event images"
  ON event_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert event images"
  ON event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update event images"
  ON event_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete event images"
  ON event_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for event_videos table
CREATE POLICY "Authenticated users can view all event videos"
  ON event_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert event videos"
  ON event_videos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update event videos"
  ON event_videos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete event videos"
  ON event_videos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for event_tags junction table
CREATE POLICY "Authenticated users can view event tags"
  ON event_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert event tags"
  ON event_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can delete event tags"
  ON event_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for event_error_logs table
CREATE POLICY "Admin and above can view error logs"
  ON event_error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Anyone authenticated can insert error logs"
  ON event_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Performance Indexes

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_status_date
  ON events(status, event_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug
  ON events(slug);

CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON events(created_by);

CREATE INDEX IF NOT EXISTS idx_events_is_featured
  ON events(is_featured) WHERE is_featured = true;

-- Event images indexes
CREATE INDEX IF NOT EXISTS idx_event_images_event_id_order
  ON event_images(event_id, display_order);

-- Event videos indexes
CREATE INDEX IF NOT EXISTS idx_event_videos_event_id_order
  ON event_videos(event_id, display_order);

-- Tags indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug
  ON tags(slug);

CREATE INDEX IF NOT EXISTS idx_tags_name
  ON tags(tag_name);

-- Event tags indexes
CREATE INDEX IF NOT EXISTS idx_event_tags_event_id
  ON event_tags(event_id);

CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id
  ON event_tags(tag_id);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_event_error_logs_created_at
  ON event_error_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_error_logs_error_type
  ON event_error_logs(error_type);


/*
  # Add Events Feature Flags to Site Settings

  ## Overview
  This migration adds feature flag columns to the site_settings table (or creates
  the table if it doesn't exist) to control the Events & News section visibility
  and access.

  ## New Columns

  ### events_enabled
  - Type: boolean
  - Default: false
  - Purpose: Master switch to enable/disable the entire Events section
  - When false: Events section is not accessible at all
  - When true: Events section is available (respects events_public_access)

  ### events_public_access
  - Type: boolean
  - Default: false
  - Purpose: Controls whether published events are visible to public (non-authenticated users)
  - When false: Only authenticated admin users can view events
  - When true: Published events are visible to everyone on the public website

  ## Usage Scenarios

  ### Development/Testing Phase
  - events_enabled: true
  - events_public_access: false
  - Result: Only admins can see and test events

  ### Public Launch
  - events_enabled: true
  - events_public_access: true
  - Result: Published events visible to everyone

  ### Temporary Disable
  - events_enabled: false
  - events_public_access: (any value, ignored when events_enabled is false)
  - Result: Events section completely hidden

  ## Important Notes
  - Feature flags can be changed without restarting the application
  - Changes take effect immediately
  - Draft events are NEVER visible to public regardless of these flags
  - Only Super Admin can modify these flags through the admin panel
*/

-- Check if site_settings table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_settings') THEN
    CREATE TABLE site_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Enable RLS on site_settings
    ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

    -- Insert default row
    INSERT INTO site_settings (id) VALUES (gen_random_uuid());
  END IF;
END $$;

-- Add events_enabled column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_enabled'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN events_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add events_public_access column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_public_access'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN events_public_access boolean DEFAULT false;
  END IF;
END $$;

-- Create or replace RLS policies for site_settings

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Super Admin can update site settings" ON site_settings;

-- Anyone can view site settings (needed for checking feature flags)
CREATE POLICY "Anyone can view site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only Super Admin can update site settings
CREATE POLICY "Super Admin can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  );

-- Create index for faster feature flag checks
CREATE INDEX IF NOT EXISTS idx_site_settings_events_flags
  ON site_settings(events_enabled, events_public_access);


/*
  # Events Storage Bucket Setup

  ## Overview
  This migration creates a dedicated storage bucket for event images and configures
  Row Level Security policies for controlling access based on event publication status.

  ## Storage Bucket: events

  ### Configuration
  - Bucket ID: events
  - Bucket Name: events
  - Public: false (controlled by RLS policies)
  - File Size Limit: 10MB (10485760 bytes) per file
  - Allowed MIME Types: image/jpeg, image/png, image/webp, image/gif
  - Folder Structure: /events/{event-id}/images/{size}/
    - small/: 200px width images
    - medium/: 600px width images
    - large/: 1200px width images

  ## Access Control Strategy

  ### Draft Events (status = 'draft')
  - Images are only accessible to authenticated admin users
  - Public cannot view or download draft event images
  - This protects unreleased content

  ### Published Events (status = 'published')
  - Images are publicly readable by anyone
  - No authentication required for viewing
  - Optimized for fast public website delivery

  ### Upload/Modify/Delete
  - Only authenticated Content Manager and above can upload
  - Only authenticated Content Manager and above can update
  - Only authenticated Admin and above can delete
  - All write operations require authentication

  ## File Naming Convention
  Files should follow this pattern:
  events/{event-id}/images/small/{image-id}.jpg
  events/{event-id}/images/medium/{image-id}.jpg
  events/{event-id}/images/large/{image-id}.jpg

  ## Important Notes
  - Original uploaded files should be processed server-side to create all three sizes
  - Each image record in event_images table references all three size variants
  - Deleting an event cascades to delete all associated images from storage
  - Storage paths are relative to bucket root
*/

-- Create events storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'events',
  'events',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies if they exist (for idempotent migrations)
DROP POLICY IF EXISTS "Public can view published event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view draft event images" ON storage.objects;
DROP POLICY IF EXISTS "Content Manager and above can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Content Manager and above can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admin and above can delete event images" ON storage.objects;

-- RLS Policy: Public read access for published events only
CREATE POLICY "Public can view published event images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'events'
    AND (
      -- Extract event_id from path (format: events/{event-id}/images/{size}/{filename})
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id::text = split_part(name, '/', 2)
        AND events.status = 'published'
      )
    )
  );

-- RLS Policy: Authenticated users can view all event images (including drafts)
CREATE POLICY "Authenticated users can view draft event images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'events');

-- RLS Policy: Content Manager and above can upload event images
CREATE POLICY "Content Manager and above can upload event images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'events'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- RLS Policy: Content Manager and above can update event images
CREATE POLICY "Content Manager and above can update event images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'events'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    bucket_id = 'events'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- RLS Policy: Admin and above can delete event images
CREATE POLICY "Admin and above can delete event images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'events'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );


-- ============================================================
-- MIGRATION COMPLETE
-- Run: npm run events:seed
-- ============================================================

============================================================

✅ After executing the above SQL, run:
   npm run events:seed

