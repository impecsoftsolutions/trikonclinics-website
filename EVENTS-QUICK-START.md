# Events & News - Quick Start Guide

## 3-Step Setup Process

### Step 1: Apply Database Migrations (5 minutes)

Open Supabase Dashboard → SQL Editor and run these migrations in order:

#### Migration 1: Create Events Tables
```bash
# Copy and paste contents of:
supabase/migrations/20251014000000_create_events_system.sql
```
Creates: tags, events, event_images, event_videos, event_tags, event_error_logs tables

#### Migration 2: Add Feature Flags
```bash
# Copy and paste contents of:
supabase/migrations/20251014010000_add_events_feature_flags.sql
```
Adds: events_enabled and events_public_access flags to site_settings

#### Migration 3: Setup Storage
```bash
# Copy and paste contents of:
supabase/migrations/20251014020000_setup_events_storage.sql
```
Creates: events storage bucket with RLS policies

### Step 2: Load Test Data (1 minute)

Run from your terminal:

```bash
npm run events:seed
```

This creates:
- 5 predefined tags
- 3 test events (2 published, 1 draft)
- Sample images and videos (database records only)

### Step 3: Verify Everything Works (2 minutes)

```bash
npm run events:verify
```

Should show 100% success rate after migrations are applied.

Optional performance test:
```bash
npm run events:test
```

## Enable Events Section

By default, Events is disabled. To enable:

```sql
-- In Supabase SQL Editor:
UPDATE site_settings
SET events_enabled = true,
    events_public_access = false;
```

`events_enabled = true` - Turns on Events section for admins
`events_public_access = false` - Keeps events admin-only for now

## What You Get

### Database Tables
✅ **tags** - Reusable event categories
✅ **events** - Main events table with draft/published status
✅ **event_images** - 3 size variants per image (small, medium, large)
✅ **event_videos** - YouTube video embeds
✅ **event_tags** - Many-to-many relationship
✅ **event_error_logs** - Error tracking and monitoring

### TypeScript Types
✅ Complete type definitions in `src/lib/supabase.ts`
✅ All tables have Row, Insert, and Update types

### Constants & Utilities
✅ `src/constants/events.ts` - All configuration constants
✅ `src/utils/eventErrorLogger.ts` - Error logging functions

### Security
✅ Row Level Security on all tables
✅ Draft events require authentication
✅ Published events can be public (when enabled)
✅ Storage bucket with role-based access

### Performance
✅ Strategic indexes for sub-100ms queries
✅ Optimized for listings, filtering, and detail views
✅ Pagination-ready (20 items per page)

## Test Data Overview

### Tags Created
1. Health Camps
2. Awareness Programs
3. Seminars & Workshops
4. Announcements
5. Community Outreach

### Events Created

**Event 1: Simple Published Event**
- 1 image (3 sizes)
- 1 YouTube video
- Status: published
- Tags: Health Camps, Community Outreach

**Event 2: Heavy Published Event**
- 25 images (75 total files with 3 sizes each)
- 3 YouTube videos
- Status: published
- Featured: Yes
- Tags: Awareness Programs, Seminars & Workshops, Health Camps

**Event 3: Draft Event**
- 5 images
- 1 video
- Status: draft
- Featured: Yes
- Special characters in title for edge case testing
- Tags: Announcements

## File Structure

```
supabase/migrations/
├── 20251014000000_create_events_system.sql         ← Main tables
├── 20251014010000_add_events_feature_flags.sql     ← Feature flags
├── 20251014020000_setup_events_storage.sql         ← Storage bucket
└── 20251014000000_create_events_system_ROLLBACK.sql ← Undo script

src/
├── constants/
│   └── events.ts                    ← All constants and configs
├── lib/
│   └── supabase.ts                  ← TypeScript types (updated)
└── utils/
    └── eventErrorLogger.ts          ← Error logging functions

Root scripts:
├── seed-events-data.js              ← Load test data
├── test-events-performance.js       ← Performance benchmarks
├── verify-events-setup.js           ← Verification checks
├── EVENTS-PHASE-0-SETUP.md         ← Complete documentation
└── EVENTS-QUICK-START.md           ← This file
```

## Common Commands

```bash
# Load seed data
npm run events:seed

# Test performance
npm run events:test

# Verify setup
npm run events:verify

# Build project
npm run build

# Run dev server
npm run dev
```

## Storage Configuration

### Bucket Structure
```
events/
  └── {event-uuid}/
      └── images/
          ├── small/      (200px width)
          ├── medium/     (600px width)
          └── large/      (1200px width)
```

### Storage Limits
- Max file size: 10MB
- Allowed types: JPEG, PNG, WebP, GIF
- Max images per event: 50
- Max videos per event: 10

## Next Steps After Setup

1. **Phase 1**: Build Admin UI
   - Create event management pages
   - Add image upload functionality
   - Implement YouTube video embedding

2. **Phase 2**: Public Pages
   - Events listing page
   - Event detail page
   - Tag filtering

3. **Phase 3**: Search & Features
   - Search functionality
   - Date-based filtering
   - Featured events showcase

## Troubleshooting

### "Table not found" errors
→ Run the migrations in Supabase Dashboard SQL Editor

### Seed script fails with "No admin user"
→ Create an admin user first through user management

### Storage bucket not found
→ Run migration 3 (setup_events_storage.sql)

### Performance tests slow
→ Normal on first run. Database needs to warm up indexes.

### Feature flags not working
→ Run migration 2 (add_events_feature_flags.sql)

## Rollback

If you need to undo everything:

```sql
-- Run this in Supabase SQL Editor:
-- Copy contents of:
supabase/migrations/20251014000000_create_events_system_ROLLBACK.sql
```

This removes all events tables, policies, and indexes safely.

## Support

For detailed information, see:
- **EVENTS-PHASE-0-SETUP.md** - Complete setup guide
- Migration file comments - Detailed schema documentation
- src/constants/events.ts - All configuration options
- src/utils/eventErrorLogger.ts - Error logging examples

## Summary

Phase 0 Complete Checklist:
- [x] Database schema created
- [x] Storage bucket configured
- [x] TypeScript types added
- [x] Constants and utilities created
- [x] Test data prepared
- [x] Verification scripts ready
- [x] Documentation complete
- [x] Project builds successfully

Ready for Phase 1: Admin UI Development
