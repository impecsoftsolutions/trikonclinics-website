# Quick Fix: Theme Update Error

## The Problem
Theme editing fails with: `Could not find the function public.update_theme`

## The Solution (5 Minutes)

### Step 1: Open Supabase Dashboard
Go to: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/editor

### Step 2: Open SQL Editor
Click "SQL Editor" in the left sidebar, then click "New Query"

### Step 3: Copy & Paste This SQL

```sql
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
  SELECT * INTO v_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Theme not found');
  END IF;

  IF v_theme.is_preset THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot edit preset themes. Please duplicate the theme first to create an editable version.');
  END IF;

  v_old_config := v_theme.config;
  v_new_hash := encode(digest(p_config::text, 'sha256'), 'hex');

  UPDATE modern_themes
  SET config = p_config, config_hash = v_new_hash, validation_status = 'passed',
      validation_errors = NULL, updated_at = now()
  WHERE id = p_theme_id;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
  FROM modern_theme_versions WHERE theme_id = p_theme_id;

  INSERT INTO modern_theme_versions (theme_id, version_number, config_snapshot, change_description, change_summary, created_by, is_rollback)
  VALUES (p_theme_id, v_version_number, p_config, p_change_description,
          jsonb_build_object('updated_at', now(), 'updated_by', p_user_id, 'version', v_version_number),
          p_user_id, false);

  v_result := jsonb_build_object('success', true, 'theme_id', p_theme_id, 'theme_name', v_theme.name,
                                 'version_number', v_version_number, 'config_hash', v_new_hash, 'updated_at', now());

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update theme: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_theme_by_id(p_theme_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_theme record;
  v_result jsonb;
BEGIN
  SELECT * INTO v_theme FROM modern_themes WHERE id = p_theme_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Theme not found');
  END IF;

  v_result := jsonb_build_object('success', true, 'theme', to_jsonb(v_theme));
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to load theme: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;
```

### Step 4: Click "Run"
Wait 1-2 seconds for success message

### Step 5: Verify It Worked
Run in your terminal:
```bash
npm run db:verify-update
```

You should see: `✅ Function update_theme EXISTS and is callable!`

### Step 6: Test Theme Editing
1. Go to your application
2. Navigate to Modern Theme Settings
3. Edit a custom theme
4. Save changes - it should work now!

## Done!
Theme editing is now fully functional with automatic version control and audit trails.

---

**Need more details?** See `FIX-UPDATE-THEME-ERROR.md` for the complete guide.
