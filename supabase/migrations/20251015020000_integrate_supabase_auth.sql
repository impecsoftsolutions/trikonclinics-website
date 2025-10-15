/*
  # Integrate Supabase Auth with Custom Users Table

  ## Overview
  This migration integrates the custom users table with Supabase's built-in authentication system.
  It adds the necessary columns and helper functions to link auth.users with the users table,
  enabling RLS policies to work correctly with auth.uid().

  ## Changes Made

  1. New Columns Added to users table:
    - `auth_user_id` (uuid, unique) - Links to auth.users.id
    - Nullable to support gradual migration

  2. New Helper Functions:
    - `get_current_user()` - Returns full user record for authenticated user
    - `get_user_role()` - Returns role of authenticated user
    - `is_super_admin()` - Checks if authenticated user is Super Admin
    - `is_admin_or_above()` - Checks if user has Admin or Super Admin role
    - `is_content_manager_or_above()` - Checks if user has Content Manager role or higher

  3. Updated RLS Policies:
    - All policies now use auth.uid() correctly
    - Policies check auth_user_id column to link auth users to custom users
    - Backward compatible with existing data during migration

  ## Migration Process
  1. Add auth_user_id column to users table
  2. Create helper functions for user role checks
  3. Update RLS policies to use new helper functions
  4. Run separate script to create Supabase Auth users and link them

  ## Security Notes
  - RLS remains enabled on all tables
  - Auth users must have corresponding entry in users table
  - Only enabled users with matching auth_user_id can perform actions
  - Helper functions optimize repeated role checks in policies
*/

-- Step 1: Add auth_user_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);

-- Step 2: Create helper function to get current user record
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text,
  is_enabled boolean,
  auth_user_id uuid
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.email,
    u.role,
    u.is_enabled,
    u.auth_user_id
  FROM users u
  WHERE u.auth_user_id = auth.uid()
  AND u.is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM users
  WHERE auth_user_id = auth.uid()
  AND is_enabled = true;
$$ LANGUAGE sql STABLE;

-- Step 4: Create helper function to check if user is Super Admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE auth_user_id = auth.uid()
    AND role = 'Super Admin'
    AND is_enabled = true
  );
$$ LANGUAGE sql STABLE;

-- Step 5: Create helper function to check if user is Admin or above
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE auth_user_id = auth.uid()
    AND role IN ('Super Admin', 'Admin')
    AND is_enabled = true
  );
$$ LANGUAGE sql STABLE;

-- Step 6: Create helper function to check if user is Content Manager or above
CREATE OR REPLACE FUNCTION is_content_manager_or_above()
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE auth_user_id = auth.uid()
    AND role IN ('Super Admin', 'Admin', 'Content Manager')
    AND is_enabled = true
  );
$$ LANGUAGE sql STABLE;

-- Step 7: Update RLS Policies for users table
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Super Admin can insert users" ON users;
DROP POLICY IF EXISTS "Super Admin can update users" ON users;
DROP POLICY IF EXISTS "Super Admin can delete users" ON users;

CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Super Admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- Step 8: Update RLS Policies for hospital_profile table
DROP POLICY IF EXISTS "Anyone can view hospital profile" ON hospital_profile;
DROP POLICY IF EXISTS "Admin and above can update hospital profile" ON hospital_profile;
DROP POLICY IF EXISTS "Admin and above can insert hospital profile" ON hospital_profile;

CREATE POLICY "Authenticated users can view hospital profile"
  ON hospital_profile FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update hospital profile"
  ON hospital_profile FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can insert hospital profile"
  ON hospital_profile FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

-- Step 9: Update RLS Policies for doctors table
DROP POLICY IF EXISTS "Anyone can view doctors" ON doctors;
DROP POLICY IF EXISTS "Content Manager and above can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Content Manager and above can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admin and above can delete doctors" ON doctors;

CREATE POLICY "Authenticated users can view doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 10: Update RLS Policies for testimonials table
DROP POLICY IF EXISTS "Anyone can view published testimonials" ON testimonials;
DROP POLICY IF EXISTS "Content Manager and above can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Content Manager and above can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Admin and above can delete testimonials" ON testimonials;

CREATE POLICY "Authenticated users can view testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 11: Update RLS Policies for services table
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Content Manager and above can insert services" ON services;
DROP POLICY IF EXISTS "Content Manager and above can update services" ON services;
DROP POLICY IF EXISTS "Admin and above can delete services" ON services;

CREATE POLICY "Authenticated users can view services"
  ON services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 12: Update RLS Policies for contact_information table
DROP POLICY IF EXISTS "Anyone can view contact information" ON contact_information;
DROP POLICY IF EXISTS "Content Manager and above can update contact information" ON contact_information;
DROP POLICY IF EXISTS "Content Manager and above can insert contact information" ON contact_information;

CREATE POLICY "Authenticated users can view contact information"
  ON contact_information FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update contact information"
  ON contact_information FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can insert contact information"
  ON contact_information FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

-- Step 13: Update RLS Policies for social_media table
DROP POLICY IF EXISTS "Anyone can view social media" ON social_media;
DROP POLICY IF EXISTS "Content Manager and above can insert social media" ON social_media;
DROP POLICY IF EXISTS "Content Manager and above can update social media" ON social_media;
DROP POLICY IF EXISTS "Admin and above can delete social media" ON social_media;

CREATE POLICY "Authenticated users can view social media"
  ON social_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert social media"
  ON social_media FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update social media"
  ON social_media FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete social media"
  ON social_media FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 14: Update RLS Policies for activity_logs table
DROP POLICY IF EXISTS "Anyone can view activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;

CREATE POLICY "Authenticated users can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

