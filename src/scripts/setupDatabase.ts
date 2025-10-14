import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const setupDatabase = async () => {
  console.log('🔧 Starting database setup...');

  try {
    console.log('📋 Step 1: Checking if users table exists...');
    const { error: tablesError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Error checking users table:', tablesError);
      console.log('\n⚠️  The database tables may not be created yet.');
      console.log('Please run the migration file manually in your Supabase SQL Editor:');
      console.log('   supabase/migrations/20251008131824_create_hospital_tables.sql\n');
      console.log('Then run the fix-rls-policies.sql file to update RLS policies.\n');
      return { success: false, error: 'Database tables not found' };
    }

    console.log('✅ Users table exists');

    console.log('\n📋 Step 2: Checking for existing Super Admin...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'superadmin')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking for Super Admin:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingAdmin) {
      console.log('✅ Super Admin already exists');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Enabled: ${existingAdmin.is_enabled}`);
      return { success: true, message: 'Super Admin already exists' };
    }

    console.log('\n📋 Step 3: Creating Super Admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const { data: newAdmin, error: insertError } = await supabase
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

    if (insertError) {
      console.error('❌ Error creating Super Admin:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('✅ Super Admin created successfully!');
    console.log(`   Username: superadmin`);
    console.log(`   Password: Admin@123`);
    console.log(`   Email: admin@trikonclinics.com`);

    console.log('\n📋 Step 4: Creating activity log...');
    await supabase.from('activity_logs').insert({
      user_id: newAdmin.id,
      action: 'create',
      description: 'Super Admin account created',
      table_affected: 'users',
      record_id: newAdmin.id,
    });

    console.log('✅ Database setup completed successfully!\n');
    console.log('🔑 Login Credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: Admin@123\n');

    return { success: true, message: 'Database setup completed', data: newAdmin };
  } catch (error) {
    console.error('❌ Unexpected error during setup:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}
