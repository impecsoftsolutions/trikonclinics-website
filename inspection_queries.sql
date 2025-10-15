-- ============================================================================
-- DATA INSPECTION QUERIES
-- Run these in Supabase SQL Editor to see what exists in tables to be removed
-- ============================================================================

-- 1. CHECK: themes table (old/unused)
SELECT 
  'themes' as table_name,
  COUNT(*) as row_count
FROM themes;

SELECT * FROM themes ORDER BY created_at;

-- 2. CHECK: site_settings table (old/unused)
SELECT 
  'site_settings' as table_name,
  COUNT(*) as row_count
FROM site_settings;

SELECT * FROM site_settings;

-- 3. CHECK: modern_theme_versions table (version history)
SELECT 
  'modern_theme_versions' as table_name,
  COUNT(*) as row_count
FROM modern_theme_versions;

SELECT 
  id,
  theme_id,
  version_number,
  change_description,
  created_at,
  is_rollback
FROM modern_theme_versions 
ORDER BY theme_id, version_number;

-- 4. CHECK: modern_theme_assets table (likely unused)
SELECT 
  'modern_theme_assets' as table_name,
  COUNT(*) as row_count
FROM modern_theme_assets;

SELECT * FROM modern_theme_assets ORDER BY created_at;

-- ============================================================================
-- VERIFICATION: Confirm modern tables are NOT being deleted
-- ============================================================================

SELECT 'modern_themes (KEEPING)' as table_name, COUNT(*) as row_count FROM modern_themes;
SELECT 'modern_site_settings (KEEPING)' as table_name, COUNT(*) as row_count FROM modern_site_settings;
