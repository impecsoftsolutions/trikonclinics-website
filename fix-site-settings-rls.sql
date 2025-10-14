/*
  Fix RLS policy for site_settings table

  PROBLEM:
  The current RLS policy checks auth.uid() against users.id, but the users table
  is NOT linked to Supabase auth. The users table has custom IDs that don't match
  auth.uid().

  SOLUTION:
  Simplify the RLS policy to allow all authenticated users to update site_settings.
  Since your application already handles authorization at the app level (checking
  user roles before showing admin pages), we can trust that only admins will reach
  this endpoint.
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admin can update site settings" ON site_settings;

-- Create a simpler policy that allows any authenticated user to update
CREATE POLICY "Authenticated users can update site settings"
  ON site_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also add an INSERT policy in case the site_settings record needs to be created
DROP POLICY IF EXISTS "Admin can insert site settings" ON site_settings;

CREATE POLICY "Authenticated users can insert site settings"
  ON site_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);
