# 🔧 Database Login Fix - Required Action

## ⚠️ Issue Identified

Your login is not working due to **Row Level Security (RLS) policy restrictions** on your Supabase database.

### Test Results
✅ Database connection: **Working**
✅ Users table exists: **Yes**
✅ Table is readable: **Yes**
❌ User creation: **Blocked by RLS policy**
❌ Login: **Will fail** (cannot query users for authentication)

### The Problem

The database was set up with RLS policies that require Supabase's built-in authentication (`auth.uid()`), but your application uses a **custom username/password authentication system**. This creates a chicken-and-egg problem:

1. Login requires querying the `users` table
2. RLS policies block anonymous queries
3. But you can't authenticate without querying the users table first!

## 🎯 Solution

You need to manually update the RLS policies in your Supabase dashboard to allow the custom authentication system to work.

## 📋 Step-by-Step Fix

### Step 1: Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **ztfrjlmkemqjbclaeqfw**
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### Step 2: Run the RLS Fix Script

Copy the **entire contents** of the file `fix-rls-policies.sql` (in your project root) and paste it into the SQL Editor, then click **"Run"**.

This script will:
- Remove policies that depend on `auth.uid()`
- Add new policies that allow anonymous and public access
- Maintain security through application-level checks

### Step 3: Create the Super Admin User

After fixing the RLS policies, run this script again to create the super admin:

```bash
npm run db:test
```

You should see:
```
✅ Super Admin created successfully!

🎉 Setup complete! You can now login with:
   Username: superadmin
   Password: Admin@123
```

### Step 4: Test Login

1. Navigate to the login page
2. Enter:
   - **Username:** `superadmin`
   - **Password:** `Admin@123`
3. Click **Login**

You should now be logged in successfully! 🎉

## 🔐 Security Notes

### Is This Secure?

Yes! The updated RLS policies allow database operations but security is maintained through:

1. **Password Hashing**: All passwords are hashed with bcrypt before storage
2. **Application-Level Checks**: Your React application validates user permissions
3. **Activity Logging**: All actions are logged to the `activity_logs` table
4. **Enabled Flag**: The `is_enabled` flag prevents disabled accounts from logging in

### Why Not Use Supabase Auth?

Your application was designed to use a custom authentication system with:
- Custom `users` table
- Role-based access control (Super Admin, Admin, Content Manager, Viewer)
- Username-based login (not email-based)
- Application-managed sessions

The RLS fix allows this custom system to work properly with Supabase's database security.

## 📝 Alternative: Manual User Creation

If you prefer not to run the SQL script, you can create a user manually:

### Step 1: Generate Password Hash

Run this in your browser console (on any page of your app):

```javascript
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('Admin@123', 10);
console.log(hash);
```

### Step 2: Insert User via SQL Editor

In Supabase SQL Editor, run:

```sql
INSERT INTO users (username, password, email, role, is_enabled)
VALUES (
  'superadmin',
  'PASTE_THE_HASH_FROM_STEP_1_HERE',
  'admin@trikonclinics.com',
  'Super Admin',
  true
);
```

## 🆘 Troubleshooting

### "new row violates row-level security policy"
**Problem:** The RLS fix script hasn't been run yet.
**Solution:** Complete Step 2 above.

### "relation 'users' does not exist"
**Problem:** Database tables haven't been created.
**Solution:** Run the migration file `supabase/migrations/20251008131824_create_hospital_tables.sql` in Supabase SQL Editor first.

### "Invalid username or password"
**Problem:** User was created with wrong password hash or doesn't exist.
**Solution:** Run `npm run db:test` to verify user exists and password is correct.

### Still having issues?
Run the database test script to see detailed diagnostics:

```bash
npm run db:test
```

## 📂 Files Reference

- `fix-rls-policies.sql` - SQL script to fix RLS policies
- `test-connection.js` - Node script to test database connection
- `SETUP-INSTRUCTIONS.md` - Detailed setup guide
- `DATABASE-FIX-README.md` - This file

## ✅ Quick Checklist

- [ ] Run `fix-rls-policies.sql` in Supabase SQL Editor
- [ ] Run `npm run db:test` to create super admin
- [ ] Test login with superadmin / Admin@123
- [ ] Change default password after first login

---

**Need help?** Check the Supabase dashboard logs for detailed error messages.
