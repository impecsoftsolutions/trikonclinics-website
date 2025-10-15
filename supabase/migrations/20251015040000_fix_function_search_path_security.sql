/*
  # Fix Function Search Path Security

  ## Overview
  This migration addresses Supabase linter warning 0011_function_search_path_mutable
  by adding `SET search_path = public` to all affected database functions.

  ## Security Issue
  Functions without an explicit search_path setting are vulnerable to search path
  injection attacks where malicious code could manipulate the search path to execute
  unintended functions. Setting `search_path = public` explicitly ensures functions
  always reference objects from the expected schema.

  ## Functions Updated (16 total)
  1. update_health_library_illnesses_updated_at - Trigger function for timestamp updates
  2. calculate_contrast_ratio - WCAG contrast ratio calculation utility
  3. validate_wcag_compliance - WCAG 2.2 AA compliance validation
  4. validate_theme_config - Theme configuration validation
  5. generate_config_hash - SHA-256 hash generation for themes
  6. rollback_theme - Theme rollback operation
  7. update_updated_at_column - Generic timestamp update trigger
  8. duplicate_theme - Theme duplication operation
  9. update_theme_hash - Theme hash update trigger
  10. get_paginated_events - Paginated event query function
  11. get_event_statistics - Event statistics aggregation
  12. activate_theme_atomic - Atomic theme activation
  13. delete_event_cascade - Cascade event deletion
  14. get_next_image_order - Next display order calculation
  15. update_theme - Theme configuration update
  16. get_theme_by_id - Theme retrieval by ID

  ## Changes Made
  - Added `SET search_path = public` to each function definition
  - Preserved all existing function logic and signatures
  - Maintained IMMUTABLE/STABLE/VOLATILE attributes where applicable
  - No breaking changes to function behavior

  ## References
  - Supabase Linter: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
  - PostgreSQL Security: https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY
*/

-- ============================================================================
-- 1. update_health_library_illnesses_updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_health_library_illnesses_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. calculate_contrast_ratio
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_contrast_ratio(color1 text, color2 text)
RETURNS numeric
SET search_path = public
AS $$
DECLARE
  l1 numeric;
  l2 numeric;
  r1 integer;
  g1 integer;
  b1 integer;
  r2 integer;
  g2 integer;
  b2 integer;
  ratio numeric;
BEGIN
  -- Remove # prefix if present
  color1 := REPLACE(color1, '#', '');
  color2 := REPLACE(color2, '#', '');

  -- Extract RGB components
  r1 := ('x' || substring(color1, 1, 2))::bit(8)::integer;
  g1 := ('x' || substring(color1, 3, 2))::bit(8)::integer;
  b1 := ('x' || substring(color1, 5, 2))::bit(8)::integer;

  r2 := ('x' || substring(color2, 1, 2))::bit(8)::integer;
  g2 := ('x' || substring(color2, 3, 2))::bit(8)::integer;
  b2 := ('x' || substring(color2, 5, 2))::bit(8)::integer;

  -- Calculate relative luminance (simplified WCAG formula)
  l1 := (0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1) / 255.0;
  l2 := (0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2) / 255.0;

  -- Calculate contrast ratio
  IF l1 > l2 THEN
    ratio := (l1 + 0.05) / (l2 + 0.05);
  ELSE
    ratio := (l2 + 0.05) / (l1 + 0.05);
  END IF;

  RETURN ROUND(ratio, 2);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 1.0; -- Return minimum contrast on error
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. validate_wcag_compliance
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_wcag_compliance(theme_config jsonb)
RETURNS jsonb
SET search_path = public
AS $$
DECLARE
  result jsonb;
  errors jsonb := '[]'::jsonb;
  warnings jsonb := '[]'::jsonb;
  light_colors jsonb;
  dark_colors jsonb;
  text_bg_ratio numeric;
  text_secondary_ratio numeric;
  button_ratio numeric;
  focus_ratio numeric;
  passed boolean := true;
