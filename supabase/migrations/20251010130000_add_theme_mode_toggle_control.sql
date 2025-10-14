/*
  # Add Theme Mode Toggle Control

  1. Purpose
    - Add enableThemeModeToggle field to modern theme config
    - This controls whether the light/dark mode toggle is visible on the website

  2. Changes
    - Add enableThemeModeToggle to all existing themes (default true to maintain current behavior)
    - This field is part of the layouts.navigation configuration

  3. Security
    - No RLS changes needed - uses existing theme permissions
*/

-- Add enableThemeModeToggle to navigation layout config if missing
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,navigation,enableThemeModeToggle}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
WHERE config->'layouts'->'navigation'->'enableThemeModeToggle' IS NULL;

-- Update config_hash for all modified themes to trigger cache refresh
UPDATE modern_themes
SET config_hash = md5(config::text)
WHERE config_hash IS NOT NULL;

-- Update theme_hash in site settings to force frontend reload
UPDATE modern_site_settings
SET theme_hash = (
  SELECT md5(config::text)
  FROM modern_themes
  WHERE id = modern_site_settings.active_theme_id
),
updated_at = now();
