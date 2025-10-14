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
