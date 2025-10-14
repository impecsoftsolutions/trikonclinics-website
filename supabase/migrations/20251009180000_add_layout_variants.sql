/*
  # Add Layout Variant Support to Theme System

  ## Overview
  This migration adds layout style variants (modern, minimal, playful) to the theme system,
  along with specific typography and spacing configurations for each layout style.

  ## Changes Made

  1. Update Clinical Modern theme
     - Add layoutStyle: "modern" (Ro.com inspired)
     - Add layoutTypography with bold headings and tight line height
     - Add layoutSpacing with generous padding

  2. Update Apple Medical theme
     - Add layoutStyle: "minimal" (Apple.com inspired)
     - Add layoutTypography with light headings and relaxed line height
     - Add layoutSpacing with tight padding

  3. Update Hims Health theme
     - Add layoutStyle: "playful" (Hims.com inspired)
     - Add layoutTypography with semibold headings and comfortable line height
     - Add layoutSpacing with medium padding

  ## Layout Configurations

  ### Modern (Ro.com style)
  - Typography: h1: 48px, h2: 36px, h3: 28px, weight: 700, line-height: 1.2
  - Spacing: section: 80px, card: 32px, gap: 32px

  ### Minimal (Apple.com style)
  - Typography: h1: 36px, h2: 28px, h3: 24px, weight: 300, line-height: 1.4
  - Spacing: section: 48px, card: 16px, gap: 16px

  ### Playful (Hims.com style)
  - Typography: h1: 42px, h2: 32px, h3: 26px, weight: 600, line-height: 1.3
  - Spacing: section: 64px, card: 24px, gap: 24px

  ## Version History
  - Creates version snapshots before updating themes
  - Maintains rollback capability
  - Preserves all existing theme properties
*/

-- ============================================================================
-- CREATE VERSION SNAPSHOTS BEFORE UPDATING
-- ============================================================================

DO $$
DECLARE
  v_clinical_id uuid;
  v_apple_id uuid;
  v_hims_id uuid;
  v_version_number integer;
BEGIN
  -- Get theme IDs
  SELECT id INTO v_clinical_id FROM modern_themes WHERE slug = 'clinical-modern';
  SELECT id INTO v_apple_id FROM modern_themes WHERE slug = 'apple-medical';
  SELECT id INTO v_hims_id FROM modern_themes WHERE slug = 'hims-health';

  -- Create version snapshots for Clinical Modern
  IF v_clinical_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM modern_theme_versions
    WHERE theme_id = v_clinical_id;

    INSERT INTO modern_theme_versions (
      theme_id,
      version_number,
      config_snapshot,
      change_description,
      is_rollback
    )
    SELECT
      id,
      v_version_number,
      config,
      'Snapshot before adding layout variant support',
      false
    FROM modern_themes
    WHERE id = v_clinical_id;

    RAISE NOTICE 'Created version % snapshot for Clinical Modern', v_version_number;
  END IF;

  -- Create version snapshots for Apple Medical
  IF v_apple_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM modern_theme_versions
    WHERE theme_id = v_apple_id;

    INSERT INTO modern_theme_versions (
      theme_id,
      version_number,
      config_snapshot,
      change_description,
      is_rollback
    )
    SELECT
      id,
      v_version_number,
      config,
      'Snapshot before adding layout variant support',
      false
    FROM modern_themes
    WHERE id = v_apple_id;

    RAISE NOTICE 'Created version % snapshot for Apple Medical', v_version_number;
  END IF;

  -- Create version snapshots for Hims Health
  IF v_hims_id IS NOT NULL THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_version_number
    FROM modern_theme_versions
    WHERE theme_id = v_hims_id;

    INSERT INTO modern_theme_versions (
      theme_id,
      version_number,
      config_snapshot,
      change_description,
      is_rollback
    )
    SELECT
      id,
      v_version_number,
      config,
      'Snapshot before adding layout variant support',
      false
    FROM modern_themes
    WHERE id = v_hims_id;

    RAISE NOTICE 'Created version % snapshot for Hims Health', v_version_number;
  END IF;
END $$;

-- ============================================================================
-- UPDATE CLINICAL MODERN THEME (Modern Layout Style)
-- ============================================================================

UPDATE modern_themes
SET config = config || jsonb_build_object(
  'layoutStyle', 'modern',
  'layoutTypography', jsonb_build_object(
    'headingSizes', jsonb_build_object(
      'h1', '48px',
      'h2', '36px',
      'h3', '28px'
    ),
    'headingWeight', '700',
    'headingLineHeight', '1.2'
  ),
  'layoutSpacing', jsonb_build_object(
    'sectionPaddingY', '80px',
    'cardPadding', '32px',
    'elementGap', '32px'
  )
)
WHERE slug = 'clinical-modern';

