# Database Setup Instructions

The login is currently not working because the Row Level Security (RLS) policies on your Supabase database need to be updated.

## Problem

The database was created with RLS policies that require Supabase's built-in authentication system (`auth.uid()`), but your application uses a custom users table with username/password authentication. This prevents the anonymous client from querying the users table during login.

## Solution

You need to manually run SQL scripts in your Supabase SQL Editor to fix the RLS policies.

## Steps to Fix

### 1. Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **ztfrjlmkemqjbclaeqfw**
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Initial Migration (if not already done)

Copy and paste the contents of this file into the SQL Editor and run it:
- `supabase/migrations/20251008131824_create_hospital_tables.sql`

This creates all the database tables.

### 3. Fix RLS Policies

Copy and paste the contents of this file into the SQL Editor and run it:
- `fix-rls-policies.sql`

This updates the RLS policies to allow anonymous access for login queries while keeping data secure.

### 4. Create Super Admin User

After fixing the RLS policies, you can create the super admin user by either:

**Option A: Using the browser console**
1. Start the dev server (if not already running)
2. Navigate to the login page
3. Open browser console (F12)
4. Run this code:
```javascript
import { setupDatabase } from './src/scripts/setupDatabase';
setupDatabase();
```

**Option B: Manually in SQL Editor**
Run this SQL:
```sql
INSERT INTO users (username, password, email, role, is_enabled)
VALUES (
  'superadmin',
  '$2a$10$YourHashedPasswordHere',  -- You'll need to generate this
  'admin@trikonclinics.com',
  'Super Admin',
  true
);
```

For Option B, you'll need to generate a bcrypt hash for 'Admin@123' first.

### 5. Test Login

After completing the above steps:
1. Navigate to the login page
2. Enter credentials:
   - Username: `superadmin`
   - Password: `Admin@123`
3. Click Login

The login should now work!

## Why This Approach?

Your application uses a custom authentication system with:
- Custom `users` table storing usernames and bcrypt-hashed passwords
- Application-level role-based access control
- Local session management via localStorage

The RLS policies need to allow anonymous read access to the users table so the login query can work, while still protecting against unauthorized modifications. Security is maintained through:
- Password hashing (bcrypt)
- Application-level permission checks
- Activity logging
- The `is_enabled` flag

## Default Login Credentials

After setup:
- **Username:** superadmin
- **Password:** Admin@123

Make sure to change these credentials after your first login!
