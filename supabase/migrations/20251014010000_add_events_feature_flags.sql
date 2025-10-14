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
