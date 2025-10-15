# Supabase Auth Migration - Deployment Checklist

Use this checklist to ensure a smooth migration to Supabase Auth.

---

## 📋 Pre-Migration Checklist

### Environment Setup
- [ ] Supabase project is set up and accessible
- [ ] `.env` file contains `VITE_SUPABASE_URL`
- [ ] `.env` file contains `VITE_SUPABASE_ANON_KEY`
- [ ] `.env` file contains `SUPABASE_SERVICE_ROLE_KEY`
- [ ] All environment variables are valid (not placeholder values)
- [ ] Node.js v16+ is installed
- [ ] npm packages are installed (`npm install`)

### Backup
- [ ] Database backup created (Supabase Dashboard > Database > Backups)
- [ ] Current `.env` file backed up
- [ ] Current authentication code backed up (optional, for rollback)
- [ ] Confirmed all existing users are in the users table

### Documentation Review
- [ ] Read `MIGRATION-QUICK-START.md`
- [ ] Reviewed `SUPABASE-AUTH-MIGRATION-GUIDE.md` (at least skimmed)
- [ ] Understand the new login process (email vs username)
- [ ] Know the temporary password: `TempPassword@123`

---

## 🚀 Migration Execution Checklist

### Step 1: Apply Database Migration

**Choose Method A (Recommended) or Method B:**

#### Method A: Supabase Dashboard
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Click "New Query"
- [ ] Open file: `supabase/migrations/20251015020000_integrate_supabase_auth.sql`
- [ ] Copy entire file contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" button
- [ ] Wait for "Success" message
- [ ] Verify no errors in output

#### Method B: Migration Script
- [ ] Run: `node apply-supabase-auth-migration.mjs`
- [ ] Review output for errors
- [ ] If errors occur, use Method A instead

**Verification:**
- [ ] Run SQL: `SELECT auth_user_id FROM users LIMIT 1;`
- [ ] Column exists (even if value is NULL)
- [ ] No errors returned

---

### Step 2: Migrate Users to Supabase Auth

- [ ] Run: `node migrate-users-to-supabase-auth.mjs`
- [ ] Review output messages
- [ ] Confirm all users migrated successfully
- [ ] Note any errors (should be none for first-time run)
- [ ] Verify success count matches expected user count

**Verification:**
- [ ] Run SQL: `SELECT email, auth_user_id FROM users;`
- [ ] All users have non-NULL `auth_user_id`
- [ ] Go to Supabase Dashboard > Authentication > Users
- [ ] Verify auth users appear in the list
- [ ] Count matches number of database users

---

### Step 3: Test Authentication

#### First Login Test
- [ ] Open application in browser
- [ ] Navigate to login page
- [ ] Enter email: `admin@trikonclinics.com`
- [ ] Enter password: `TempPassword@123`
- [ ] Click "Login"
- [ ] Successfully redirected to dashboard (not back to login)
- [ ] User info displayed in header/sidebar
- [ ] No errors in browser console

#### Session Persistence Test
- [ ] While logged in, refresh the page
- [ ] User remains logged in
- [ ] Data loads correctly
- [ ] No redirect to login page

#### Logout Test
- [ ] Click logout button
- [ ] Redirected to login page
- [ ] Cannot access admin pages without login
- [ ] Must login again to access dashboard

---

### Step 4: Verify Database Operations

#### Read Operations
- [ ] Events list page loads
- [ ] Events display correctly
- [ ] Doctors list page loads
- [ ] Services list page loads
- [ ] Hospital profile page loads
- [ ] All data displays correctly

#### Create Operations
- [ ] Create a test event (use any title/data)
- [ ] Event saves without errors
- [ ] Event appears in events list
- [ ] Upload an event image
- [ ] Image uploads successfully
- [ ] Add a test doctor
- [ ] Doctor saves successfully

#### Update Operations
- [ ] Edit the test event created above
- [ ] Changes save successfully
- [ ] Update hospital profile
- [ ] Changes save successfully
- [ ] Edit a doctor profile
- [ ] Changes save successfully

#### Delete Operations
- [ ] Delete the test event
- [ ] Deletion successful
- [ ] Event removed from list
- [ ] Delete the test doctor
- [ ] Deletion successful
- [ ] Doctor removed from list

---

### Step 5: Verify RLS Policies

Open Supabase Dashboard > SQL Editor and run these queries:

- [ ] Run: `SELECT auth.uid();`
  - Returns a UUID (not NULL)
  - UUID matches auth user ID

- [ ] Run: `SELECT * FROM get_current_user();`
  - Returns your user record
  - Has correct email and role

- [ ] Run: `SELECT get_user_role();`
  - Returns 'Super Admin'

- [ ] Run: `SELECT is_super_admin();`
  - Returns true

- [ ] Run: `SELECT is_admin_or_above();`
  - Returns true

- [ ] Run: `SELECT is_content_manager_or_above();`
  - Returns true

**All queries should return expected values. If any return NULL or false, RLS is not working correctly.**

---

### Step 6: Permission Testing

#### Super Admin Permissions (if logged in as Super Admin)
- [ ] Can view all users
- [ ] Can create new users (if feature exists)
- [ ] Can update users
- [ ] Can delete users (except self)
- [ ] Can access all admin features

#### Content Management
- [ ] Can create events
- [ ] Can edit events
- [ ] Can publish events
- [ ] Can upload images
- [ ] Can add videos
- [ ] Can create tags
- [ ] Can manage health library