BEGIN
  -- Extract color configurations
  light_colors := theme_config->'colors'->'light';
  dark_colors := theme_config->'colors'->'dark';

  -- Check light mode contrasts
  IF light_colors IS NOT NULL THEN
    -- Text on background contrast (minimum 4.5:1 for AA)
    text_bg_ratio := calculate_contrast_ratio(
      light_colors->'text'->>'primary',
      light_colors->'background'->>'page'
    );

    IF text_bg_ratio < 4.5 THEN
      errors := errors || jsonb_build_object(
        'type', 'contrast',
        'mode', 'light',
        'issue', 'Primary text on page background',
        'ratio', text_bg_ratio,
        'required', 4.5,
        'severity', 'error'
      );
      passed := false;
    END IF;

    -- Secondary text contrast (minimum 4.5:1 for AA)
    text_secondary_ratio := calculate_contrast_ratio(
      light_colors->'text'->>'secondary',
      light_colors->'background'->>'page'
    );

    IF text_secondary_ratio < 4.5 THEN
      warnings := warnings || jsonb_build_object(
        'type', 'contrast',
        'mode', 'light',
        'issue', 'Secondary text on page background',
        'ratio', text_secondary_ratio,
        'required', 4.5,
        'severity', 'warning'
      );
    END IF;

    -- Button text contrast (minimum 4.5:1 for AA)
    button_ratio := calculate_contrast_ratio(
      light_colors->'text'->>'inverse',
      light_colors->>'primary'
    );

    IF button_ratio < 4.5 THEN
      errors := errors || jsonb_build_object(
        'type', 'contrast',
        'mode', 'light',
        'issue', 'Button text on primary color',
        'ratio', button_ratio,
        'required', 4.5,
        'severity', 'error'
      );
      passed := false;
    END IF;

    -- Focus indicator contrast (minimum 3:1 for WCAG 2.2)
    focus_ratio := calculate_contrast_ratio(
      light_colors->'border'->>'focus',
      light_colors->'background'->>'page'
    );

    IF focus_ratio < 3.0 THEN
      errors := errors || jsonb_build_object(
        'type', 'contrast',
        'mode', 'light',
        'issue', 'Focus indicator on page background',
        'ratio', focus_ratio,
        'required', 3.0,
        'severity', 'error'
      );
      passed := false;
    END IF;
  END IF;

  -- Check dark mode contrasts
  IF dark_colors IS NOT NULL THEN
    -- Text on background contrast
    text_bg_ratio := calculate_contrast_ratio(
      dark_colors->'text'->>'primary',
      dark_colors->'background'->>'page'
    );

    IF text_bg_ratio < 4.5 THEN
      errors := errors || jsonb_build_object(
        'type', 'contrast',
        'mode', 'dark',
        'issue', 'Primary text on page background',
        'ratio', text_bg_ratio,
        'required', 4.5,
        'severity', 'error'
      );
      passed := false;
    END IF;
  END IF;

  -- Check minimum target size (24x24px for WCAG 2.2)
  IF (theme_config->'accessibility'->>'minimumTargetSize')::text < '24px' THEN
    warnings := warnings || jsonb_build_object(
      'type', 'targetSize',
      'issue', 'Minimum target size below WCAG 2.2 recommendation',
      'current', theme_config->'accessibility'->>'minimumTargetSize',
      'required', '24px',
      'severity', 'warning'
    );
  END IF;

  -- Build result
  result := jsonb_build_object(
    'passed', passed,
    'errors', errors,
    'warnings', warnings,
    'checkedAt', now()
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'passed', false,
      'errors', jsonb_build_array(jsonb_build_object(
        'type', 'validation_error',
        'message', SQLERRM
      )),
      'warnings', '[]'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. validate_theme_config
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_theme_config(theme_config jsonb)
RETURNS jsonb
SET search_path = public
AS $$
DECLARE
  result jsonb;
  errors jsonb := '[]'::jsonb;
  font_url text;
  allowed_domains text[] := ARRAY[
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com'
  ];
  domain_allowed boolean;
BEGIN
  -- Check required top-level keys
  IF NOT (theme_config ? 'colors') THEN
    errors := errors || jsonb_build_object('field', 'colors', 'message', 'Colors configuration is required');
  END IF;

  IF NOT (theme_config ? 'typography') THEN
    errors := errors || jsonb_build_object('field', 'typography', 'message', 'Typography configuration is required');
  END IF;

  IF NOT (theme_config ? 'designTokens') THEN
    errors := errors || jsonb_build_object('field', 'designTokens', 'message', 'Design tokens are required');
  END IF;

  IF NOT (theme_config ? 'layouts') THEN
    errors := errors || jsonb_build_object('field', 'layouts', 'message', 'Layout configuration is required');
  END IF;

  IF NOT (theme_config ? 'animations') THEN
    errors := errors || jsonb_build_object('field', 'animations', 'message', 'Animation configuration is required');
  END IF;

  IF NOT (theme_config ? 'accessibility') THEN
    errors := errors || jsonb_build_object('field', 'accessibility', 'message', 'Accessibility configuration is required');
  END IF;

  -- Validate font URLs (must be from allowed domains)
  IF theme_config->'typography' ? 'fontUrls' THEN
    FOR font_url IN SELECT jsonb_array_elements_text(theme_config->'typography'->'fontUrls')
    LOOP
      domain_allowed := false;

      -- Check if URL contains any allowed domain
      FOR i IN 1..array_length(allowed_domains, 1) LOOP
        IF font_url LIKE '%' || allowed_domains[i] || '%' THEN
          domain_allowed := true;
          EXIT;
        END IF;
      END LOOP;

      -- Block dangerous protocols
      IF font_url LIKE 'file://%' OR font_url LIKE 'javascript:%' THEN
        errors := errors || jsonb_build_object(
          'field', 'typography.fontUrls',
          'message', 'Dangerous protocol detected in font URL: ' || font_url
        );
      ELSIF NOT domain_allowed THEN
        errors := errors || jsonb_build_object(
          'field', 'typography.fontUrls',
          'message', 'Font URL from unauthorized domain: ' || font_url
        );
      END IF;
    END LOOP;
  END IF;

  -- Validate hex color format for primary colors
  IF theme_config->'colors'->'light'->>'primary' !~ '^#[0-9A-Fa-f]{6}$' THEN
    errors := errors || jsonb_build_object(
      'field', 'colors.light.primary',
      'message', 'Invalid hex color format'
    );
  END IF;

  -- Build result
  IF jsonb_array_length(errors) > 0 THEN
    result := jsonb_build_object(
      'valid', false,
      'errors', errors
    );
  ELSE
    result := jsonb_build_object(
      'valid', true,
      'errors', '[]'::jsonb
    );
  END IF;

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', jsonb_build_array(jsonb_build_object(
        'field', 'general',
        'message', SQLERRM
      ))
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. generate_config_hash
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_config_hash(theme_config jsonb)
RETURNS text
SET search_path = public
AS $$
BEGIN
  RETURN encode(digest(theme_config::text, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. rollback_theme
-- ============================================================================

CREATE OR REPLACE FUNCTION rollback_theme(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
SET search_path = public
AS $$
DECLARE
  v_settings record;
  v_previous_theme record;
  v_result jsonb;
BEGIN
  -- Get current settings
  SELECT * INTO v_settings FROM modern_site_settings LIMIT 1;

  IF v_settings.previous_theme_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No previous theme available for rollback'
    );
  END IF;

  -- Get previous theme
  SELECT * INTO v_previous_theme FROM modern_themes WHERE id = v_settings.previous_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Previous theme no longer exists'
    );
  END IF;

  -- Use activate_theme_atomic for rollback
  v_result := activate_theme_atomic(v_settings.previous_theme_id, p_user_id);

  IF (v_result->>'success')::boolean THEN
    -- Log rollback
    INSERT INTO activity_logs (
      user_id,
      action,
      description,
      table_affected,
      record_id
    ) VALUES (
      p_user_id,
      'theme_rollback',
      'Rolled back to theme: ' || v_previous_theme.name,
      'modern_themes',
      v_settings.previous_theme_id
    );

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Successfully rolled back to: ' || v_previous_theme.name,
      'theme_id', v_settings.previous_theme_id
    );
  ELSE
    RETURN v_result;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Rollback failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. update_updated_at_column
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. duplicate_theme
-- ============================================================================

