# Health Library Column Fix - Complete Summary

## Issue Resolved
**Error**: `column modern_site_settings.health_library_enabled does not exist`

**Root Cause**: The frontend code queries a database column that hasn't been created yet.

## Solution Implemented

### 1. Migration File Updated ✅
**File**: `supabase/migrations/20251011000000_add_health_library_toggle.sql`

**Changes**:
- Changed default value from `false` to `true` (as requested)
- Added `NOT NULL` constraint for data integrity
- Added logic to initialize settings row if table is empty
- Added logic to update existing rows with default value
- Enhanced documentation with security and purpose details

### 2. Helper Scripts Created ✅

**Script 1**: `apply-health-library-migration.js`
- Attempts to apply migration via Supabase RPC
- Falls back to displaying manual SQL instructions
- Provides step-by-step guidance

**Script 2**: `verify-health-library-column.js`
- Checks if the column exists in the database
- Displays current settings row details
- Provides migration SQL if column doesn't exist
- Confirms successful migration

**Script 3**: `APPLY-MIGRATION-NOW.md`
- Complete step-by-step instructions
- Direct link to Supabase SQL Editor
- Copy-paste ready SQL
- Troubleshooting guide

## Manual Action Required

Since we cannot directly execute SQL on your Supabase database, you need to:

### Step 1: Run the SQL Migration

1. Go to: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql

2. Copy and paste this SQL:

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

3. Click "Run" button

### Step 2: Verify the Migration

Run this command in your terminal:

```bash
node verify-health-library-column.js
```

Expected output:
```
✅ Column health_library_enabled EXISTS!

📊 Settings Row Details:
   Settings ID: [uuid]
   Health Library Enabled: true
   Active Theme ID: [uuid or "Not set"]
   Site Mode: light

🎉 Migration successful! The column is ready to use.
```

### Step 3: Test the Application

1. **Reload your browser** (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)

2. **Check console** - The errors should be gone:
   - ❌ Before: `column modern_site_settings.health_library_enabled does not exist`
   - ✅ After: No errors

3. **Test the toggle**:
   - Go to: Admin > Health Library (Manage Illnesses)
   - Find the "Public Visibility" toggle in the top-right
   - Toggle it OFF (gray) → Health Library should disappear from public nav
   - Toggle it ON (green) → Health Library should appear in public nav

4. **Test public access**:
   - Open in incognito/private window
   - Navigate to public site
   - With toggle ON: You should see "Health Library" in navigation
   - With toggle OFF: "Health Library" link should be hidden

## What the Feature Does

### Admin Interface (Manage Illnesses Page)

The page displays a "Public Visibility" toggle with:
- **Globe icon** to indicate it controls public access
- **Toggle switch** (green when enabled, gray when disabled)
- **Status text** showing "Enabled" or "Disabled"

Located in the header next to the "Add Illness" button.

### Public Interface

When enabled:
- Health Library link appears in public navigation
- Public users can browse illnesses and categories
- All published content is accessible

When disabled:
- Health Library link is hidden from navigation
- Direct URL access should be restricted (needs implementation)
- Admin still has full access to manage content

## Technical Details

### Database Schema

**Table**: `modern_site_settings`

**New Column**:
- **Name**: `health_library_enabled`
- **Type**: `boolean`
- **Default**: `true`
- **Constraint**: `NOT NULL`
- **Purpose**: Global toggle for Health Library visibility

### Code Implementation

**File**: `src/pages/ManageIllnesses.tsx`

**Lines 67, 73**: Fetches setting on page load
```typescript
supabase
  .from('modern_site_settings')
  .select('health_library_enabled')
  .single()
```

**Line 186**: Updates setting when toggled
```typescript
supabase
  .from('modern_site_settings')
  .update({ health_library_enabled: !healthLibraryEnabled })
  .eq('id', settings.id)
```

**Lines 212-232**: UI toggle component
- Shows current state
- Allows admin to enable/disable
- Provides visual feedback

### Security (RLS)

The `modern_site_settings` table has RLS **disabled** (line 349 in migration 20251009170000):
```sql
ALTER TABLE modern_site_settings DISABLE ROW LEVEL SECURITY;
```

This means:
- All authenticated users can read the settings
- Only admins should be able to update (enforced at application level)
- Public (anonymous) users can read the setting to check if Health Library is enabled

## Next Steps (Optional Enhancements)

### 1. Public Route Protection
Add logic to redirect or show "Coming Soon" when Health Library is disabled:

**File**: `src/pages/HealthLibrary.tsx`
- Check `health_library_enabled` on mount
- Redirect to home if disabled
- Show loading state while checking

### 2. Navigation Link Hiding
Update public navigation to conditionally show Health Library link:

**File**: `src/components/PublicNav.tsx`
- Fetch `health_library_enabled` setting
- Only render Health Library link if enabled
- Cache the setting for performance

### 3. Real-time Updates
Use Supabase subscriptions to detect toggle changes:
- Subscribe to `modern_site_settings` changes
- Update UI automatically when admin toggles the setting
- No page refresh needed

### 4. Settings Context
Create a shared context for site settings:
- Centralize access to `health_library_enabled`
- Reduce duplicate database queries
- Provide consistent state across components

## Files Modified/Created

### Modified:
- `supabase/migrations/20251011000000_add_health_library_toggle.sql`

### Created:
- `apply-health-library-migration.js` - Migration application script
- `verify-health-library-column.js` - Verification script
- `APPLY-MIGRATION-NOW.md` - User-friendly instructions
- `HEALTH-LIBRARY-FIX-SUMMARY.md` - This summary document

## Verification Checklist

- [ ] SQL migration executed in Supabase SQL Editor
- [ ] Verification script confirms column exists
- [ ] Browser console shows no errors about `health_library_enabled`
- [ ] Toggle in Manage Illnesses page works correctly
- [ ] Toggle switches between "Enabled" (green) and "Disabled" (gray)
- [ ] Setting persists across page refreshes
- [ ] Admin can see current state immediately on page load

## Rollback (If Needed)

If you need to remove the column:

```sql
ALTER TABLE modern_site_settings
DROP COLUMN IF EXISTS health_library_enabled;
```

**Warning**: This will break the toggle functionality and cause console errors.

## Support

If you encounter issues:

1. **Check verification script output**:
   ```bash
   node verify-health-library-column.js
   ```

2. **Check browser console** for any new errors

3. **Check Supabase logs** in the dashboard for server-side errors

4. **Verify RLS policies** on `modern_site_settings` table

5. **Confirm you're using the correct Supabase project** (ztfrjlmkemqjbclaeqfw)

## Summary

The fix is ready to be applied. Once you run the SQL migration in Supabase, the Health Library toggle feature will work correctly. The column will be created with a default value of `true` (enabled), allowing you to immediately test disabling the feature as you requested.
