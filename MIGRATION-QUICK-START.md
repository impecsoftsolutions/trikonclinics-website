# Supabase Auth Migration - Quick Start Guide

## ⚡ Quick Start (5 Minutes)

This guide will help you migrate from custom authentication to Supabase Auth in just a few steps.

---

## 📋 Prerequisites

Before starting, ensure you have:

1. ✅ Supabase project set up
2. ✅ `.env` file with these variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. ✅ Node.js installed (v16 or higher)
4. ✅ npm packages installed (`npm install`)

**Don't have SUPABASE_SERVICE_ROLE_KEY?**
1. Go to your Supabase Dashboard
2. Click on Settings (gear icon) > API
3. Copy the `service_role` key (under "Project API keys")
4. Add it to your `.env` file

---

## 🚀 Migration Steps

### Step 1: Apply Database Migration

This adds the necessary columns and updates all RLS policies.

**Choose ONE method:**

#### Method A: Using Supabase Dashboard (Recommended)

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `supabase/migrations/20251015020000_integrate_supabase_auth.sql`
6. Copy ALL the contents
7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. Wait for "Success" message

✅ **Expected result**: "Success. No rows returned"

#### Method B: Using Script (Alternative)

```bash
node apply-supabase-auth-migration.mjs
```

⚠️ **Note**: This script may not work for all setups due to JS client limitations with DDL statements. If it fails, use Method A above.

---

### Step 2: Migrate Users to Supabase Auth

This creates Supabase Auth accounts for all existing users.

```bash
node migrate-users-to-supabase-auth.mjs
```

**What this does:**
- Finds all users in the `users` table
- Creates Supabase Auth account for each user
- Links auth account to database user
- Sets temporary password: `TempPassword@123`

✅ **Expected output:**
```
🚀 Starting user migration to Supabase Auth...

📋 Step 1: Fetching existing users...
   Found 1 user(s) to migrate:
   - admin@trikonclinics.com (superadmin) - Role: Super Admin

🔐 Step 2: Creating Supabase Auth accounts...
   Creating auth account for: admin@trikonclinics.com...
   ✓ Auth user created: abc-123-def-456
   Linking auth user to database user...
   ✓ Successfully migrated: admin@trikonclinics.com

📊 Migration Summary:
   Total users processed: 1
   Successfully migrated: 1
   Failed migrations: 0

✅ All users successfully migrated to Supabase Auth!
```

---

### Step 3: Test Login

1. Open your application in the browser
2. Go to the login page
3. Use these credentials:
   - **Email**: `admin@trikonclinics.com`
   - **Password**: `TempPassword@123`
4. Click **Login**
5. You should be redirected to the dashboard

✅ **Success indicators:**
- No errors in browser console
- Redirected to `/admin/dashboard`
- User data displayed in header/sidebar
- Can access all admin features

---

### Step 4: Verify Everything Works

Test these operations to ensure RLS policies are working:

#### Test 1: View Data
- [ ] Events list loads
- [ ] Doctors list loads
- [ ] Services list loads
- [ ] Hospital profile loads

#### Test 2: Create Data
- [ ] Create a new event
- [ ] Upload an event image
- [ ] Add a new doctor
- [ ] Add a new service

#### Test 3: Update Data
- [ ] Edit an event
- [ ] Update hospital profile
- [ ] Update a doctor profile

#### Test 4: Delete Data
- [ ] Delete a test event
- [ ] Delete a test image

If all tests pass, the migration is successful! 🎉

---

## 🔍 Verification Commands

Run these in Supabase Dashboard > SQL Editor to verify:

### Check auth.uid() is working
```sql
-- Should return your auth user ID (not NULL)
SELECT auth.uid();
```

### Check your user record
```sql
-- Should return your user data
SELECT * FROM get_current_user();
```

### Check your role
```sql
-- Should return 'Super Admin'
SELECT get_user_role();
```

### Check permissions
```sql
-- All should return true for superadmin
SELECT is_super_admin();
SELECT is_admin_or_above();
SELECT is_content_manager_or_above();
```

---

## ❌ Troubleshooting

### Problem: "Missing environment variables"

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get it from: Supabase Dashboard > Settings > API > Service Role Key

---

### Problem: Migration script fails

