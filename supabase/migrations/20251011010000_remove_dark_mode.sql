/*
  # Remove Dark Mode from Theme System

  1. Purpose
    - Remove all dark mode functionality from the hospital website
    - Dark mode is inappropriate for medical/healthcare applications
    - Lock all themes to light mode only

  2. Changes
    - Remove dark color palettes from all theme configs
    - Remove enableThemeModeToggle field from navigation layouts
    - Set site_mode to 'light' permanently
    - Clean up dark mode related configuration

  3. Security
    - No RLS changes needed - uses existing permissions
*/

-- Remove dark colors from all theme configs
UPDATE modern_themes
SET config = jsonb_set(
  config #- '{colors,dark}',
  '{colors}',
  config->'colors'->'light'
),
updated_at = now()
WHERE config->'colors'->'dark' IS NOT NULL;

-- Remove enableThemeModeToggle from navigation layouts
UPDATE modern_themes
SET config = config #- '{layouts,navigation,enableThemeModeToggle}',
updated_at = now()
WHERE config->'layouts'->'navigation'->'enableThemeModeToggle' IS NOT NULL;

-- Update config_hash for all modified themes
UPDATE modern_themes
SET config_hash = md5(config::text)
WHERE config_hash IS NOT NULL;

-- Set site_mode to 'light' permanently
UPDATE modern_site_settings
SET site_mode = 'light',
updated_at = now();

-- Update theme_hash in site settings to force frontend reload
UPDATE modern_site_settings
SET theme_hash = (
  SELECT md5(config::text)
  FROM modern_themes
  WHERE id = modern_site_settings.active_theme_id
),
updated_at = now();

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Dark Mode Removal Complete';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes Applied:';
  RAISE NOTICE '  ✓ Removed dark color palettes from all themes';
  RAISE NOTICE '  ✓ Removed theme mode toggle configuration';
  RAISE NOTICE '  ✓ Set all sites to light mode permanently';
  RAISE NOTICE '  ✓ Updated theme hashes to trigger cache refresh';
  RAISE NOTICE '';
  RAISE NOTICE 'All themes now support light mode only.';
  RAISE NOTICE 'This is appropriate for medical/healthcare websites.';
  RAISE NOTICE '============================================================';
END $$;
