/*
  # Create Event Images Storage Bucket

  1. Storage Bucket
    - Creates `event-images` bucket for storing event photos
    - Public read access for displaying images on public pages
    - 10MB file size limit per image
    - Restricted to common image formats (JPEG, PNG, WebP)

  2. Security Policies
    - Authenticated users can upload event images
    - Public users can view event images
    - Authenticated users can delete event images
    
  3. Important Notes
    - Public bucket allows direct image URLs without signed URLs
    - File size limit prevents abuse (10MB per file)
    - MIME type restrictions ensure only valid images are uploaded
*/

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

-- Allow public read access to images
CREATE POLICY "Public can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Allow authenticated users to delete event images
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');
