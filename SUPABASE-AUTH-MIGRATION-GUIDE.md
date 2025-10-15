# Supabase Auth Migration Guide

## Overview

This guide documents the complete migration from a custom authentication system to Supabase's built-in authentication system. This migration was necessary to make Row Level Security (RLS) policies work correctly with `auth.uid()`.

---

## What Changed

### Before Migration

The application used a custom authentication system with the following characteristics:

- **Username/Password Login**: Users logged in with username and password
- **LocalStorage Sessions**: User data was stored in localStorage
- **No Supabase Auth**: The app bypassed Supabase's authentication system entirely
- **Broken RLS**: All RLS policies failed because `auth.uid()` returned NULL
- **Manual Password Hashing**: bcrypt was used to hash passwords in the users table

### After Migration

The application now uses Supabase Auth with the following improvements:

- **Email/Password Login**: Users log in with email and password
- **Supabase Sessions**: Sessions are managed by Supabase Auth with automatic token refresh
- **Working RLS**: All RLS policies now work correctly with `auth.uid()`
- **Secure Authentication**: Supabase handles all password hashing and session management
- **Session Persistence**: Users remain logged in across page refreshes

---

## Database Changes

### New Column Added

**Table**: `users`
- **Column**: `auth_user_id` (uuid, unique, nullable)
- **Purpose**: Links users table records to Supabase Auth users (auth.users table)
- **Index**: `idx_users_auth_user_id` for fast lookups

### New Helper Functions

Five helper functions were created to simplify RLS policy checks:

1. **`get_current_user()`**
   - Returns the full user record for the authenticated user
   - Used to fetch user data from users table based on auth.uid()

2. **`get_user_role()`**
   - Returns the role of the authenticated user
   - Quick lookup for role-based access control

3. **`is_super_admin()`**
   - Returns boolean indicating if user is Super Admin
   - Used in RLS policies for super admin-only operations

4. **`is_admin_or_above()`**
   - Returns boolean indicating if user is Admin or Super Admin
   - Used for admin-level operations

5. **`is_content_manager_or_above()`**
   - Returns boolean indicating if user is Content Manager, Admin, or Super Admin
   - Used for content management operations

### Updated RLS Policies

All RLS policies across all tables were updated to:

1. Check `auth.uid()` instead of querying users table directly
2. Use the new helper functions for role checks
3. Link users via `auth_user_id` column
4. Require authenticated users to have matching enabled records in users table

**Tables with Updated Policies:**
- users
- hospital_profile
- doctors
- testimonials
- services
- contact_information
- social_media
- activity_logs
- events
- event_images
- event_videos
- event_tags
- tags
- event_error_logs
- health_library_categories
- health_library_illnesses
- health_library_images
- site_settings
- url_redirects

---

## Application Changes

### 1. Supabase Client Configuration

**File**: `src/lib/supabase.ts`

