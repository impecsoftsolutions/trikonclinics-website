/*
  # Add Doctor Profile Layout Variants to Modern Themes

  1. Purpose
    - Add doctorLayout configuration to theme's pages.doctors layout settings
    - Support three layout options: vertical, horizontal, tile
    - Enable hybrid approach: defaults follow theme style but can be overridden

  2. Changes
    - Update all modern_themes to include doctorLayout in config.layouts.pages.doctors
    - Set intelligent defaults based on theme's layoutStyle:
      - modern themes → horizontal layout
      - minimal themes → tile layout
      - playful themes → vertical layout
    - Allow manual override in theme editor

  3. Default Layout Mappings
    - Clinical Modern (layoutStyle: modern) → horizontal
    - Apple Medical (layoutStyle: minimal) → tile
    - Hims Health (layoutStyle: playful) → vertical

  4. Security
    - No RLS changes needed - uses existing theme permissions
*/

-- Add doctorLayout to Clinical Modern theme (modern style → horizontal default)
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"horizontal"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  slug = 'clinical-modern'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- Add doctorLayout to Apple Medical theme (minimal style → tile default)
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"tile"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  slug = 'apple-medical'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- Add doctorLayout to Hims Health theme (playful style → vertical default)
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"vertical"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  slug = 'hims-health'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- For any other themes, set default based on their layoutStyle
-- Modern → horizontal
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"horizontal"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  config->>'layoutStyle' = 'modern'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- Minimal → tile
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"tile"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  config->>'layoutStyle' = 'minimal'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- Playful → vertical
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"vertical"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  config->>'layoutStyle' = 'playful'
  AND config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

-- Fallback: any remaining themes without layoutStyle get vertical (safest default)
UPDATE modern_themes
SET
  config = jsonb_set(
    config,
    '{layouts,pages,doctors,doctorLayout}',
    '"vertical"'::jsonb,
    true
  ),
  updated_at = now()
WHERE
  config->'layouts'->'pages'->'doctors'->'doctorLayout' IS NULL;

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
