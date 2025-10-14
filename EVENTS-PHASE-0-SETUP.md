# Events & News System - Phase 0 Setup Guide

## Overview

This document provides complete instructions for setting up the Events & News system foundation, including database migrations, seed data, testing, and rollback procedures.

## What Was Created

### Database Migrations

1. **20251014000000_create_events_system.sql**
   - Creates all events tables: tags, events, event_images, event_videos, event_tags, event_error_logs
   - Sets up Row Level Security policies for all tables
   - Creates performance indexes for fast queries
   - Comprehensive security model with role-based access control

2. **20251014010000_add_events_feature_flags.sql**
   - Adds feature flags to site_settings table
   - `events_enabled`: Master switch for Events section
   - `events_public_access`: Controls public visibility of published events

3. **20251014020000_setup_events_storage.sql**
   - Creates 'events' storage bucket with 10MB file size limit
   - Sets up RLS policies for draft vs published event images
   - Defines folder structure: events/{event-id}/images/{size}/

### Rollback Script

- **20251014000000_create_events_system_ROLLBACK.sql**
  - Complete rollback script to remove all events tables
  - Safe to run if you need to undo the migration
  - Removes all policies, indexes, and tables in correct order

### Application Code

1. **src/lib/supabase.ts** (updated)
   - Added TypeScript types for all events tables
   - Complete Row, Insert, and Update interfaces

2. **src/constants/events.ts**
   - EVENTS_PAGE_SIZE: 20 items per page
   - EVENT_STATUS: draft and published constants
   - IMAGE_SIZES: small (200px), medium (600px), large (1200px)
   - Validation functions and helper utilities
   - YouTube URL regex and extraction functions

3. **src/utils/eventErrorLogger.ts**
   - Complete error logging system
   - Functions for logging upload, processing, validation errors
   - Query functions to retrieve and analyze errors
   - Error summary and statistics

### Seed Data and Testing

1. **seed-events-data.js**
   - Seeds 5 predefined tags
   - Creates 3 test events:
     - Simple published event (1 image, 1 video)
     - Heavy published event (25 images, 3 videos)
     - Draft event with edge cases (featured, special characters)
   - Idempotent: safe to run multiple times

2. **test-events-performance.js**
   - Performance benchmark suite
   - Tests all critical queries
   - Validates sub-100ms performance target
   - Provides detailed performance reports

## Setup Instructions

### Step 1: Apply Database Migrations

Run these migrations in order using your preferred method:

```bash
# Using Supabase CLI (if installed)
supabase migration up

# Or apply manually through Supabase Dashboard
# SQL Editor → Copy contents of each migration file → Run
```

Migration order:
1. 20251014000000_create_events_system.sql
2. 20251014010000_add_events_feature_flags.sql
3. 20251014020000_setup_events_storage.sql

### Step 2: Verify Migrations

Check that all tables were created:

```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'tags',
  'events',
  'event_images',
  'event_videos',
  'event_tags',
  'event_error_logs'
);
```

Should return 6 rows.

### Step 3: Load Seed Data

```bash
node seed-events-data.js
```

Expected output:
- 5 tags created
- 3 test events created
- Image and video records created
- Tags linked to events

### Step 4: Run Performance Tests

```bash
node test-events-performance.js
```

All queries should complete under 100ms with the test data.

### Step 5: Verify Storage Bucket

1. Open Supabase Dashboard → Storage
2. Confirm 'events' bucket exists
3. Check settings:
   - Public: false
   - File size limit: 10MB
   - Allowed types: image/jpeg, image/png, image/webp, image/gif

## Feature Flag Configuration

The Events section is disabled by default. To enable:

```sql
-- Enable Events section for admin testing
UPDATE site_settings
SET events_enabled = true,
    events_public_access = false;

-- Enable public access (after testing)
UPDATE site_settings
SET events_enabled = true,
    events_public_access = true;
```

## Testing Checklist

### Database Tests

- [ ] All 6 events tables exist
- [ ] All indexes created successfully
- [ ] RLS policies are enabled on all tables
- [ ] site_settings has events feature flags
- [ ] events storage bucket exists

### Seed Data Tests

- [ ] 5 tags created successfully
- [ ] 3 events created with correct status
- [ ] Event 1 has 1 image and 1 video record
- [ ] Event 2 has 25 images and 3 videos records
- [ ] Event 3 is in draft status
- [ ] Tags are properly linked to events

### Performance Tests

- [ ] Published events listing: < 100ms
- [ ] Single event by slug: < 100ms
- [ ] Event with images ordered: < 100ms
- [ ] Event with videos ordered: < 100ms
- [ ] Events filtered by tag: < 100ms
- [ ] Featured events query: < 100ms
- [ ] Complex query with relations: < 100ms