CREATE OR REPLACE FUNCTION duplicate_theme(
  p_theme_id uuid,
  p_new_name text,
  p_new_slug text,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
SET search_path = public
AS $$
DECLARE
  v_original_theme record;
  v_new_theme_id uuid;
  v_config_hash text;
BEGIN
  -- Get original theme
  SELECT * INTO v_original_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Original theme not found'
    );
  END IF;

  -- Generate hash for new theme
  v_config_hash := generate_config_hash(v_original_theme.config);

  -- Insert duplicate
  INSERT INTO modern_themes (
    name,
    slug,
    description,
    config,
    is_preset,
    config_hash,
    validation_status,
    validation_errors,
    created_by
  ) VALUES (
    p_new_name,
    p_new_slug,
    v_original_theme.description || ' (Copy)',
    v_original_theme.config,
    false, -- Copies are never presets
    v_config_hash,
    v_original_theme.validation_status,
    v_original_theme.validation_errors,
    p_user_id
  )
  RETURNING id INTO v_new_theme_id;

  -- Create initial version
  INSERT INTO modern_theme_versions (
    theme_id,
    version_number,
    config_snapshot,
    change_description,
    created_by
  ) VALUES (
    v_new_theme_id,
    1,
    v_original_theme.config,
    'Initial version (duplicated from: ' || v_original_theme.name || ')',
    p_user_id
  );

  -- Log duplication
  INSERT INTO activity_logs (
    user_id,
    action,
    description,
    table_affected,
    record_id
  ) VALUES (
    p_user_id,
    'theme_duplicated',
    'Duplicated theme: ' || v_original_theme.name || ' as ' || p_new_name,
    'modern_themes',
    v_new_theme_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'theme_id', v_new_theme_id,
    'name', p_new_name,
    'slug', p_new_slug
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Theme with this name or slug already exists'
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Duplication failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. update_theme_hash
-- ============================================================================

CREATE OR REPLACE FUNCTION update_theme_hash()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.config_hash := generate_config_hash(NEW.config);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. get_paginated_events
-- ============================================================================

CREATE OR REPLACE FUNCTION get_paginated_events(
  p_status text DEFAULT NULL,
  p_tag_slug text DEFAULT NULL,
  p_is_featured boolean DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 20
)
RETURNS json
SET search_path = public
AS $$
DECLARE
  v_offset integer;
  v_total integer;
  v_result json;
BEGIN
  v_offset := (p_page - 1) * p_page_size;

  -- Get total count
  SELECT COUNT(DISTINCT e.id)
  INTO v_total
  FROM events e
  LEFT JOIN event_tags et ON e.id = et.event_id
  LEFT JOIN tags t ON et.tag_id = t.id
  WHERE
    (p_status IS NULL OR e.status = p_status)
    AND (p_tag_slug IS NULL OR t.slug = p_tag_slug)
    AND (p_is_featured IS NULL OR e.is_featured = p_is_featured)
    AND (p_date_from IS NULL OR e.event_date >= p_date_from)
    AND (p_date_to IS NULL OR e.event_date <= p_date_to);

  -- Get paginated results
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total::float / p_page_size),
    'events', COALESCE(
      json_agg(
        json_build_object(
          'id', e.id,
          'title', e.title,
          'slug', e.slug,
          'description', e.description,
          'event_date', e.event_date,
          'status', e.status,
          'is_featured', e.is_featured,
          'created_at', e.created_at,
          'updated_at', e.updated_at,
          'image_count', (SELECT COUNT(*) FROM event_images WHERE event_id = e.id),
          'video_count', (SELECT COUNT(*) FROM event_videos WHERE event_id = e.id)
        )
      ),
      '[]'::json
    )
  )
  INTO v_result
  FROM (
    SELECT DISTINCT e.*
    FROM events e
    LEFT JOIN event_tags et ON e.id = et.event_id
    LEFT JOIN tags t ON et.tag_id = t.id
    WHERE
      (p_status IS NULL OR e.status = p_status)
      AND (p_tag_slug IS NULL OR t.slug = p_tag_slug)
      AND (p_is_featured IS NULL OR e.is_featured = p_is_featured)
      AND (p_date_from IS NULL OR e.event_date >= p_date_from)
      AND (p_date_to IS NULL OR e.event_date <= p_date_to)
    ORDER BY e.event_date DESC, e.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) e;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. get_event_statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_event_statistics()
