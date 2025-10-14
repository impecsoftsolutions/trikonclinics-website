// Simple script to test Supabase connection and fix database issues
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg1MzcsImV4cCI6MjA3NTUwNDUzN30.B142DvwZvXWRGnayzvzzzZOzNxLlE9Ryl3jwX1Nrqlw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using Anon Key:', supabaseAnonKey.substring(0, 50) + '...\n');

  try {
    // Test 1: Check if users table exists and is accessible
    console.log('📋 Test 1: Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, email, role, is_enabled')
      .limit(5);

    if (usersError) {
      console.log('❌ Error accessing users table:', usersError.message);
      console.log('   Error details:', JSON.stringify(usersError, null, 2));
      console.log('\n⚠️  This is likely an RLS policy issue.');
      console.log('   Please run the fix-rls-policies.sql file in your Supabase SQL Editor.\n');
      return false;
    }

    console.log('✅ Users table is accessible!');
    console.log(`   Found ${users?.length || 0} users\n`);

    if (users && users.length > 0) {
      console.log('📋 Existing users:');
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.role}) - Enabled: ${user.is_enabled}`);
      });
      console.log('');
    }

    // Test 2: Check for Super Admin
    console.log('📋 Test 2: Checking for Super Admin...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'superadmin')
      .maybeSingle();

    if (adminError) {
      console.log('❌ Error checking for Super Admin:', adminError.message);
      return false;
    }

    if (adminData) {
      console.log('✅ Super Admin exists!');
      console.log(`   Username: ${adminData.username}`);
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Role: ${adminData.role}`);
      console.log(`   Enabled: ${adminData.is_enabled}\n`);

      // Test 3: Try to login
      console.log('📋 Test 3: Testing login with Super Admin credentials...');
      const passwordMatch = await bcrypt.compare('Admin@123', adminData.password);

      if (passwordMatch) {
        console.log('✅ Password verification successful!');
        console.log('\n🎉 Everything is working! You can now login with:');
        console.log('   Username: superadmin');
        console.log('   Password: Admin@123\n');
        return true;
      } else {
        console.log('❌ Password verification failed');
        console.log('   The stored password hash does not match "Admin@123"\n');
        return false;
      }
    } else {
      console.log('⚠️  Super Admin does not exist');
      console.log('   Creating Super Admin user...\n');

      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert({
          username: 'superadmin',
          password: hashedPassword,
          email: 'admin@trikonclinics.com',
          role: 'Super Admin',
          is_enabled: true,
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating Super Admin:', createError.message);
        console.log('   Error details:', JSON.stringify(createError, null, 2));
        return false;
      }

      console.log('✅ Super Admin created successfully!');
      console.log('\n🎉 Setup complete! You can now login with:');
      console.log('   Username: superadmin');
      console.log('   Password: Admin@123\n');

      // Create activity log
      await supabase.from('activity_logs').insert({
        user_id: newAdmin.id,
        action: 'create',
        description: 'Super Admin account created',
        table_affected: 'users',
        record_id: newAdmin.id,
      });

      return true;
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

testConnection().then(success => {
  if (!success) {
    console.log('\n⚠️  Setup incomplete. Please check the errors above.');
    console.log('   Refer to SETUP-INSTRUCTIONS.md for manual setup steps.\n');
    process.exit(1);
  }
  process.exit(0);
});
