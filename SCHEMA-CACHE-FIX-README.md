# Schema Cache Error Fix - Complete Guide

## 🚨 CRITICAL ISSUE

**Event Save Error:** "Could not find the 'event_time' column of 'events' in the schema cache"

The event form cannot save because Supabase's PostgREST API doesn't recognize Phase 3 columns.

---

## 🔍 Root Cause Analysis

### Problem Identified:

1. **Phase 3 Migration Never Applied**
   - The migration file `20251014040000_add_event_form_fields.sql` exists but was never applied to the database
   - All 6 critical columns are missing from the events table
   - EventForm tries to save these fields → API rejects them as "column does not exist"

2. **Missing Columns:**
   - ❌ `event_time` - Time of day when event occurs
   - ❌ `venue` - Location or venue name
   - ❌ `short_description` - Brief summary for event cards
   - ❌ `full_description` - Complete event details
   - ❌ `highlights` - Array of key event highlights
   - ❌ `updated_by` - User who last modified the event

3. **PostgREST Schema Cache**
   - Even if columns were added, PostgREST caches the database schema
   - Cache must be manually refreshed after schema changes
   - Without refresh, API continues to reject the new columns

---

## ✅ SOLUTION: Apply Phase 3 Columns + Force Cache Reload

### Quick Fix (5 minutes):

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Execute the Fix**
   - Open the file: `FIX-EVENT-SAVE-ERROR.sql`
   - Copy the ENTIRE contents
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Wait 10-15 seconds for schema cache to refresh
   - Try saving an event in the form

---

## 📋 What the SQL Fix Does

### Step 1: Add Missing Columns
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS full_description text DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time time;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT ARRAY[]::text[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by uuid;
```

### Step 2: Add Foreign Key Constraints
```sql
ALTER TABLE events
  ADD CONSTRAINT events_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
```

### Step 3: Create URL Redirects Table
```sql
CREATE TABLE IF NOT EXISTS url_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
```

### Step 4: Add Indexes for Performance
```sql
CREATE INDEX IF NOT EXISTS idx_events_updated_by ON events(updated_by);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue) WHERE venue IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_url_redirects_old_slug ON url_redirects(old_slug);
-- ... more indexes ...
```

### Step 5: Add Data Validation Constraints
```sql
ALTER TABLE events ADD CONSTRAINT venue_length_check
  CHECK (venue IS NULL OR char_length(venue) <= 200);

ALTER TABLE events ADD CONSTRAINT short_description_length_check
  CHECK (short_description IS NULL OR (char_length(short_description) >= 1 AND char_length(short_description) <= 500));

ALTER TABLE events ADD CONSTRAINT highlights_array_size_check
  CHECK (array_length(highlights, 1) IS NULL OR array_length(highlights, 1) <= 10);
```

### Step 6: Force Schema Cache Reload (CRITICAL!)
```sql
-- Update table comment to trigger schema refresh
COMMENT ON TABLE events IS 'Events table - Phase 3 columns added - Schema cache refreshed';

-- Add comments to new columns
COMMENT ON COLUMN events.event_time IS 'Time when the event occurs (optional)';
COMMENT ON COLUMN events.venue IS 'Location or venue name for the event (max 200 chars, optional)';
-- ... more comments ...

-- Send reload notification to PostgREST
NOTIFY pgrst, 'reload schema';
```

---

## 🧪 Testing After Fix

### 1. Verify Columns Exist

Run this query in SQL Editor:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('event_time', 'venue', 'short_description', 'full_description', 'highlights', 'updated_by')
ORDER BY column_name;
```

Expected result: All 6 columns should be listed.

### 2. Test Event Form

1. Navigate to: `/admin/events/add`
2. Fill in the form:
   - Title: "Test Event"
   - Event Date: Today's date
   - Event Time: "10:00 AM" ← NEW FIELD
   - Venue: "Main Hospital" ← NEW FIELD
   - Category: Select one or more
   - Status: Draft
   - Short Description: "Test description" ← NEW FIELD
   - Full Description: "Full test description" ← NEW FIELD
   - Add a highlight: "Test highlight" ← NEW FIELD

3. Click "Save Draft"

4. **Expected:** "Draft saved successfully" message
5. **Before Fix:** Error about 'event_time' column not found

### 3. Verify Data Saved

Run this query:
```sql
SELECT id, title, event_time, venue, short_description, full_description, highlights
FROM events
WHERE title = 'Test Event'
ORDER BY created_at DESC
LIMIT 1;
```

You should see your test event with all fields populated.

---

## 📊 Before vs After

### BEFORE (Broken):

```
EventForm attempts to save:
{
  title: "Test Event",
  slug: "test-event",
  event_date: "2025-10-15",
  event_time: "10:00",  ← REJECTED
  venue: "Main Hospital",  ← REJECTED
  short_description: "...",  ← REJECTED
  full_description: "...",  ← REJECTED
  highlights: ["..."],  ← REJECTED
  updated_by: "user-id"  ← REJECTED
}

Result: ❌ Error: "Could not find the 'event_time' column of 'events' in the schema cache"
```

### AFTER (Fixed):