### Security Tests

#### Test as Authenticated Admin

```javascript
// Should succeed
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'draft');
```

#### Test as Public User (no auth)

```javascript
// Should return empty (RLS blocks access)
const { data } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'draft');
```

### Storage Tests

- [ ] Admin can upload to events bucket
- [ ] Draft event images require authentication
- [ ] Published event images are publicly accessible (after enabling public access)
- [ ] File size limit enforced (10MB)
- [ ] Only allowed image types accepted

## Rollback Procedure

If you need to undo everything:

### Option 1: Using Rollback Script

```bash
# Run the rollback SQL script through Supabase Dashboard
# SQL Editor → Copy contents of:
# supabase/migrations/20251014000000_create_events_system_ROLLBACK.sql
# → Run
```

### Option 2: Manual Rollback

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS event_tags CASCADE;
DROP TABLE IF EXISTS event_videos CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS event_error_logs CASCADE;

-- Remove storage bucket
DELETE FROM storage.buckets WHERE id = 'events';

-- Remove feature flags (optional)
ALTER TABLE site_settings
DROP COLUMN IF EXISTS events_enabled,
DROP COLUMN IF EXISTS events_public_access;
```

## Storage Path Structure

All event images follow this structure:

```
events/
  ├── {event-uuid-1}/
  │   └── images/
  │       ├── small/
  │       │   ├── image-1.jpg
  │       │   └── image-2.jpg
  │       ├── medium/
  │       │   ├── image-1.jpg
  │       │   └── image-2.jpg
  │       └── large/
  │           ├── image-1.jpg
  │           └── image-2.jpg
  └── {event-uuid-2}/
      └── images/
          └── ...
```

## Performance Expectations

With the created indexes, these queries should perform well even with 1000+ events:

- **Published events listing**: 20-50ms
- **Single event by slug**: 5-15ms
- **Event with images**: 10-30ms
- **Events by tag**: 30-60ms
- **Complex joins**: 50-100ms

## Security Model

### Draft Events (status = 'draft')
- Only authenticated admin users can view
- Images require authentication to access
- Not visible to public under any circumstances

### Published Events (status = 'published')
- Authenticated admins: Always accessible
- Public users: Only when `events_public_access = true`
- Images follow same rules as parent event

### Write Operations
- Content Manager and above: Can create and edit events
- Admin and above: Can delete events
- All roles: Can log errors

## Error Logging

All events operations should use the error logger:

```typescript
import { logUploadError, logDatabaseError } from '@/utils/eventErrorLogger';

try {
  // Upload operation
} catch (error) {
  await logUploadError(fileName, error, eventId);
  throw error;
}
```

View errors through:
```typescript
import { getRecentErrors, getErrorSummary } from '@/utils/eventErrorLogger';

const errors = await getRecentErrors(50);
const summary = await getErrorSummary();
```

## Next Steps

After completing Phase 0:

1. **Phase 1**: Build admin UI for managing events
2. **Phase 2**: Implement image upload and processing
3. **Phase 3**: Create public events listing and detail pages
4. **Phase 4**: Add search and filtering functionality
5. **Phase 5**: Optimize and add caching

## Troubleshooting

### Migration Fails

**Error**: "relation already exists"
- Solution: The migration uses IF NOT EXISTS, so this should not happen
- If it does, check if partial migration was applied
- Use rollback script and try again

### Performance Tests Fail

**Queries taking > 100ms**
- Check if indexes were created: Run `\di` in psql
- Run VACUUM ANALYZE on the database
- Ensure seed data loaded correctly
- Try again after a few minutes (DB needs to warm up)

### Seed Script Fails

**Error**: "No admin user found"
- Solution: Create an admin user first using existing user management
- Or run seed script without user association (events will have null created_by)

### Storage Access Issues

**Can't upload images**
- Verify storage bucket exists
- Check RLS policies are applied
- Ensure user is authenticated
- Verify user has Content Manager role or higher

## Support

For issues or questions:
1. Check the migration file comments for detailed explanations
2. Review the error logs using error logger utilities
3. Run performance tests to identify bottlenecks
4. Verify RLS policies match your security requirements

## Summary

Phase 0 creates a solid foundation for the Events & News system with:

- Complete database schema with 6 tables
- Comprehensive security through RLS
- Performance optimization through indexes
- Feature flags for safe deployment
- Error logging infrastructure
- Seed data for testing
- Performance benchmarks
- Complete rollback capability

Everything is ready for Phase 1 development.