RETURNS json
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'total_events', (SELECT COUNT(*) FROM events),
    'published_events', (SELECT COUNT(*) FROM events WHERE status = 'published'),
    'draft_events', (SELECT COUNT(*) FROM events WHERE status = 'draft'),
    'featured_events', (SELECT COUNT(*) FROM events WHERE is_featured = true),
    'total_images', (SELECT COUNT(*) FROM event_images),
    'total_videos', (SELECT COUNT(*) FROM event_videos),
    'total_tags', (SELECT COUNT(*) FROM tags),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE status = 'published' AND event_date > now()),
    'past_events', (SELECT COUNT(*) FROM events WHERE status = 'published' AND event_date <= now()),
    'events_with_images', (SELECT COUNT(DISTINCT event_id) FROM event_images),
    'events_with_videos', (SELECT COUNT(DISTINCT event_id) FROM event_videos)
  )
  INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. activate_theme_atomic
-- ============================================================================

CREATE OR REPLACE FUNCTION activate_theme_atomic(
  p_theme_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
SET search_path = public
AS $$
DECLARE
  v_theme record;
  v_current_settings record;
  v_new_hash text;
  v_version_number integer;
  v_result jsonb;
BEGIN
  -- Start transaction (implicit in function)

  -- Step 1: Verify theme exists and is valid
  SELECT * INTO v_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Theme not found'
    );
  END IF;

  IF v_theme.validation_status = 'failed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Theme failed validation checks',
      'validation_errors', v_theme.validation_errors
    );
  END IF;

  -- Step 2: Get current settings
  SELECT * INTO v_current_settings FROM modern_site_settings LIMIT 1;

  -- Step 3: Generate new hash
  v_new_hash := generate_config_hash(v_theme.config);

  -- Step 4: Create version snapshot if theme has previous active version
  IF v_current_settings.active_theme_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM modern_theme_versions
    WHERE theme_id = v_current_settings.active_theme_id;

    INSERT INTO modern_theme_versions (
      theme_id,
      version_number,
      config_snapshot,
      change_description,
      created_by,
      is_rollback
    )
    SELECT
      id,
      v_version_number,
      config,
      'Snapshot before theme change',
      p_user_id,
      false
    FROM modern_themes
    WHERE id = v_current_settings.active_theme_id;
  END IF;

  -- Step 5: Update site settings atomically
  IF v_current_settings.id IS NOT NULL THEN
    UPDATE modern_site_settings
    SET
      previous_theme_id = active_theme_id,
      active_theme_id = p_theme_id,
      theme_hash = v_new_hash,
      activated_at = now(),
      activated_by = p_user_id,
      rollback_deadline = now() + interval '24 hours',
      updated_at = now()
    WHERE id = v_current_settings.id;
  ELSE
    -- Insert if no settings exist
    INSERT INTO modern_site_settings (
      active_theme_id,
      theme_hash,
      activated_at,
      activated_by,
      rollback_deadline
    ) VALUES (
      p_theme_id,
      v_new_hash,
      now(),
      p_user_id,
      now() + interval '24 hours'
    );
  END IF;

  -- Step 6: Log activation
  INSERT INTO activity_logs (
    user_id,
    action,
    description,
    table_affected,
    record_id
  ) VALUES (
    p_user_id,
    'theme_activated',
    'Activated theme: ' || v_theme.name,
    'modern_themes',
    p_theme_id
  );

  -- Return success
  v_result := jsonb_build_object(
    'success', true,
    'theme_id', p_theme_id,
    'theme_name', v_theme.name,
    'theme_hash', v_new_hash,
    'activated_at', now()
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Rollback happens automatically
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to activate theme: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. delete_event_cascade
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_event_cascade(p_event_id uuid)
RETURNS json
SET search_path = public
AS $$
DECLARE
  v_deleted_images integer;
  v_deleted_videos integer;
  v_deleted_tags integer;
  v_result json;
BEGIN
  -- Count related records before deletion
  SELECT COUNT(*) INTO v_deleted_images FROM event_images WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_deleted_videos FROM event_videos WHERE event_id = p_event_id;
  SELECT COUNT(*) INTO v_deleted_tags FROM event_tags WHERE event_id = p_event_id;

  -- Delete the event (cascade will handle related records)
  DELETE FROM events WHERE id = p_event_id;

  -- Return deletion summary
  SELECT json_build_object(
    'event_id', p_event_id,
    'deleted_images', v_deleted_images,
    'deleted_videos', v_deleted_videos,
    'deleted_tags', v_deleted_tags,
    'success', true
  )
  INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 14. get_next_image_order
-- ============================================================================

CREATE OR REPLACE FUNCTION get_next_image_order(p_event_id uuid)
RETURNS integer
SET search_path = public
AS $$
DECLARE
  v_max_order integer;
BEGIN
  SELECT COALESCE(MAX(display_order), -1) + 1
  INTO v_max_order
  FROM event_images
  WHERE event_id = p_event_id;

  RETURN v_max_order;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. update_theme
-- ============================================================================

CREATE OR REPLACE FUNCTION update_theme(
  p_theme_id uuid,
  p_config jsonb,
  p_change_description text DEFAULT 'Theme configuration updated',
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
SET search_path = public
AS $$
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
-- 16. get_theme_by_id
-- ============================================================================

CREATE OR REPLACE FUNCTION get_theme_by_id(p_theme_id uuid)
RETURNS jsonb
SET search_path = public
AS $$
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify that all functions have been updated with search_path
DO $$
DECLARE
  v_function_count integer;
  v_functions_with_search_path integer;
BEGIN
  -- Count target functions
  SELECT COUNT(*)
  INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'update_health_library_illnesses_updated_at',
      'calculate_contrast_ratio',
      'validate_wcag_compliance',
      'validate_theme_config',
      'generate_config_hash',
      'rollback_theme',
      'update_updated_at_column',
      'duplicate_theme',
      'update_theme_hash',
      'get_paginated_events',
      'get_event_statistics',
      'activate_theme_atomic',
      'delete_event_cascade',
      'get_next_image_order',
      'update_theme',
      'get_theme_by_id'
    );

  -- Count functions with search_path set
  SELECT COUNT(*)
  INTO v_functions_with_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'update_health_library_illnesses_updated_at',
      'calculate_contrast_ratio',
      'validate_wcag_compliance',
      'validate_theme_config',
      'generate_config_hash',
      'rollback_theme',
      'update_updated_at_column',
      'duplicate_theme',
      'update_theme_hash',
      'get_paginated_events',
      'get_event_statistics',
      'activate_theme_atomic',
      'delete_event_cascade',
      'get_next_image_order',
      'update_theme',
      'get_theme_by_id'
    )
    AND 'search_path=public' = ANY(p.proconfig);

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Function Search Path Security Fix - Verification';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total target functions: %', v_function_count;
  RAISE NOTICE 'Functions with search_path=public: %', v_functions_with_search_path;
  RAISE NOTICE '';

  IF v_function_count = v_functions_with_search_path AND v_function_count = 16 THEN
    RAISE NOTICE 'SUCCESS: All 16 functions have been updated with SET search_path = public';
  ELSE
    RAISE WARNING 'INCOMPLETE: Not all functions have been updated';
    RAISE WARNING 'Expected 16 functions, found % with search_path set', v_functions_with_search_path;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Security enhancement complete!';
  RAISE NOTICE '============================================================';
END $$;
