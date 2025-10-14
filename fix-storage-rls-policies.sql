-- Fix Storage RLS Policies for Image Uploads
-- This script updates storage bucket policies to allow anon/public roles
-- Required because the app uses custom authentication, not Supabase Auth

-- The application uses a custom authentication system with users stored in
-- a custom 'users' table. Users authenticate via bcrypt and localStorage.
-- The Supabase client uses the anonymous key (anon role) for all operations.
-- Storage policies were set to 'authenticated' role which only works with
-- Supabase Auth. This fix changes policies to allow 'anon' and 'public' roles.

-- ============================================================================
-- HOSPITAL-PROFILE BUCKET
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload to hospital-profile" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update hospital-profile" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from hospital-profile" ON storage.objects;

-- Create new policies allowing anon/public access
CREATE POLICY "Allow anon to upload to hospital-profile"
  ON storage.objects FOR INSERT
  TO anon, public
  WITH CHECK (bucket_id = 'hospital-profile');

CREATE POLICY "Allow anon to update hospital-profile"
  ON storage.objects FOR UPDATE
  TO anon, public
  USING (bucket_id = 'hospital-profile');

CREATE POLICY "Allow anon to delete from hospital-profile"
  ON storage.objects FOR DELETE
  TO anon, public
  USING (bucket_id = 'hospital-profile');

-- ============================================================================
-- DOCTORS BUCKET
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload to doctors" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from doctors" ON storage.objects;

-- Create new policies allowing anon/public access
CREATE POLICY "Allow anon to upload to doctors"
  ON storage.objects FOR INSERT
  TO anon, public
  WITH CHECK (bucket_id = 'doctors');

CREATE POLICY "Allow anon to update doctors"
  ON storage.objects FOR UPDATE
  TO anon, public
  USING (bucket_id = 'doctors');

CREATE POLICY "Allow anon to delete from doctors"
  ON storage.objects FOR DELETE
  TO anon, public
  USING (bucket_id = 'doctors');

-- ============================================================================
-- TESTIMONIALS BUCKET
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload to testimonials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update testimonials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from testimonials" ON storage.objects;

-- Create new policies allowing anon/public access
CREATE POLICY "Allow anon to upload to testimonials"
  ON storage.objects FOR INSERT
  TO anon, public
  WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Allow anon to update testimonials"
  ON storage.objects FOR UPDATE
  TO anon, public
  USING (bucket_id = 'testimonials');

CREATE POLICY "Allow anon to delete from testimonials"
  ON storage.objects FOR DELETE
  TO anon, public
  USING (bucket_id = 'testimonials');

-- ============================================================================
-- SERVICES BUCKET
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can upload to services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from services" ON storage.objects;

-- Create new policies allowing anon/public access
CREATE POLICY "Allow anon to upload to services"
  ON storage.objects FOR INSERT
  TO anon, public
  WITH CHECK (bucket_id = 'services');

CREATE POLICY "Allow anon to update services"
  ON storage.objects FOR UPDATE
  TO anon, public
  USING (bucket_id = 'services');

CREATE POLICY "Allow anon to delete from services"
  ON storage.objects FOR DELETE
  TO anon, public
  USING (bucket_id = 'services');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this script:
-- 1. Log into your admin panel
-- 2. Go to Hospital Profile page
-- 3. Try uploading a logo or banner image
-- 4. The upload should now succeed without RLS errors
-- 5. Verify the image appears in your Supabase Storage dashboard

-- Note: Public SELECT policies already exist and don't need updating