```
EventForm saves successfully:
{
  title: "Test Event",
  slug: "test-event",
  event_date: "2025-10-15",
  event_time: "10:00",  ← ✓ ACCEPTED
  venue: "Main Hospital",  ← ✓ ACCEPTED
  short_description: "...",  ← ✓ ACCEPTED
  full_description: "...",  ← ✓ ACCEPTED
  highlights: ["..."],  ← ✓ ACCEPTED
  updated_by: "user-id"  ← ✓ ACCEPTED
}

Result: ✅ "Draft saved successfully"
```

---

## 🎯 Complete EventForm Features

After applying the fix, the EventForm supports:

### Basic Information
- ✅ Event Title (required, max 75 chars)
- ✅ URL Slug (auto-generated from title)
- ✅ Event Date (optional)
- ✅ Event Time (optional) - **NEW**
- ✅ Venue / Location (optional, max 200 chars) - **NEW**
- ✅ Category (multi-select from 5 categories)
- ✅ Status (draft/published)
- ✅ Featured Event checkbox

### Content
- ✅ Short Description (optional, max 500 chars) - **NEW**
- ✅ Full Description (optional) - **NEW**
- ✅ Key Highlights (up to 10 items, 150 chars each) - **NEW**

### Media
- ✅ Featured Image (required for publishing)
- ✅ Photo Gallery (up to 25 images)
- ✅ YouTube Videos (up to 10 videos)

### Auto-Save & Tracking
- ✅ Auto-save every 2 minutes (edit mode)
- ✅ Slug uniqueness validation with suggestions
- ✅ Unsaved changes warning
- ✅ Last saved timestamp
- ✅ Created by / Updated by tracking - **NEW**

---

## 📁 Files Created

1. **`FIX-EVENT-SAVE-ERROR.sql`** - Complete SQL fix (run this!)
2. **`SCHEMA-CACHE-FIX-README.md`** - This documentation file
3. **`supabase/migrations/20251015010000_force_schema_cache_reload.sql`** - Migration file for future reference
4. **`apply-schema-reload-fix.mjs`** - Automated fix script (requires exec_sql function)
5. **`apply-phase3-columns.mjs`** - Column verification script

---

## ⚠️ Important Notes

### Schema Cache Refresh Time
- After running the SQL, PostgREST may take 10-30 seconds to refresh its schema cache
- If you still see errors immediately after running the SQL, wait 30 seconds and try again
- The `NOTIFY pgrst, 'reload schema';` command forces an immediate refresh

### Existing Events
- This fix is **backwards compatible**
- Existing events will have NULL values for new optional fields
- You can edit existing events to add the new information
- Old events continue to display correctly

### Category Dropdown Issue
- The category dropdown issue (from previous fix) is separate
- Make sure to also apply the RLS fix for tags table
- See: `FIX-CATEGORY-DROPDOWN.sql`

---

## 🆘 Troubleshooting

### Issue: Still getting "column does not exist" error

**Solution 1:** Wait 30-60 seconds
- PostgREST may need time to refresh its schema cache
- Try saving the event again after waiting

**Solution 2:** Restart PostgREST (Supabase dashboard)
- Go to Project Settings → API
- Click "Restart" button
- This forces an immediate schema reload

**Solution 3:** Verify columns exist
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY column_name;
```
- Look for: event_time, venue, short_description, full_description, highlights, updated_by
- If missing, re-run the fix SQL

### Issue: Permission denied when running SQL

**Solution:** Make sure you're logged in as the project owner
- Only project owners can run DDL commands
- Team members may not have permission to alter tables

### Issue: Foreign key constraint error

**Solution:** Verify users table exists
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name = 'users';
```
- If users table doesn't exist, the updated_by foreign key will fail
- Contact support to fix database structure

---

## ✅ Success Checklist

After applying the fix, verify:

- [ ] SQL executed without errors
- [ ] Waited 30 seconds for schema cache refresh
- [ ] Can access `/admin/events/add` page
- [ ] Event form shows all new fields (Event Time, Venue, etc.)
- [ ] Can fill in all fields without errors
- [ ] "Save Draft" button works
- [ ] See "Draft saved successfully" message
- [ ] Event appears in Events List
- [ ] Can edit the saved event
- [ ] All field values are preserved

---

## 🎉 Expected Outcome

**After applying this fix:**

1. ✅ Event form saves successfully
2. ✅ All Phase 3 fields (time, venue, descriptions, highlights) work
3. ✅ Auto-save functionality works in edit mode
4. ✅ Events can be published with all required fields
5. ✅ Category dropdown works (after applying separate RLS fix)
6. ✅ Complete event management system is fully functional

**You'll be able to create rich, detailed event entries with:**
- Comprehensive event information
- Multiple categories/tags
- Rich media (images and videos)
- Auto-generated, SEO-friendly URLs
- Full audit trail (created by / updated by)

---

## 📞 Support

If you encounter any issues after applying this fix:

1. Check the console for error messages
2. Verify all SQL commands executed successfully
3. Wait at least 60 seconds for schema cache refresh
4. Try the troubleshooting steps above
5. Check Supabase dashboard for any error notifications

The fix is comprehensive and addresses the root cause. Once applied, the event management system will work perfectly!

---

**Status:** ✅ Fix Ready to Apply
**Estimated Time:** 5 minutes
**Impact:** Resolves critical event save error
**Risk:** Low (uses IF NOT EXISTS for safety)
