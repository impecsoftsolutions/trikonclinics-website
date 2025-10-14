# Fix Update Theme Error - Migration Required

## Problem

When trying to edit/update themes, you're getting a 404 error:
```
POST https://ztfrjlmkemqjbclaeqfw.supabase.co/rest/v1/rpc/update_theme 404 (Not Found)
Error: Could not find the function public.update_theme
```

## Root Cause

The `update_theme` database function hasn't been applied to your Supabase database yet. The migration file exists locally but needs to be executed on the database server.

## Solution: Apply the Migration

You need to manually apply the migration SQL to your Supabase database. Here's how:

### Step 1: Copy the Migration SQL

The migration SQL is in: `supabase/migrations/20251010000000_add_update_theme_function.sql`

Or copy this SQL directly:

```sql
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
```

### Step 2: Apply via Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/editor
   - Click "SQL Editor" in the left sidebar

2. **Create New Query:**
   - Click the "New Query" button

3. **Paste the SQL:**
   - Copy the entire SQL from above
   - Paste it into the SQL editor

4. **Run the Migration:**
   - Click the "Run" button (bottom right)
   - Wait for execution (should take 1-2 seconds)

5. **Verify Success:**
   - You should see a success message
   - The output panel should show no errors

### Step 3: Verify the Migration

Run the verification script to confirm the function was created:

```bash
node apply-update-theme-migration.js
```

You should see:
```
✓ Function update_theme EXISTS in the database
```

### Step 4: Test Theme Editing

1. Go to your application
2. Navigate to Modern Theme Settings
3. Try editing a theme (not a preset)
4. The edit should now work without errors

## What This Migration Does

The migration creates two database functions:

1. **update_theme()**: Updates theme configurations with:
   - Validation that the theme exists and is not a preset
   - Updates theme configuration and metadata
   - Creates version record for audit trail
   - Updates cache hash for invalidation
   - Returns structured response with success status

2. **get_theme_by_id()**: Helper function to load a specific theme by ID

## Key Features

- **Preset Protection**: Prevents editing preset themes
- **Version Control**: Automatically creates version records
- **Cache Invalidation**: Updates config_hash when theme changes
- **Error Handling**: Returns structured error responses
- **Audit Trail**: Tracks who made changes and when

## After Migration

Once the migration is applied:

- ✅ Theme editing will work correctly
- ✅ Version history will be automatically tracked
- ✅ Preset themes remain protected
- ✅ Cache invalidation works properly
- ✅ Error messages are user-friendly

## Troubleshooting

### Error: "function update_theme already exists"
- The migration has already been applied successfully
- You can proceed to test theme editing

### Error: "relation modern_theme_versions does not exist"
- You need to apply the earlier migration first
- Run: `node apply-modern-themes-migration.js`
- Follow the instructions to apply the base theme system migration

### Error: "permission denied"
- Use the Supabase Dashboard method (recommended)
- Ensure you're logged in to your Supabase account

## Need Help?

If you continue to experience issues:
1. Check that all previous migrations have been applied
2. Verify you're using the correct Supabase project
3. Check browser console for specific error messages
4. Try refreshing the application after applying the migration
