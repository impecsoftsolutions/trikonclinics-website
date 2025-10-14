/*
  # Supabase Storage Setup for Trikon Clinics

  ## Overview
  This migration sets up Supabase Storage buckets for managing hospital images
  and photos. It creates separate buckets for different content types and
  configures Row Level Security policies for secure access.

  ## Storage Buckets Created

  ### 1. hospital-profile
  Stores hospital branding images
  - Hospital logo
  - Banner images
  - Public read access
  - Admin write access

  ### 2. doctors
  Stores doctor profile photos
  - Doctor headshots
  - Professional photos
  - Public read access
  - Admin write access

  ### 3. testimonials
  Stores patient testimonial photos
  - Patient photos (with consent)
  - Public read access
  - Admin write access

  ### 4. services
  Stores service icon images
  - Service icons
  - Feature images
  - Public read access
  - Admin write access

  ## Security Policies

  ### Public Access (Read)
  - All buckets allow public read access for website visitors
  - Images are accessible via public URLs

  ### Admin Access (Write)
  - Authenticated users can upload images
  - Authenticated users can update their uploads
  - Authenticated users can delete images
  - File size limit: 5MB per file
  - Allowed file types: image/jpeg, image/png, image/webp, image/gif

  ## Important Notes
  - All buckets are set to public for read operations
  - Write operations require authentication
  - Files are organized by bucket type
  - Old files should be cleaned up when records are deleted
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('hospital-profile', 'hospital-profile', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('doctors', 'doctors', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('testimonials', 'testimonials', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('services', 'services', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for hospital-profile bucket

-- Allow public read access
CREATE POLICY "Public read access for hospital-profile"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hospital-profile');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to hospital-profile"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'hospital-profile');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update hospital-profile"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'hospital-profile');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from hospital-profile"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'hospital-profile');

-- RLS Policies for doctors bucket

-- Allow public read access
CREATE POLICY "Public read access for doctors"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'doctors');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to doctors"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'doctors');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update doctors"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'doctors');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from doctors"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'doctors');

-- RLS Policies for testimonials bucket

-- Allow public read access
CREATE POLICY "Public read access for testimonials"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'testimonials');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to testimonials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'testimonials');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update testimonials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'testimonials');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from testimonials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'testimonials');

-- RLS Policies for services bucket

-- Allow public read access
CREATE POLICY "Public read access for services"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'services');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to services"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'services');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update services"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'services');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete from services"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'services');
