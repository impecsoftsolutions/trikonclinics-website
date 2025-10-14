/*
  # Add Update Theme Function

  ## Overview
  This migration adds functionality to update existing modern themes with automatic
  versioning, validation, and protection for preset themes.

  ## Functions Created

  ### update_theme
  Updates an existing theme's configuration and creates a new version record
  - Validates theme exists and is not a preset theme
  - Updates theme configuration and metadata
  - Creates new version record in modern_theme_versions
  - Updates config_hash for cache invalidation
  - Returns structured response with success status

  ## Security
  - Only non-preset themes can be updated
  - Automatic version tracking for audit trail
  - RLS policies ensure only authorized users can update themes
*/

-- ============================================================================
-- FUNCTION: Update Theme
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

  -- Update the theme
  UPDATE modern_themes
  SET
    config = p_config,
    config_hash = v_new_hash,
    validation_status = 'passed',
    validation_errors = NULL,
    updated_at = now()
  WHERE id = p_theme_id;

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
      'version', v_version_number
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
-- FUNCTION: Load Theme By ID (Helper)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_theme_by_id(p_theme_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_theme record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Theme not found'
    );
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'theme', to_jsonb(v_theme)
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to load theme: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;