**Solution**: Use Manual Method (Method A in Step 1):
1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/20251015020000_integrate_supabase_auth.sql`
3. Paste and run in SQL Editor
4. Then continue with Step 2

---

### Problem: "No users to migrate"

**Cause**: Users already migrated OR no users exist

**Check**:
```sql
SELECT id, email, auth_user_id FROM users;
```

If `auth_user_id` is already filled, migration is complete!

If no users exist, create one:
```sql
INSERT INTO users (username, email, password, role, is_enabled)
VALUES ('superadmin', 'admin@trikonclinics.com', 'placeholder', 'Super Admin', true);
```

Then run migration again.

---

### Problem: Cannot login with new credentials

**Possible causes:**
1. User migration not run
2. User's `is_enabled` is false
3. Wrong email or password

**Check user record**:
```sql
SELECT id, email, username, role, is_enabled, auth_user_id
FROM users
WHERE email = 'admin@trikonclinics.com';
```

**Expected:**
- `is_enabled` = true
- `auth_user_id` = some UUID (not NULL)

**Fix if needed**:
```sql
-- Enable user
UPDATE users SET is_enabled = true WHERE email = 'admin@trikonclinics.com';

-- If auth_user_id is NULL, run Step 2 again
```

---

### Problem: Login works but data doesn't load

**Cause**: RLS policies failing

**Check auth.uid()**:
```sql
-- While logged in, run this in SQL Editor
SELECT auth.uid();
```

**Expected**: Should return a UUID, not NULL

**If NULL**:
- Clear browser cache and localStorage
- Logout and login again
- Check browser console for errors

---

### Problem: "Auth user already exists"

**Cause**: User already has Supabase Auth account

**Solution**: This is OK! The script will skip already-migrated users. Just make sure the `auth_user_id` in the users table is set correctly.

**Verify**:
```sql
SELECT u.email, u.auth_user_id, a.id as auth_id
FROM users u
LEFT JOIN auth.users a ON u.email = a.email;
```

Both `auth_user_id` and `auth_id` should match and not be NULL.

---

## 🔐 Security Notes

### Temporary Password

All users get temporary password: `TempPassword@123`

**Action Required:**
1. Inform users to change password on first login
2. Add password change feature to user profile
3. Or use Supabase's password reset flow

### Old Passwords

The `password` column in the `users` table is no longer used for authentication. Supabase Auth handles all password management now.

**Optional cleanup (future):**
```sql
-- Remove old password column (do this later, after confirming everything works)
ALTER TABLE users DROP COLUMN password;
```

---

## 📚 Full Documentation

For detailed information, see:
- **[SUPABASE-AUTH-MIGRATION-GUIDE.md](./SUPABASE-AUTH-MIGRATION-GUIDE.md)** - Complete migration guide
- **[Supabase Auth Docs](https://supabase.com/docs/guides/auth)** - Official documentation

---

## 🆘 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase Dashboard > Logs for database errors
3. Review the full migration guide: `SUPABASE-AUTH-MIGRATION-GUIDE.md`
4. Check RLS policies in Supabase Dashboard > Authentication > Policies

---

## ✅ Success Checklist

Mark these off as you complete the migration:

- [ ] Environment variables configured
- [ ] Database migration applied (Step 1)
- [ ] Users migrated to Supabase Auth (Step 2)
- [ ] Can login with email and temporary password
- [ ] Dashboard loads after login
- [ ] Can view events/doctors/services
- [ ] Can create new events/doctors/services
- [ ] Can update existing data
- [ ] Can delete data (Super Admin only)
- [ ] Session persists after page refresh
- [ ] Logout works correctly
- [ ] `auth.uid()` returns valid UUID
- [ ] All RLS policies working

Once all checkboxes are marked, migration is complete! 🎉

---

**Migration Date**: October 15, 2025
**Estimated Time**: 5-10 minutes
**Difficulty**: Easy to Moderate

---

## 🚀 Next Steps After Migration

1. **Change Password**: Login and change from temporary password
2. **Test All Features**: Thoroughly test all admin features
3. **Create New Users**: Add other admin users if needed
4. **Monitor Logs**: Check activity_logs table for any issues
5. **Update Documentation**: Update any internal docs with new login process

**New Login Process:**
- Field: Email (not username)
- Example: admin@trikonclinics.com
- Password: Use Supabase Auth password (not old password)

That's it! Your application now uses Supabase Auth with working RLS policies. 🎉
