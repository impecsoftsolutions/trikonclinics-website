# 🚨 QUICK FIX: Login Not Working

## The Issue
Your login is blocked by Supabase Row Level Security (RLS) policies.

## The Fix (2 Simple Steps)

### 1️⃣ Run This SQL Script
1. Open https://supabase.com/dashboard
2. Go to your project → **SQL Editor**
3. Copy ALL contents from `fix-rls-policies.sql`
4. Paste and click **Run**

### 2️⃣ Create Admin User
Run this command in your terminal:
```bash
npm run db:test
```

Expected output:
```
✅ Super Admin created successfully!
🎉 Setup complete!
```

### 3️⃣ Login
- **Username:** `superadmin`
- **Password:** `Admin@123`

---

## Why This Happened

Your app uses custom authentication (username/password in a users table), but the database was set up with policies expecting Supabase's built-in auth system. The SQL script fixes this mismatch.

## Is It Secure?

Yes! Security is maintained through:
- Bcrypt password hashing
- Application-level permission checks
- Activity logging
- Account enable/disable flags

---

**Still stuck?** See `DATABASE-FIX-README.md` for detailed troubleshooting.