---

## ✅ Post-Migration Checklist

### Cleanup
- [ ] Remove old login page backup (if created)
- [ ] Keep migration documentation files
- [ ] Update any internal documentation with new login process
- [ ] Inform other admins about new login credentials

### Security
- [ ] Change temporary password in user profile
- [ ] Verify new password works for login
- [ ] Ensure `.env` file is not committed to git
- [ ] Verify `.env` is in `.gitignore`
- [ ] Service role key is kept secure (never exposed to clients)

### Monitoring
- [ ] Check activity_logs table for all actions
- [ ] Verify logs are being created correctly
- [ ] Monitor Supabase Dashboard > Logs for any errors
- [ ] Check for any failed login attempts

### User Communication
- [ ] Inform all admin users about migration
- [ ] Provide new login credentials:
  - Email instead of username
  - Temporary password: `TempPassword@123`
- [ ] Instruct users to change password after first login
- [ ] Provide support contact for migration issues

---

## 🐛 Troubleshooting Checklist

If something doesn't work:

### Login Issues
- [ ] Verified using email (not username)
- [ ] Verified using temporary password: `TempPassword@123`
- [ ] Checked browser console for errors
- [ ] Cleared browser cache and localStorage
- [ ] Tried in incognito/private browsing mode

### Database Issues
- [ ] Verified migration was applied (check auth_user_id column exists)
- [ ] Verified users were migrated (check auth_user_id is not NULL)
- [ ] Checked Supabase Dashboard > Logs for errors
- [ ] Ran verification SQL queries
- [ ] Confirmed `auth.uid()` returns valid UUID (not NULL)

### RLS Issues
- [ ] Confirmed logged in through Supabase Auth (not old system)
- [ ] Verified `auth.uid()` returns valid UUID
- [ ] Checked that helper functions exist
- [ ] Reviewed RLS policies in Supabase Dashboard
- [ ] Ensured user has matching record in users table

### Session Issues
- [ ] Checked Supabase client configuration
- [ ] Verified session storage is enabled
- [ ] Checked browser localStorage for auth token
- [ ] Tried logging out and logging in again
- [ ] Verified no conflicting localStorage keys from old system

---

## 📞 Need Help?

If you encounter issues not covered by troubleshooting:

1. **Check Documentation**
   - `MIGRATION-QUICK-START.md` - Quick reference
   - `SUPABASE-AUTH-MIGRATION-GUIDE.md` - Detailed guide
   - `IMPLEMENTATION-SUMMARY.md` - Technical overview

2. **Check Logs**
   - Browser console (F12 > Console)
   - Supabase Dashboard > Logs
   - Activity logs table in database

3. **Verify Setup**
   - Environment variables are correct
   - Database migration was applied
   - User migration completed successfully
   - Supabase Auth users exist

4. **Review Code**
   - `src/contexts/AuthContext.tsx` - Auth logic
   - `src/pages/Login.tsx` - Login form
   - `src/lib/supabase.ts` - Client configuration

---

## 🔄 Rollback Procedure (If Needed)

If critical issues occur and you need to rollback:

### Quick Rollback (Application Only)
1. [ ] Restore old `src/contexts/AuthContext.tsx`
2. [ ] Restore old `src/pages/Login.tsx`
3. [ ] Restore old `src/lib/supabase.ts`
4. [ ] Restart application
5. [ ] Login with old credentials (username/password)

**Note**: Database changes are safe to keep. They don't interfere with the old system.

### Full Rollback (Database Too)
1. [ ] Use Supabase Dashboard > Database > Backups
2. [ ] Restore backup from before migration
3. [ ] Follow "Quick Rollback" steps above
4. [ ] Test login with old credentials

**Warning**: Full rollback will lose any data created after migration.

---

## 🎉 Success Criteria

Migration is successful when:

- ✅ Can login with email and temporary password
- ✅ Dashboard loads after login
- ✅ All CRUD operations work (create, read, update, delete)
- ✅ Session persists across page refreshes
- ✅ Logout works correctly
- ✅ `auth.uid()` returns valid UUID (not NULL)
- ✅ All RLS policies allow authorized operations
- ✅ All RLS policies block unauthorized operations
- ✅ Activity logs are created correctly
- ✅ No errors in browser console
- ✅ No errors in Supabase logs

If all checkboxes above are checked: **Migration Complete!** 🎊

---

## 📊 Final Status

After completing all checklists, update this section:

**Migration Date**: _____________

**Performed By**: _____________

**Time Taken**: _____________

**Issues Encountered**: _____________

**Status**: ⬜ Complete ⬜ Partial ⬜ Rolled Back

**Notes**: _____________________________________________

_______________________________________________________

_______________________________________________________

---

## 🚀 Ready to Go Live?

Final checklist before announcing the migration:

- [ ] All tests pass
- [ ] No errors in production
- [ ] Backup is available
- [ ] Rollback plan is ready
- [ ] Admin users informed
- [ ] New login credentials communicated
- [ ] Support prepared for questions
- [ ] Documentation updated
- [ ] Monitoring in place

**If all checked: Ready to announce migration!** 🎉

---

**Remember**: The temporary password `TempPassword@123` should be changed after first login!

**Login Credentials:**
- Email: `admin@trikonclinics.com`
- Password: `TempPassword@123`

Good luck with your migration! 🚀