Added authentication configuration:
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // Persist sessions in localStorage
    autoRefreshToken: true,       // Auto-refresh expired tokens
    detectSessionInUrl: true,     // Handle OAuth redirects
    storage: window.localStorage  // Use localStorage for session storage
  }
});
```

### 2. AuthContext Rewrite

**File**: `src/contexts/AuthContext.tsx`

Complete rewrite to use Supabase Auth:

- **Session Management**: Uses `supabase.auth.getSession()` and `onAuthStateChange()`
- **Login Function**: Changed from bcrypt comparison to `supabase.auth.signInWithPassword()`
- **Logout Function**: Changed to `supabase.auth.signOut()`
- **User Data Fetching**: Fetches user data from users table using `auth_user_id`
- **State Management**: Tracks both Supabase session and user data from users table

### 3. Login Page Update

**File**: `src/pages/Login.tsx`

Key changes:
- Changed from username to email input field
- Removed `createSuperAdmin()` initialization call
- Simplified form to just email and password
- Updated labels and placeholders

### 4. Login Credentials

**IMPORTANT**: Login credentials have changed!

**Old Login:**
- Username: `superadmin`
- Password: `Admin@123`

**New Login (Temporary):**
- Email: `admin@trikonclinics.com`
- Password: `TempPassword@123`

**Action Required**: Users should change their password after first login.

---

## Migration Process

The migration is completed in three steps:

### Step 1: Apply Database Migration

This step adds the `auth_user_id` column, creates helper functions, and updates all RLS policies.

**File**: `supabase/migrations/20251015020000_integrate_supabase_auth.sql`

```bash
# Apply migration using Supabase CLI or custom script
node apply-supabase-auth-migration.mjs
```

### Step 2: Migrate Users to Supabase Auth

This step creates Supabase Auth accounts for all existing users and links them to the users table.

**File**: `migrate-users-to-supabase-auth.mjs`

```bash
# Run the user migration script
node migrate-users-to-supabase-auth.mjs
```

**What this script does:**
1. Fetches all users without `auth_user_id` from users table
2. Creates Supabase Auth account for each user
3. Sets temporary password: `TempPassword@123`
4. Links auth user to database user via `auth_user_id`
5. Adds migration metadata to user_metadata
6. Auto-confirms email (no email verification required)

### Step 3: Update Application Code

Already completed! The application code has been updated to:
- Use Supabase Auth for login/logout
- Accept email instead of username
- Manage sessions properly
- Fetch user data based on auth.uid()

---

## How Authentication Works Now

### Login Flow

1. User enters email and password on login page
2. App calls `supabase.auth.signInWithPassword({ email, password })`
3. Supabase validates credentials and returns auth user + session
4. App fetches user data from users table using `auth_user_id`
5. App verifies user is enabled
6. Session is stored in localStorage by Supabase
7. User is redirected to dashboard

### Session Persistence

1. On app load, AuthContext calls `supabase.auth.getSession()`
2. If valid session exists, user data is fetched from users table
3. AuthContext subscribes to `onAuthStateChange` for real-time updates
4. Sessions automatically refresh before expiration
5. User remains logged in across page refreshes and browser restarts

### Logout Flow

1. User clicks logout
2. Activity log is created
3. App calls `supabase.auth.signOut()`
4. Session is cleared from localStorage
5. User state is reset
6. User is redirected to login page

### RLS Policy Checks

1. When user makes database query, Supabase includes JWT token
2. JWT token contains `auth.uid()` of authenticated user
3. RLS policies check if user exists in users table with matching `auth_user_id`
4. Helper functions fetch user role and permissions
5. Query is allowed or denied based on policy rules

---

## Creating New Admin Users

To create new admin users after migration, you have two options:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add User" (manual)
3. Enter email and password
4. Confirm user creation
5. Copy the User UID (auth user id)
6. Go to Supabase Dashboard > Table Editor > users table
7. Insert new row with:
   - `username`: Choose a username
   - `email`: Same email as auth user
   - `password`: (can leave as placeholder, not used anymore)
   - `role`: Choose role (Super Admin, Admin, Content Manager, Viewer)
   - `auth_user_id`: Paste the User UID from step 5
   - `is_enabled`: true
   - Other fields as needed

### Option 2: Using SQL Script

```sql
-- Step 1: Create auth user (replace email and password)
-- This must be done through Supabase Dashboard or Admin API