-- Step 15: Update RLS Policies for events tables
DROP POLICY IF EXISTS "Authenticated users can view all events" ON events;
DROP POLICY IF EXISTS "Content Manager and above can create events" ON events;
DROP POLICY IF EXISTS "Content Manager and above can update events" ON events;
DROP POLICY IF EXISTS "Admin and above can delete events" ON events;

CREATE POLICY "Authenticated users can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 16: Update RLS Policies for event_images table
DROP POLICY IF EXISTS "Authenticated users can view all event images" ON event_images;
DROP POLICY IF EXISTS "Content Manager and above can insert event images" ON event_images;
DROP POLICY IF EXISTS "Content Manager and above can update event images" ON event_images;
DROP POLICY IF EXISTS "Admin and above can delete event images" ON event_images;

CREATE POLICY "Authenticated users can view all event images"
  ON event_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert event images"
  ON event_images FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update event images"
  ON event_images FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete event images"
  ON event_images FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 17: Update RLS Policies for event_videos table
DROP POLICY IF EXISTS "Authenticated users can view all event videos" ON event_videos;
DROP POLICY IF EXISTS "Content Manager and above can insert event videos" ON event_videos;
DROP POLICY IF EXISTS "Content Manager and above can update event videos" ON event_videos;
DROP POLICY IF EXISTS "Admin and above can delete event videos" ON event_videos;

CREATE POLICY "Authenticated users can view all event videos"
  ON event_videos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert event videos"
  ON event_videos FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update event videos"
  ON event_videos FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete event videos"
  ON event_videos FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 18: Update RLS Policies for event_tags table
DROP POLICY IF EXISTS "Authenticated users can view event tags" ON event_tags;
DROP POLICY IF EXISTS "Content Manager and above can insert event tags" ON event_tags;
DROP POLICY IF EXISTS "Content Manager and above can delete event tags" ON event_tags;

CREATE POLICY "Authenticated users can view event tags"
  ON event_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert event tags"
  ON event_tags FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can delete event tags"
  ON event_tags FOR DELETE
  TO authenticated
  USING (is_content_manager_or_above());

-- Step 19: Update RLS Policies for tags table
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Content Manager and above can create tags" ON tags;
DROP POLICY IF EXISTS "Content Manager and above can update tags" ON tags;
DROP POLICY IF EXISTS "Admin and above can delete tags" ON tags;
DROP POLICY IF EXISTS "Content managers can manage tags" ON tags;

CREATE POLICY "Authenticated users can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Content Manager and above can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

CREATE POLICY "Admin and above can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (is_admin_or_above());

-- Step 20: Update RLS Policies for event_error_logs table
DROP POLICY IF EXISTS "Admin and above can view error logs" ON event_error_logs;
DROP POLICY IF EXISTS "Anyone authenticated can insert error logs" ON event_error_logs;

CREATE POLICY "Admin and above can view error logs"
  ON event_error_logs FOR SELECT
  TO authenticated
  USING (is_admin_or_above());

CREATE POLICY "Authenticated users can insert error logs"
  ON event_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

-- Step 21: Update RLS Policies for health library tables
DROP POLICY IF EXISTS "Public can view enabled categories" ON health_library_categories;
DROP POLICY IF EXISTS "Super Admin can manage categories" ON health_library_categories;

CREATE POLICY "Authenticated users can view categories"
  ON health_library_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Super Admin can manage categories"
  ON health_library_categories FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Public can view published illnesses" ON health_library_illnesses;
DROP POLICY IF EXISTS "Super Admin can manage illnesses" ON health_library_illnesses;

CREATE POLICY "Authenticated users can view illnesses"
  ON health_library_illnesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can manage illnesses"
  ON health_library_illnesses FOR ALL
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

DROP POLICY IF EXISTS "Public can view images of published illnesses" ON health_library_images;
DROP POLICY IF EXISTS "Super Admin can manage images" ON health_library_images;

CREATE POLICY "Authenticated users can view health library images"
  ON health_library_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can manage health library images"
  ON health_library_images FOR ALL
  TO authenticated
  USING (is_content_manager_or_above())
  WITH CHECK (is_content_manager_or_above());

-- Step 22: Update RLS Policies for modern themes tables
-- Note: theme_settings table doesn't exist in this schema, skipping

-- Step 23: Update RLS Policies for site_settings table
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Super Admin can update site settings" ON site_settings;

CREATE POLICY "Authenticated users can view site settings"
  ON site_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Super Admin can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super Admin can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin());

-- Step 24: Update RLS Policies for url_redirects table
DROP POLICY IF EXISTS "Anyone authenticated can view redirects" ON url_redirects;
DROP POLICY IF EXISTS "Content Manager and above can create redirects" ON url_redirects;

CREATE POLICY "Authenticated users can view redirects"
  ON url_redirects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can create redirects"
  ON url_redirects FOR INSERT
  TO authenticated
  WITH CHECK (is_content_manager_or_above());

-- Step 25: Add comment explaining the migration
COMMENT ON COLUMN users.auth_user_id IS 'Links to auth.users.id for Supabase Auth integration';
COMMENT ON FUNCTION get_current_user IS 'Returns the full user record for the currently authenticated user';
COMMENT ON FUNCTION get_user_role IS 'Returns the role of the currently authenticated user';
COMMENT ON FUNCTION is_super_admin IS 'Returns true if the currently authenticated user is a Super Admin';
COMMENT ON FUNCTION is_admin_or_above IS 'Returns true if the currently authenticated user is an Admin or Super Admin';
COMMENT ON FUNCTION is_content_manager_or_above IS 'Returns true if the currently authenticated user is a Content Manager, Admin, or Super Admin';
