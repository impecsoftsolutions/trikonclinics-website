-- ============================================================================
-- DROP UNUSED DATABASE TABLES
-- Purpose: Remove legacy and unused tables to clean up database
-- Created: 2025-10-15
-- ============================================================================
--
-- IMPORTANT: BACKUP MUST BE CREATED FIRST
-- Before running this migration, ensure backup_tables_[timestamp].sql exists
-- and has been reviewed for completeness.
--
-- TABLES TO BE DROPPED:
--   1. site_settings (old/legacy - depends on themes)
--   2. themes (old/legacy - parent of site_settings)
--   3. modern_theme_assets (unused asset storage)
--   4. modern_theme_versions (version history - optional)
--
-- TABLES PRESERVED:
--   - modern_themes (REQUIRED - active theme system)
--   - modern_site_settings (REQUIRED - active theme configuration)
--   - All other application tables remain untouched
--
-- ROLLBACK:
--   Execute backup_tables_[timestamp].sql to restore all tables
--
-- ============================================================================

-- Log the start of cleanup
DO $$
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'STARTING DATABASE CLEANUP';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Removing 4 unused tables...';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 1: Drop site_settings (depends on themes, must go first)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_settings') THEN
    DROP TABLE site_settings CASCADE;
    RAISE NOTICE '✓ Dropped table: site_settings (old/legacy system)';
  ELSE
    RAISE NOTICE '⊘ Table site_settings does not exist (already removed)';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop themes (old/legacy parent table)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'themes') THEN
    DROP TABLE themes CASCADE;
    RAISE NOTICE '✓ Dropped table: themes (old/legacy system)';
  ELSE
    RAISE NOTICE '⊘ Table themes does not exist (already removed)';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop modern_theme_assets (unused, depends on modern_themes)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modern_theme_assets') THEN
    DROP TABLE modern_theme_assets CASCADE;
    RAISE NOTICE '✓ Dropped table: modern_theme_assets (unused asset storage)';
  ELSE
    RAISE NOTICE '⊘ Table modern_theme_assets does not exist (already removed)';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop modern_theme_versions (version history, depends on modern_themes)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modern_theme_versions') THEN
    DROP TABLE modern_theme_versions CASCADE;
    RAISE NOTICE '✓ Dropped table: modern_theme_versions (version history)';
  ELSE
    RAISE NOTICE '⊘ Table modern_theme_versions does not exist (already removed)';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION: Confirm critical tables still exist
-- ============================================================================

DO $$
DECLARE
  modern_themes_exists boolean;
  modern_site_settings_exists boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '============================================================';

  -- Check modern_themes
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'modern_themes'
  ) INTO modern_themes_exists;

  IF modern_themes_exists THEN
    RAISE NOTICE '✓ modern_themes table still exists (REQUIRED)';
  ELSE
    RAISE WARNING '✗ modern_themes table is missing! THIS IS CRITICAL!';
  END IF;

  -- Check modern_site_settings
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'modern_site_settings'
  ) INTO modern_site_settings_exists;

  IF modern_site_settings_exists THEN
    RAISE NOTICE '✓ modern_site_settings table still exists (REQUIRED)';
  ELSE
    RAISE WARNING '✗ modern_site_settings table is missing! THIS IS CRITICAL!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'CLEANUP COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Removed: 4';
  RAISE NOTICE 'Tables Preserved: modern_themes, modern_site_settings';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Test website functionality';
  RAISE NOTICE '  2. Verify theme rendering works correctly';
  RAISE NOTICE '  3. If issues occur, restore from backup_tables_[timestamp].sql';
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;
