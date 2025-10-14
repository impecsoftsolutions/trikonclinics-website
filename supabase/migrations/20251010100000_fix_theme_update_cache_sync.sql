/*
  # Fix Theme Update Cache Synchronization

  ## Overview
  This migration fixes the issue where theme edits don't appear on the website
  by ensuring the cache invalidation hash is properly updated when editing
  the currently active theme.

  ## Problem
  When editing a theme via the update_theme function:
  - The theme's config and config_hash are updated in modern_themes table
  - BUT the theme_hash in modern_site_settings is NOT updated
  - The frontend caching system relies on theme_hash to detect changes
  - Result: Changes are saved but not displayed until manual cache clear

  ## Solution
  1. Update the update_theme function to sync theme_hash in modern_site_settings
     when the edited theme is currently active
  2. Add a trigger to automatically maintain this sync for any theme updates

  ## Changes Made
  - Modified update_theme function to update modern_site_settings.theme_hash
  - Added trigger to keep hashes in sync automatically
  - Ensures immediate cache invalidation when active theme is edited

  ## Testing
  After applying this migration:
  1. Edit an active theme in the Modern Theme Settings page
  2. Save the changes
  3. Changes should appear on the website within 60 seconds (or immediately on refresh)
*/

-- ============================================================================
-- FUNCTION: Update Theme (Fixed Version)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_theme(
  p_theme_id uuid,
  p_config jsonb,
  p_change_description text DEFAULT 'Theme configuration updated',
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_theme record;
  v_old_config jsonb;
  v_new_hash text;
  v_version_number integer;
  v_is_active_theme boolean;
  v_result jsonb;
BEGIN
  -- Get the existing theme
  SELECT * INTO v_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Theme not found'
    );
  END IF;

  -- Prevent editing preset themes
  IF v_theme.is_preset THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot edit preset themes. Please duplicate the theme first to create an editable version.'
    );
  END IF;

  -- Store old config for versioning
  v_old_config := v_theme.config;

  -- Generate new hash for cache invalidation
  v_new_hash := encode(digest(p_config::text, 'sha256'), 'hex');

  -- Check if this is the currently active theme
  SELECT EXISTS(
    SELECT 1 FROM modern_site_settings
    WHERE active_theme_id = p_theme_id
  ) INTO v_is_active_theme;

  -- Update the theme
  UPDATE modern_themes
  SET
    config = p_config,
    config_hash = v_new_hash,
    validation_status = 'passed',
    validation_errors = NULL,
    updated_at = now()
  WHERE id = p_theme_id;

  -- If this is the active theme, update the hash in site settings for cache invalidation
  IF v_is_active_theme THEN
    UPDATE modern_site_settings
    SET
      theme_hash = v_new_hash,
      updated_at = now()
    WHERE active_theme_id = p_theme_id;

    RAISE NOTICE 'Updated theme_hash in modern_site_settings for active theme';
  END IF;

  -- Get the next version number for this theme
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM modern_theme_versions
  WHERE theme_id = p_theme_id;

  -- Create version record
  INSERT INTO modern_theme_versions (
    theme_id,
    version_number,
    config_snapshot,
    change_description,
    change_summary,
    created_by,
    is_rollback
  ) VALUES (
    p_theme_id,
    v_version_number,
    p_config,
    p_change_description,
    jsonb_build_object(
      'updated_at', now(),
      'updated_by', p_user_id,
      'version', v_version_number,
      'was_active', v_is_active_theme,
      'cache_invalidated', v_is_active_theme
    ),
    p_user_id,
    false
  );

  -- Return success with updated theme info
  v_result := jsonb_build_object(
    'success', true,
    'theme_id', p_theme_id,
    'theme_name', v_theme.name,
    'version_number', v_version_number,
    'config_hash', v_new_hash,
    'was_active_theme', v_is_active_theme,
    'cache_invalidated', v_is_active_theme,
    'updated_at', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to update theme: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-sync theme_hash when active theme is updated
-- ============================================================================

-- This trigger ensures that whenever the config_hash of the currently active
-- theme is updated in modern_themes, the theme_hash in modern_site_settings
-- is automatically updated to match, ensuring proper cache invalidation.

CREATE OR REPLACE FUNCTION sync_active_theme_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if config_hash changed
  IF NEW.config_hash IS DISTINCT FROM OLD.config_hash THEN
    -- Update modern_site_settings if this theme is currently active
    UPDATE modern_site_settings
    SET
      theme_hash = NEW.config_hash,
      updated_at = now()
    WHERE active_theme_id = NEW.id;

    -- Log if an update was made
    IF FOUND THEN
      RAISE NOTICE 'Trigger auto-synced theme_hash for active theme: %', NEW.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists (for rerunning migration)
DROP TRIGGER IF EXISTS sync_active_theme_hash_trigger ON modern_themes;

-- Create the trigger
CREATE TRIGGER sync_active_theme_hash_trigger
  AFTER UPDATE ON modern_themes
  FOR EACH ROW
  WHEN (NEW.config_hash IS DISTINCT FROM OLD.config_hash)
  EXECUTE FUNCTION sync_active_theme_hash();

-- ============================================================================
-- UTILITY FUNCTION: Manual Cache Refresh
-- ============================================================================

-- This function can be called manually to force a cache refresh
-- by regenerating the theme_hash from the current active theme's config_hash

CREATE OR REPLACE FUNCTION refresh_theme_cache()
RETURNS jsonb AS $$
DECLARE
  v_settings record;
  v_theme record;
  v_result jsonb;
BEGIN
  -- Get current site settings
  SELECT * INTO v_settings FROM modern_site_settings LIMIT 1;

  IF NOT FOUND OR v_settings.active_theme_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No active theme found'
    );
  END IF;

  -- Get the active theme
  SELECT * INTO v_theme FROM modern_themes WHERE id = v_settings.active_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Active theme not found in database'
    );
  END IF;

  -- Update the theme_hash to match the current config_hash
  UPDATE modern_site_settings
  SET
    theme_hash = v_theme.config_hash,
    updated_at = now()
  WHERE id = v_settings.id;

  v_result := jsonb_build_object(
    'success', true,
    'message', 'Theme cache refreshed successfully',
    'theme_name', v_theme.name,
    'theme_hash', v_theme.config_hash,
    'refreshed_at', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to refresh cache: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- POST-MIGRATION: Sync existing active theme hash
-- ============================================================================

-- If there's currently an active theme with a mismatched hash, fix it now
DO $$
DECLARE
  v_settings record;
  v_theme record;
BEGIN
  SELECT * INTO v_settings FROM modern_site_settings LIMIT 1;

  IF FOUND AND v_settings.active_theme_id IS NOT NULL THEN
    SELECT * INTO v_theme FROM modern_themes WHERE id = v_settings.active_theme_id;

    IF FOUND AND v_settings.theme_hash != v_theme.config_hash THEN
      UPDATE modern_site_settings
      SET
        theme_hash = v_theme.config_hash,
        updated_at = now()
      WHERE id = v_settings.id;

      RAISE NOTICE 'Fixed mismatched theme_hash for active theme: %', v_theme.name;
    END IF;
  END IF;
END $$;