-- ============================================================================
-- UPDATE APPLE MEDICAL THEME (Minimal Layout Style)
-- ============================================================================

UPDATE modern_themes
SET config = config || jsonb_build_object(
  'layoutStyle', 'minimal',
  'layoutTypography', jsonb_build_object(
    'headingSizes', jsonb_build_object(
      'h1', '36px',
      'h2', '28px',
      'h3', '24px'
    ),
    'headingWeight', '300',
    'headingLineHeight', '1.4'
  ),
  'layoutSpacing', jsonb_build_object(
    'sectionPaddingY', '48px',
    'cardPadding', '16px',
    'elementGap', '16px'
  )
)
WHERE slug = 'apple-medical';

-- ============================================================================
-- UPDATE HIMS HEALTH THEME (Playful Layout Style)
-- ============================================================================

UPDATE modern_themes
SET config = config || jsonb_build_object(
  'layoutStyle', 'playful',
  'layoutTypography', jsonb_build_object(
    'headingSizes', jsonb_build_object(
      'h1', '42px',
      'h2', '32px',
      'h3', '26px'
    ),
    'headingWeight', '600',
    'headingLineHeight', '1.3'
  ),
  'layoutSpacing', jsonb_build_object(
    'sectionPaddingY', '64px',
    'cardPadding', '24px',
    'elementGap', '24px'
  )
)
WHERE slug = 'hims-health';

-- ============================================================================
-- UPDATE ACTIVE THEME HASH IF NEEDED
-- ============================================================================

DO $$
DECLARE
  v_active_theme_id uuid;
  v_new_hash text;
BEGIN
  -- Get currently active theme
  SELECT active_theme_id INTO v_active_theme_id
  FROM modern_site_settings
  LIMIT 1;

  -- If one of the updated themes is active, update its hash
  IF v_active_theme_id IN (
    SELECT id FROM modern_themes WHERE slug IN ('clinical-modern', 'apple-medical', 'hims-health')
  ) THEN
    -- Get new hash for active theme
    SELECT config_hash INTO v_new_hash
    FROM modern_themes
    WHERE id = v_active_theme_id;

    -- Update site settings with new hash
    UPDATE modern_site_settings
    SET theme_hash = v_new_hash,
        updated_at = now()
    WHERE active_theme_id = v_active_theme_id;

    RAISE NOTICE 'Updated active theme hash to trigger frontend refresh';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION AND LOGGING
-- ============================================================================

DO $$
DECLARE
  v_clinical_layout text;
  v_apple_layout text;
  v_hims_layout text;
BEGIN
  -- Verify updates
  SELECT config->>'layoutStyle' INTO v_clinical_layout
  FROM modern_themes WHERE slug = 'clinical-modern';

  SELECT config->>'layoutStyle' INTO v_apple_layout
  FROM modern_themes WHERE slug = 'apple-medical';

  SELECT config->>'layoutStyle' INTO v_hims_layout
  FROM modern_themes WHERE slug = 'hims-health';

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Layout Variant Support Added Successfully';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Theme Updates:';
  RAISE NOTICE '  ✓ Clinical Modern: layoutStyle = %', v_clinical_layout;
  RAISE NOTICE '    - Typography: h1: 48px, weight: 700, line-height: 1.2';
  RAISE NOTICE '    - Spacing: section: 80px, card: 32px, gap: 32px';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ Apple Medical: layoutStyle = %', v_apple_layout;
  RAISE NOTICE '    - Typography: h1: 36px, weight: 300, line-height: 1.4';
  RAISE NOTICE '    - Spacing: section: 48px, card: 16px, gap: 16px';
  RAISE NOTICE '';
  RAISE NOTICE '  ✓ Hims Health: layoutStyle = %', v_hims_layout;
  RAISE NOTICE '    - Typography: h1: 42px, weight: 600, line-height: 1.3';
  RAISE NOTICE '    - Spacing: section: 64px, card: 24px, gap: 24px';
  RAISE NOTICE '';
  RAISE NOTICE 'Version Snapshots:';
  RAISE NOTICE '  ✓ Created backup snapshots for all three themes';
  RAISE NOTICE '  ✓ Rollback available via modern_theme_versions table';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready for Phase A implementation!';
  RAISE NOTICE '============================================================';
END $$;
