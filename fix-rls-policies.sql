-- Fix Login Authentication - Update RLS Policies
-- This script removes auth.uid() dependencies and allows anonymous access for login

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Super Admin can insert users" ON users;
DROP POLICY IF EXISTS "Super Admin can update users" ON users;
DROP POLICY IF EXISTS "Super Admin can delete users" ON users;

-- Allow anonymous and public users to SELECT from users table for login purposes
CREATE POLICY "Allow read for login"
  ON users FOR SELECT
  TO anon, public
  USING (true);

-- Allow insert for users
CREATE POLICY "Allow insert users"
  ON users FOR INSERT
  TO anon, public
  WITH CHECK (true);

-- Allow update users
CREATE POLICY "Allow update users"
  ON users FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

-- Allow delete users
CREATE POLICY "Allow delete users"
  ON users FOR DELETE
  TO anon, public
  USING (true);

-- Update hospital_profile policies
DROP POLICY IF EXISTS "Anyone can view hospital profile" ON hospital_profile;
DROP POLICY IF EXISTS "Admin and above can update hospital profile" ON hospital_profile;
DROP POLICY IF EXISTS "Admin and above can insert hospital profile" ON hospital_profile;

CREATE POLICY "Public read hospital profile"
  ON hospital_profile FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert hospital profile"
  ON hospital_profile FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update hospital profile"
  ON hospital_profile FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

-- Update doctors policies
DROP POLICY IF EXISTS "Anyone can view doctors" ON doctors;
DROP POLICY IF EXISTS "Content Manager and above can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Content Manager and above can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admin and above can delete doctors" ON doctors;

CREATE POLICY "Public read doctors"
  ON doctors FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert doctors"
  ON doctors FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update doctors"
  ON doctors FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete doctors"
  ON doctors FOR DELETE
  TO anon, public
  USING (true);

-- Update testimonials policies
DROP POLICY IF EXISTS "Anyone can view published testimonials" ON testimonials;
DROP POLICY IF EXISTS "Content Manager and above can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Content Manager and above can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin and above can delete testimonials" ON testimonials;

CREATE POLICY "Public read testimonials"
  ON testimonials FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert testimonials"
  ON testimonials FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update testimonials"
  ON testimonials FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete testimonials"
  ON testimonials FOR DELETE
  TO anon, public
  USING (true);

-- Update services policies
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Content Manager and above can insert services" ON services;
DROP POLICY IF EXISTS "Content Manager and above can update services" ON services;
DROP POLICY IF EXISTS "Admin and above can delete services" ON services;

CREATE POLICY "Public read services"
  ON services FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert services"
  ON services FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update services"
  ON services FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete services"
  ON services FOR DELETE
  TO anon, public
  USING (true);

-- Update contact_information policies
DROP POLICY IF EXISTS "Anyone can view contact information" ON contact_information;
DROP POLICY IF EXISTS "Content Manager and above can update contact information" ON contact_information;
DROP POLICY IF EXISTS "Content Manager and above can insert contact information" ON contact_information;

CREATE POLICY "Public read contact information"
  ON contact_information FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert contact information"
  ON contact_information FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update contact information"
  ON contact_information FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

-- Update social_media policies
DROP POLICY IF EXISTS "Anyone can view social media" ON social_media;
DROP POLICY IF EXISTS "Content Manager and above can insert social media" ON social_media;
DROP POLICY IF EXISTS "Content Manager and above can update social media" ON social_media;
DROP POLICY IF EXISTS "Admin and above can delete social media" ON social_media;

CREATE POLICY "Public read social media"
  ON social_media FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert social media"
  ON social_media FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Public update social media"
  ON social_media FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete social media"
  ON social_media FOR DELETE
  TO anon, public
  USING (true);

-- Update activity_logs policies
DROP POLICY IF EXISTS "Anyone can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;

CREATE POLICY "Public read activity logs"
  ON activity_logs FOR SELECT
  TO anon, public
  USING (true);

CREATE POLICY "Public insert activity logs"
  ON activity_logs FOR INSERT
  TO anon, public
  WITH CHECK (true);