-- Step 2: Insert into users table
INSERT INTO users (
  username,
  email,
  password,
  role,
  auth_user_id,
  is_enabled
) VALUES (
  'newadmin',
  'newadmin@trikonclinics.com',
  'placeholder',  -- Not used for auth anymore
  'Admin',
  '00000000-0000-0000-0000-000000000000',  -- Replace with actual auth user id
  true
);
```

### Option 3: Create Registration Endpoint (Future Enhancement)

For production, you may want to create an admin-only registration page that:
1. Creates Supabase Auth user via Admin API
2. Inserts matching record in users table
3. Links them via auth_user_id
4. Sends welcome email

---

## Testing Checklist

After migration, verify the following:

### Authentication Tests

- [ ] Login with email: `admin@trikonclinics.com` / `TempPassword@123`
- [ ] User redirected to dashboard after successful login
- [ ] User data displayed correctly in header/sidebar
- [ ] Session persists after page refresh
- [ ] Logout works correctly
- [ ] Cannot access admin pages without login
- [ ] Invalid credentials show appropriate error message

### Database Operations Tests

Test CRUD operations for each table:

- [ ] **Events**: Create, read, update, delete events
- [ ] **Event Images**: Upload, view, delete images
- [ ] **Event Videos**: Add, view, delete videos
- [ ] **Event Tags**: Create, assign, remove tags
- [ ] **Doctors**: Create, update, view, delete doctors
- [ ] **Services**: Create, update, view, delete services
- [ ] **Testimonials**: Create, update, publish, delete testimonials
- [ ] **Health Library**: Create categories and illnesses
- [ ] **Categories**: Create, update, delete categories
- [ ] **Hospital Profile**: Update hospital information
- [ ] **Contact Information**: Update contact details
- [ ] **Social Media**: Add, update, delete social links
- [ ] **Activity Logs**: Verify logs are created for all actions
- [ ] **User Management**: Create, update, disable users (Super Admin only)

### RLS Verification Tests

Verify `auth.uid()` is working:

```sql
-- Run this query while logged in
SELECT auth.uid();  -- Should return your auth user id, not NULL

-- Verify user data is linked correctly
SELECT * FROM get_current_user();  -- Should return your user record

-- Check your role
SELECT get_user_role();  -- Should return 'Super Admin'

-- Check permissions
SELECT is_super_admin();  -- Should return true
SELECT is_admin_or_above();  -- Should return true
SELECT is_content_manager_or_above();  -- Should return true
```

### Permission Tests

Test role-based access:

- [ ] **Super Admin**: Can do everything
- [ ] **Admin**: Cannot manage users but can delete content
- [ ] **Content Manager**: Can create/edit content but cannot delete
- [ ] **Viewer**: Can only view, no edits (if implemented)

---

## Troubleshooting

### Problem: Cannot login with email

**Solution**: Make sure you're using the email address, not username. New format is:
- Email: `admin@trikonclinics.com`
- Password: `TempPassword@123`

### Problem: Login successful but redirects to login page

**Possible Causes**:
1. User's `auth_user_id` is NULL (not linked to auth user)
2. User's `is_enabled` is false
3. Session not persisting in localStorage

**Solution**:
```sql
-- Check user record
SELECT * FROM users WHERE email = 'admin@trikonclinics.com';

-- Verify auth_user_id is set and matches auth.users
SELECT u.*, a.id as auth_id
FROM users u
LEFT JOIN auth.users a ON u.email = a.email
WHERE u.email = 'admin@trikonclinics.com';

-- Fix if needed
UPDATE users
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'admin@trikonclinics.com')
WHERE email = 'admin@trikonclinics.com';
```

### Problem: auth.uid() returns NULL

**Possible Causes**:
1. Not logged in through Supabase Auth
2. Session expired
3. Using wrong Supabase client (service role instead of anon key)

**Solution**:
1. Ensure you're logged in via the login page
2. Check browser console for auth errors
3. Verify Supabase client is using ANON key, not service role key

### Problem: RLS policies still failing

**Possible Causes**:
1. Database migration not applied
2. Helper functions not created
3. Old policies not dropped

**Solution**:
```sql
-- Verify helper functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'is_%'
OR routine_name LIKE 'get_%';

-- Should see:
-- get_current_user
-- get_user_role
-- is_super_admin
-- is_admin_or_above
-- is_content_manager_or_above

