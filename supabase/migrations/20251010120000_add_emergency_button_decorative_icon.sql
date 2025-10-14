/*
  # Add Emergency Button and Decorative Icon Support to Modern Themes

  1. Purpose
    - Add emergencyButton configuration to all existing themes
    - Add decorativeIcon color to light and dark color palettes
    - These fields allow customization of hero section emergency buttons and decorative icons

  2. Changes
    - Update all modern_themes to include emergencyButton in config (if missing)
    - Update all modern_themes to include decorativeIcon in colors.light and colors.dark (if missing)
    - Set sensible defaults for existing themes

  3. Security
    - No RLS changes needed - uses existing theme permissions
*/

-- Add emergencyButton to themes that don't have it
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{emergencyButton}',
    '{"text": "Emergency Call", "backgroundColor": "#EF4444", "textColor": "#FFFFFF"}'::jsonb,
    true
  ),
  updated_at = now()
WHERE config->'emergencyButton' IS NULL;

-- Add decorativeIcon to light mode colors if missing
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{colors,light,decorativeIcon}',
    '"#FBBF24"'::jsonb,
    true
  ),
  updated_at = now()
WHERE config->'colors'->'light'->'decorativeIcon' IS NULL;

-- Add decorativeIcon to dark mode colors if missing
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{colors,dark,decorativeIcon}',
    '"#FCD34D"'::jsonb,
    true
  ),
  updated_at = now()
WHERE config->'colors'->'dark'->'decorativeIcon' IS NULL;

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
