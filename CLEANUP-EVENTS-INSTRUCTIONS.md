# Events System Cleanup Instructions

## What Was Done

1. ✅ Removed all events-related migration files from `supabase/migrations/`
2. ✅ Created cleanup migration at `supabase/migrations/20251015030000_remove_events_system.sql`

## What You Need to Do

The events table and related columns still exist in your database. To remove them:

### Option 1: Run the Migration SQL Directly (Recommended)

1. Go to your Supabase Dashboard: https://ztfrjlmkemqjbclaeqfw.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the following SQL:

```sql
-- Drop events table if it exists
DROP TABLE IF EXISTS events CASCADE;

-- Drop event-related tables if they exist
DROP TABLE IF EXISTS event_tags CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;

-- Remove events-related columns from site_settings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_enabled'
  ) THEN
    ALTER TABLE site_settings DROP COLUMN events_enabled;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_settings' AND column_name = 'events_public_access'
  ) THEN
    ALTER TABLE site_settings DROP COLUMN events_public_access;
  END IF;
END $$;

-- Remove event-images storage bucket if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'event-images'
  ) THEN
    DELETE FROM storage.buckets WHERE id = 'event-images';
  END IF;
END $$;
```

4. Click **Run** to execute the SQL

### Option 2: Use Supabase CLI (If you have it installed)

```bash
supabase db push
```

## Verification

After running the SQL, verify the cleanup by running:

```bash
node verify-events-cleanup.js
```

You should see:
- ✅ events table: REMOVED
- ✅ events_enabled column REMOVED
- ✅ events_public_access column REMOVED

## What This Does

- **Removes** the `events` table and all its data
- **Removes** the `event_tags` table (if it exists)
- **Removes** the `event_registrations` table (if it exists)
- **Removes** `events_enabled` and `events_public_access` columns from `site_settings`
- **Removes** the `event-images` storage bucket (if it exists)

## Important Notes

- This operation is SAFE - it only removes events-related data
- Your hospital profile, doctors, services, testimonials, and theme settings are NOT affected
- This cleanup is necessary because your code was rolled back but the database still has the newer schema
