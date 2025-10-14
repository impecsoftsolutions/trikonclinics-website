# Quick Start: Fix Health Library Error

## The Problem
```
Error: column modern_site_settings.health_library_enabled does not exist
```

## The Fix (3 Simple Steps)

### Step 1: Open Supabase SQL Editor
🔗 https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql

### Step 2: Run This SQL
```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
  ) THEN
    ALTER TABLE modern_site_settings
    ADD COLUMN health_library_enabled boolean DEFAULT true NOT NULL;
    RAISE NOTICE 'Column added successfully';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM modern_site_settings LIMIT 1) THEN
    INSERT INTO modern_site_settings (health_library_enabled) VALUES (true);
  END IF;
END $$;
```

### Step 3: Verify It Worked
```bash
node verify-health-library-column.js
```

## Expected Result
✅ No more console errors
✅ Toggle works in Admin > Health Library (Manage Illnesses)
✅ Health Library enabled by default (you can disable to test)

## What This Does
Adds a column to control whether Health Library is visible to public users:
- **Enabled** (default): Public can see Health Library
- **Disabled**: Health Library hidden from public (admin still has access)

## Test the Toggle
1. Go to: **Admin > Health Library (Manage Illnesses)**
2. Top-right corner: Look for "Public Visibility" toggle
3. Click to disable (turns gray)
4. Open site in incognito → Health Library link should be gone
5. Click to enable (turns green)
6. Health Library link should reappear

## Need Help?
📖 Read the full guide: `APPLY-MIGRATION-NOW.md`
📋 Complete summary: `HEALTH-LIBRARY-FIX-SUMMARY.md`
