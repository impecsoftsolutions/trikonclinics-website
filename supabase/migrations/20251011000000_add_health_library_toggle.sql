/*
  # Add Health Library Visibility Toggle

  1. Changes
    - Add `health_library_enabled` column to `modern_site_settings` table
    - Default value is `true` (enabled by default)
    - NOT NULL constraint to ensure consistent state
    - Initialize existing rows with default value

  2. Purpose
    - Allow admins to enable/disable the Health Library feature site-wide
    - When enabled, the Health Library is visible to public visitors
    - When disabled, Health Library is hidden from public navigation and routes
    - This gives control over when to launch the feature

  3. Security
    - Column is readable by all users (respects existing RLS on modern_site_settings)
    - Only admins can update the value via the Manage Illnesses admin page
*/

-- Add health_library_enabled column to modern_site_settings
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
  ) THEN
    -- Add column with default true and NOT NULL
    ALTER TABLE modern_site_settings
    ADD COLUMN health_library_enabled boolean DEFAULT true NOT NULL;

    RAISE NOTICE 'Column health_library_enabled added successfully with default value true';
  ELSE
    RAISE NOTICE 'Column health_library_enabled already exists';
  END IF;

  -- Ensure there is at least one settings row
  IF NOT EXISTS (SELECT 1 FROM modern_site_settings LIMIT 1) THEN
    INSERT INTO modern_site_settings (health_library_enabled)
    VALUES (true);

    RAISE NOTICE 'Initialized modern_site_settings table with default row';
  ELSE
    -- Update existing rows to ensure they have a value
    UPDATE modern_site_settings
    SET health_library_enabled = COALESCE(health_library_enabled, true)
    WHERE health_library_enabled IS NULL;

    RAISE NOTICE 'Updated existing rows to ensure health_library_enabled has a value';
  END IF;
END $$;
