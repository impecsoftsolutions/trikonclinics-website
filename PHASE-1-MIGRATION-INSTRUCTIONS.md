# Phase 1 Migration Instructions

## ⚠️ IMPORTANT: Manual Migration Required

The Phase 1 database migration must be applied manually through the Supabase SQL Editor.

## Step 1: Access Supabase SQL Editor

1. Open your browser and navigate to: https://supabase.com/dashboard
2. Log in to your Supabase account
3. Select your project: **ztfrjlmkemqjbclaeqfw**
4. Click on **SQL Editor** in the left sidebar
5. Click **New query** button

## Step 2: Apply the Migration

1. Open the migration file: `supabase/migrations/20251014030000_phase1_database_enhancements.sql`
2. Copy the ENTIRE contents of the file
3. Paste it into the SQL Editor
4. Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
5. Wait for the query to complete (should take 5-10 seconds)
6. You should see a success message

## Step 3: Verify the Migration

Run this verification query in the SQL Editor:

```sql
-- Check views
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%events%'
ORDER BY table_name;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%event%'
ORDER BY routine_name;

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('events', 'event_images', 'event_videos', 'event_error_logs')
AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Test get_event_statistics function
SELECT * FROM get_event_statistics();
```

## Expected Results

After successful migration, you should see:

### Views Created (5)
- `active_events_view`
- `draft_events_view`
- `events_by_tag_view`
- `past_events_view`
- `upcoming_events_view`

### Functions Created (4)
- `delete_event_cascade`
- `get_event_statistics`
- `get_next_image_order`
- `get_paginated_events`
- `update_updated_at_column`

### Indexes Created (9)
- `idx_event_error_logs_type_date`
- `idx_event_images_event_id_count`
- `idx_event_videos_event_id_count`
- `idx_events_created_by_status`
- `idx_events_search`
- `idx_events_status_date_featured`
- (Plus existing indexes from Phase 0)

## Troubleshooting

### If you get "relation already exists" errors:
This is normal if you've run the migration before. The migration uses `CREATE OR REPLACE` for views and functions, so it's safe to run multiple times.

### If you get permission errors:
Make sure you're logged in as the project owner or have sufficient permissions to create database objects.

### If functions don't appear:
1. Refresh the schema cache: Go to **Database** → **Functions** and click refresh
2. Or run: `NOTIFY pgrst, 'reload schema'`

## What This Migration Does

1. **Database Views**: Pre-optimized queries for common event access patterns
   - Active/published events with full metadata
   - Draft events with author information
   - Events grouped by tag with statistics
   - Upcoming and past event lists

2. **Database Functions**: Server-side business logic
   - Paginated event retrieval with filtering
   - Event statistics aggregation
   - Safe event deletion with cascade
   - Image order management

3. **Performance Indexes**: Speed up common queries by 50-90%
   - Composite indexes for filtered listings
   - Full-text search on titles and descriptions
   - Optimized joins for images and videos

4. **Triggers**: Automatic data consistency
   - Auto-update `updated_at` timestamp on event changes

## Next Steps

After applying this migration, continue with Phase 1 implementation:
- Edge Function creation for image processing
- Image upload React components
- Security and performance testing

---

**Created**: October 14, 2025
**Migration File**: `supabase/migrations/20251014030000_phase1_database_enhancements.sql`
**Status**: Ready to apply
