/*
  # Create Events Showcase System

  1. New Tables
    - `events`
      - Core event information with title, slug, date, description, and status
      - References featured image and tracks creator
    - `event_images`
      - Stores multiple images per event with different sizes
      - Supports captions and display ordering
      - Enforces max 20 images per event via trigger
    - `event_videos`
      - Stores YouTube video links for events
      - Supports display ordering
    - `event_tags`
      - Junction table for many-to-many relationship between events and tags
  
  2. Indexes
    - Foreign key indexes for optimal join performance
    - Unique index on events.slug for fast lookups
    - Display order indexes for sorting
  
  3. Constraints
    - Status check constraint (draft/published only)
    - Short description max 200 characters
    - Max 20 images per event enforced via trigger function
    - Cascading deletes for child records
  
  4. Notes
    - RLS policies will be added in a separate migration
    - Timestamps use timestamptz for timezone awareness
    - featured_image_id allows circular reference (resolved after image upload)
    - Uses custom users table (not Supabase Auth)
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  event_date date NOT NULL,
  short_description text CHECK (char_length(short_description) <= 200),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured_image_id uuid,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_images table
CREATE TABLE IF NOT EXISTS event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  medium_url text NOT NULL,
  thumbnail_url text NOT NULL,
  file_size_bytes bigint NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create event_videos table
CREATE TABLE IF NOT EXISTS event_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  youtube_url text NOT NULL,
  youtube_video_id text NOT NULL,
  title text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create event_tags junction table
CREATE TABLE IF NOT EXISTS event_tags (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);

-- Add foreign key constraint for featured_image_id (circular reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'events_featured_image_id_fkey'
    AND table_name = 'events'
  ) THEN
    ALTER TABLE events
    ADD CONSTRAINT events_featured_image_id_fkey
    FOREIGN KEY (featured_image_id) REFERENCES event_images(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create function to enforce max 20 images per event
CREATE OR REPLACE FUNCTION check_event_images_limit()
RETURNS TRIGGER
SET search_path = public
AS $$
DECLARE
  image_count integer;
BEGIN
  SELECT COUNT(*) INTO image_count
  FROM event_images
  WHERE event_id = NEW.event_id;
  
  IF image_count >= 20 THEN
    RAISE EXCEPTION 'Maximum of 20 images per event exceeded';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce max images limit
DROP TRIGGER IF EXISTS check_event_images_limit_trigger ON event_images;
CREATE TRIGGER check_event_images_limit_trigger
  BEFORE INSERT ON event_images
  FOR EACH ROW
  EXECUTE FUNCTION check_event_images_limit();

-- Create indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_featured_image_id ON events(featured_image_id);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_display_order ON event_images(event_id, display_order);

CREATE INDEX IF NOT EXISTS idx_event_videos_event_id ON event_videos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_videos_display_order ON event_videos(event_id, display_order);

CREATE INDEX IF NOT EXISTS idx_event_tags_event_id ON event_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id ON event_tags(tag_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for events.updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';