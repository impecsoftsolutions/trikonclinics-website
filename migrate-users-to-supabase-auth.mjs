/**
 * User Migration Script for Supabase Auth Integration
 *
 * This script migrates existing users from the custom users table to Supabase Auth.
 * It creates Supabase Auth accounts for each user and links them to the users table.
 *
 * IMPORTANT: Run this script AFTER applying the database migration.
 *
 * Usage: node migrate-users-to-supabase-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function migrateUsers() {
  console.log('🚀 Starting user migration to Supabase Auth...\n');

  try {
    // Step 1: Fetch all users from the users table
    console.log('📋 Step 1: Fetching existing users...');
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, email, password, role, is_enabled')
      .is('auth_user_id', null); // Only migrate users without auth_user_id

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      console.log('✅ No users to migrate. All users already have Supabase Auth accounts.\n');
      return;
    }

    console.log(`   Found ${users.length} user(s) to migrate:\n`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.username}) - Role: ${user.role}`);
    });
    console.log();

    // Step 2: Create Supabase Auth users for each user
    console.log('🔐 Step 2: Creating Supabase Auth accounts...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`   Creating auth account for: ${user.email}...`);

        // Create Supabase Auth user
        // Note: We use a temporary password that the user will set on first login
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'TempPassword@123', // Temporary password
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            username: user.username,
            role: user.role,
            migrated: true,
            migrated_at: new Date().toISOString()
          }
        });

        if (authError) {
          throw new Error(`Auth creation failed: ${authError.message}`);
        }

        if (!authData || !authData.user) {
          throw new Error('No auth user returned from creation');
        }

        const authUserId = authData.user.id;
        console.log(`   ✓ Auth user created: ${authUserId}`);

        // Step 3: Update users table with auth_user_id
        console.log(`   Linking auth user to database user...`);
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_user_id: authUserId })
          .eq('id', user.id);

        if (updateError) {
          // If linking fails, delete the auth user to maintain consistency
          console.log(`   ⚠️  Failed to link users, cleaning up auth user...`);
          await supabase.auth.admin.deleteUser(authUserId);
          throw new Error(`Failed to link users: ${updateError.message}`);
        }

        console.log(`   ✓ Successfully migrated: ${user.email}\n`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error migrating ${user.email}:`, error.message);
        console.error(`      Please manually fix this user.\n`);
        errorCount++;
      }
    }

    // Step 4: Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total users processed: ${users.length}`);
    console.log(`   Successfully migrated: ${successCount}`);
    console.log(`   Failed migrations: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Warning: Some users failed to migrate. Please review the errors above.');
    } else {
      console.log('\n✅ All users successfully migrated to Supabase Auth!');
    }

    // Step 5: Important instructions
    console.log('\n📝 IMPORTANT NEXT STEPS:');
    console.log('   1. All users have been given a temporary password: TempPassword@123');
    console.log('   2. Inform users to reset their password on first login');
    console.log('   3. For the superadmin user, the old password hash is preserved in the users table');
    console.log('   4. Test login with: admin@trikonclinics.com / TempPassword@123');
    console.log('   5. After successful login, user can update password in their profile');
    console.log('\n🔒 Security Note:');
    console.log('   - Supabase Auth now handles all authentication');
    console.log('   - The password column in users table is no longer used');
    console.log('   - Consider removing the password column in a future migration');
    console.log('   - All RLS policies now work with auth.uid()');
    console.log();

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease fix the error and run the script again.');
    process.exit(1);
  }
}

// Run the migration
migrateUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
