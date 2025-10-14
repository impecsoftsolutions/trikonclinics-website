/*
  # Add Doctor Profile Alignment Setting

  1. Purpose
    - Add doctorAlignment configuration to control card alignment on Doctors page
    - Support three alignment options: left, center, right
    - Default to 'left' for existing themes

  2. Changes
    - Update all modern_themes to include doctorAlignment in config.layouts.pages.doctors
    - Set default to 'left' (current behavior)
    - Alignment works with all layout types (horizontal, tile, vertical)

  3. Alignment Options
    - left: Cards align to left (default)
    - center: Cards align to center
    - right: Cards align to right

  4. Security
    - No RLS changes needed - uses existing theme permissions
*/

-- Add doctorAlignment to all existing themes with 'left' as default
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorAlignment}',
    '"left"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  config->'layouts'->'pages'->'doctors'->'doctorAlignment' IS NULL;

-- Update config_hash for all modified themes to trigger cache refresh
UPDATE modern_themes
SET config_hash = md5(config::text)
WHERE config_hash IS NOT NULL;

-- Update theme_hash in site settings to force frontend reload
UPDATE modern_site_settings
SET
  theme_hash = (
    SELECT md5(config::text)
    FROM modern_themes
    WHERE id = modern_site_settings.active_theme_id
  ),
  updated_at = now()
WHERE active_theme_id IS NOT NULL;
