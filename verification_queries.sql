-- ============================================================================
-- VERIFICATION QUERIES
-- Use these to verify the cleanup was successful
-- ============================================================================

-- ============================================================================
-- PART 1: Check which tables still exist
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('themes', 'site_settings', 'modern_theme_assets', 'modern_theme_versions') 
    THEN '❌ SHOULD BE DELETED'
    WHEN table_name IN ('modern_themes', 'modern_site_settings')
    THEN '✓ SHOULD EXIST'
    ELSE 'Other'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'themes', 
    'site_settings', 
    'modern_theme_assets', 
    'modern_theme_versions',
    'modern_themes',
    'modern_site_settings'
  )
ORDER BY table_name;

-- ============================================================================
-- PART 2: Verify critical tables have data
-- ============================================================================

-- Check modern_themes has themes
SELECT 
  'modern_themes' as table_name,
  COUNT(*) as row_count,
  STRING_AGG(name, ', ') as theme_names
FROM modern_themes;

-- Check modern_site_settings has active theme
SELECT 
  'modern_site_settings' as table_name,
  COUNT(*) as row_count,
  active_theme_id,
  theme_hash,
  health_library_enabled
FROM modern_site_settings;

-- Check active theme details
SELECT 
  t.name as active_theme_name,
  t.slug as active_theme_slug,
  t.is_preset,
  s.activated_at,
  s.rollback_deadline
FROM modern_site_settings s
JOIN modern_themes t ON s.active_theme_id = t.id
LIMIT 1;

-- ============================================================================
-- PART 3: Verify deleted tables are gone
-- ============================================================================

-- This should return 0 rows if cleanup was successful
SELECT 
  table_name,
  'STILL EXISTS - Should be deleted!' as warning
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('themes', 'site_settings', 'modern_theme_assets', 'modern_theme_versions');

-- ============================================================================
-- PART 4: Check for orphaned indexes (should be auto-dropped with tables)
-- ============================================================================

-- This should return 0 rows if cleanup was successful
SELECT 
  indexname,
  tablename,
  'Orphaned index from deleted table' as warning
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('themes', 'site_settings', 'modern_theme_assets', 'modern_theme_versions');

-- ============================================================================
-- SUMMARY QUERY
-- ============================================================================

SELECT 
  '✓ Cleanup verification complete' as message,
  (SELECT COUNT(*) FROM modern_themes) as modern_themes_count,
  (SELECT COUNT(*) FROM modern_site_settings) as modern_site_settings_count,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes') 
    THEN 'FAILED - old tables still exist'
    ELSE 'SUCCESS - old tables removed'
  END as cleanup_status;
