# Apply Health Library Migration - Instructions

## Problem
The application is trying to access a column `health_library_enabled` that doesn't exist in the `modern_site_settings` table, causing console errors:

```
"column modern_site_settings.health_library_enabled does not exist"
```

## Solution
Apply the migration to add the missing column to the database.

## Steps to Apply Migration

### 1. Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql**

Or navigate:
1. Open your Supabase dashboard
2. Select your project: `ztfrjlmkemqjbclaeqfw`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### 2. Copy and Paste This SQL

```sql
-- Add health_library_enabled column to modern_site_settings
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
  ) THEN
    -- Add column with default true and NOT NULL
    ALTER TABLE modern_site_settings
    ADD COLUMN health_library_enabled boolean DEFAULT true NOT NULL;

    RAISE NOTICE 'Column health_library_enabled added successfully with default value true';
  ELSE
    RAISE NOTICE 'Column health_library_enabled already exists';
  END IF;

  -- Ensure there is at least one settings row
  IF NOT EXISTS (SELECT 1 FROM modern_site_settings LIMIT 1) THEN
    INSERT INTO modern_site_settings (health_library_enabled)
    VALUES (true);

    RAISE NOTICE 'Initialized modern_site_settings table with default row';
  ELSE
    -- Update existing rows to ensure they have a value
    UPDATE modern_site_settings
    SET health_library_enabled = COALESCE(health_library_enabled, true)
    WHERE health_library_enabled IS NULL;

    RAISE NOTICE 'Updated existing rows to ensure health_library_enabled has a value';
  END IF;
END $$;
```

### 3. Execute the SQL

1. Click the green "Run" button (or press Ctrl+Enter / Cmd+Enter)
2. Wait for the success message
3. You should see notices like:
   - "Column health_library_enabled added successfully with default value true"
   - Either "Initialized modern_site_settings table with default row" OR "Updated existing rows..."

### 4. Verify the Migration

Run this command in your terminal to verify:

```bash
node verify-health-library-column.js
```

You should see:
- ✅ Column health_library_enabled EXISTS!
- 📊 Settings Row Details showing health_library_enabled: true

### 5. Reload Your Application

1. Refresh your browser
2. The console errors should be gone
3. Navigate to Admin > Health Library (Manage Illnesses)
4. You should see the "Public Visibility" toggle working correctly

## What This Migration Does

1. **Adds Column**: Creates `health_library_enabled` column in `modern_site_settings` table
   - Type: `boolean`
   - Default: `true` (enabled by default)
   - Constraint: `NOT NULL`

2. **Ensures Data Integrity**:
   - If the `modern_site_settings` table is empty, it creates a default row
   - If rows exist, it ensures they have a value for the new column

3. **RLS Compatible**:
   - The column respects existing Row Level Security policies on the table
   - Public users can read the setting
   - Only admins can modify it

## After Migration

The "Public Visibility" toggle in the Manage Illnesses admin page will work correctly:

- **Toggle ON (Green)**: Health Library is visible to public users in navigation and routes
- **Toggle OFF (Gray)**: Health Library is hidden from public users (admin still has access)

## Troubleshooting

### If you see "Column already exists" error:
The migration is idempotent - it's safe to run multiple times. If the column exists, it will skip creation.

### If verification fails:
1. Make sure you ran the SQL in the correct Supabase project
2. Check that you have proper permissions
3. Try refreshing the Supabase dashboard
4. Contact support if issues persist

### If the toggle doesn't work after migration:
1. Clear your browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Check browser console for any new errors
4. Verify the column exists using the verification script

## Files Modified

- `supabase/migrations/20251011000000_add_health_library_toggle.sql` - Updated with default value `true`
- `apply-health-library-migration.js` - Script to apply migration (created)
- `verify-health-library-column.js` - Script to verify migration (created)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Run the verification script: `node verify-health-library-column.js`
3. Check Supabase logs in the dashboard
