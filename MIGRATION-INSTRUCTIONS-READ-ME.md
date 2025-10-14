# Events System Migration - Instructions

## Current Status

✅ **Migrations have been prepared and are ready to apply**
⚠️ **Manual step required: SQL execution in Supabase Dashboard**

## Why Manual Execution is Needed

The Supabase JavaScript client (using the Service Role Key) cannot execute DDL (Data Definition Language) statements like `CREATE TABLE`, `CREATE POLICY`, etc. This is a security feature of Supabase. To apply migrations, we need to use either:

1. **Supabase Dashboard SQL Editor** (RECOMMENDED - easiest)
2. Supabase CLI with database password
3. Direct PostgreSQL connection with database password

## Quick Start (5 minutes)

### Step 1: Open Supabase Dashboard

Visit: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql/new

### Step 2: Copy and Execute SQL

Open the file: `APPLY-EVENTS-MIGRATIONS.sql`

Copy the ENTIRE contents and paste into the SQL Editor, then click **RUN**.

### Step 3: Seed Test Data

After the SQL executes successfully, run:

```bash
npm run events:seed
```

### Step 4: Verify Setup

```bash
npm run events:verify
```

### Step 5: Run Performance Tests

```bash
npm run events:test
```

## What Gets Created

### Database Tables
- **tags** - Reusable event tags/categories
- **events** - Main events and news articles
- **event_images** - Image gallery for events (3 size variants)
- **event_videos** - YouTube video embeds
- **event_tags** - Many-to-many relationship (events ↔ tags)
- **event_error_logs** - Error tracking and debugging

### Feature Flags (in site_settings)
- **events_enabled** - Master switch for events section
- **events_public_access** - Control public vs admin-only access

### Storage
- **events bucket** - Dedicated storage for event images
- Configured with proper RLS policies
- File size limit: 10MB per image
- Allowed: JPEG, PNG, WebP, GIF

### Security (RLS Policies)
- ✅ All tables have Row Level Security enabled
- ✅ Content Managers can create/edit events
- ✅ Admins can delete events
- ✅ Authenticated users see all events (including drafts)
- ✅ Public users see only published events (when enabled)

### Performance Indexes
- ✅ Optimized for event listing queries
- ✅ Fast slug-based lookups
- ✅ Efficient tag filtering
- ✅ Ordered image/video galleries

## Test Data

The seed script creates:
- 5 predefined tags (Health Camps, Awareness Programs, etc.)
- 3 sample events:
  - 2 published events (visible when public access enabled)
  - 1 draft event (admins only)
- Placeholder images and videos for each event
- Tag associations

## Troubleshooting

### "Permission denied" errors
- Make sure you're logged into the correct Supabase project
- Verify you have admin access to the project

### "Already exists" errors
- These are OK! The migrations are idempotent
- Tables/policies that already exist will not be recreated

### Script execution fails
- Make sure you copied the ENTIRE SQL file
- Check for any syntax errors in the SQL Editor
- Try executing one migration at a time if needed

## Alternative: Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref ztfrjlmkemqjbclaeqfw

# Push migrations
npx supabase db push
```

## After Migrations are Applied

1. ✅ Run seed script: `npm run events:seed`
2. ✅ Run verification: `npm run events:verify`
3. ✅ Run performance tests: `npm run events:test`
4. 🎉 Events system is ready for Phase 1 (Admin UI development)

## Files Reference

- `APPLY-EVENTS-MIGRATIONS.sql` - Complete SQL to execute
- `supabase/migrations/20251014000000_create_events_system.sql` - Tables & RLS
- `supabase/migrations/20251014010000_add_events_feature_flags.sql` - Feature flags
- `supabase/migrations/20251014020000_setup_events_storage.sql` - Storage bucket
- `seed-events-data.js` - Test data population
- `verify-events-setup.js` - Verification checks
- `test-events-performance.js` - Performance benchmarks

## Need Help?

- Check Supabase Dashboard for any error messages
- Review the migration comments for detailed explanations
- Ensure users table exists (required for foreign keys)
- Verify storage is enabled for your project