-- Verify policies are using new functions
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
LIMIT 5;
```

### Problem: Cannot create events/upload images

**Possible Causes**:
1. User role doesn't have permission
2. RLS policy not allowing operation
3. Storage policies not updated

**Solution**:
1. Verify user role is Content Manager or above
2. Check Supabase Dashboard > Table Editor for error messages
3. Review storage bucket policies in Supabase Dashboard

### Problem: Old password doesn't work

**Explanation**: All users now have temporary password `TempPassword@123`

**Solution**:
1. Login with temporary password
2. Go to user profile/settings
3. Change password to your preferred password
4. Supabase Auth will handle the new password securely

---

## Security Improvements

This migration brings significant security improvements:

### 1. Industry-Standard Authentication
- Supabase Auth uses proven authentication methods
- Passwords are hashed with bcrypt automatically
- JWT tokens are signed and verified
- Built-in protection against common attacks

### 2. Automatic Session Management
- Sessions expire after inactivity
- Tokens automatically refresh before expiration
- Secure token storage in localStorage
- Session invalidation on logout

### 3. Database-Level Security
- RLS policies enforce permissions at database level
- Cannot be bypassed by client-side code
- Works with `auth.uid()` from JWT token
- Fine-grained access control

### 4. Audit Trail
- All authentication events logged
- Activity logs track user actions
- Failed login attempts can be monitored
- User account changes are traceable

### 5. No Password Storage
- Password column in users table no longer used for auth
- All passwords handled by Supabase Auth
- Can be removed in future migration for cleanup

---

## Future Enhancements

Consider implementing these features:

### 1. Password Reset Flow
- Add "Forgot Password" link on login page
- Use Supabase Auth's password reset functionality
- Send reset emails to users

### 2. Email Verification
- Require email verification for new users
- Re-verify email if changed
- Add email verification badge in UI

### 3. Two-Factor Authentication (2FA)
- Enable 2FA for Super Admin accounts
- Require 2FA for sensitive operations
- Support authenticator apps

### 4. Session Management
- Show active sessions in user profile
- Allow users to revoke sessions
- Set custom session timeout

### 5. OAuth Providers
- Add Google login for admins
- Support Microsoft/Azure AD
- Enterprise SSO integration

### 6. Account Lockout
- Lock account after failed login attempts
- Require admin to unlock
- Send email notification on lockout

### 7. Password Policies
- Enforce strong password requirements
- Require periodic password changes
- Prevent password reuse

---

## Rollback Plan

If issues arise and you need to rollback:

### Step 1: Restore Old AuthContext

Replace `src/contexts/AuthContext.tsx` with the old version that used username/password and localStorage.

### Step 2: Restore Old Login Page

Replace `src/pages/Login.tsx` with the old version that used username field.

### Step 3: Keep Database Changes

**DO NOT** rollback the database migration. The auth_user_id column and helper functions don't interfere with the old system.

### Step 4: Fix Login

The old login function will still work because:
- Password column still exists in users table
- Users can still be queried by username
- bcrypt still validates passwords

---

## Support and Resources

### Documentation
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

### Common Commands

```bash
# Check Supabase connection
node test-connection.js

# Verify migration applied
psql $DATABASE_URL -c "SELECT * FROM users LIMIT 1;"

# Check auth users
# (Use Supabase Dashboard > Authentication > Users)

# View logs
# (Use Supabase Dashboard > Logs)
```

---

## Summary

The migration from custom authentication to Supabase Auth was necessary to make RLS policies work correctly. The key changes were:

1. **Database**: Added `auth_user_id` column and helper functions
2. **Migration**: Created Supabase Auth users for existing users
3. **Application**: Updated login flow to use Supabase Auth
4. **Security**: RLS policies now work with `auth.uid()`

**Login Credentials:**
- Email: `admin@trikonclinics.com`
- Password: `TempPassword@123`

All existing data (events, doctors, services, etc.) has been preserved. The application is more secure and follows Supabase best practices.

**Next Steps:**
1. Test login with new credentials
2. Verify all CRUD operations work
3. Change temporary password
4. Create additional admin users if needed
5. Monitor activity logs for any issues

---

**Migration Date**: October 15, 2025
**Migration Version**: 20251015020000
**Status**: Complete
