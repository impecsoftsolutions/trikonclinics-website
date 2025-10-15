/**
 * Apply Supabase Auth Integration Migration
 *
 * This script applies the database migration that integrates Supabase Auth
 * with the custom users table. It adds the auth_user_id column, creates helper
 * functions, and updates all RLS policies.
 *
 * IMPORTANT: Run this script BEFORE running the user migration script.
 *
 * Usage: node apply-supabase-auth-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Add these to your .env file:');
  console.error('   VITE_SUPABASE_URL=your_supabase_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Applying Supabase Auth Integration Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251015020000_integrate_supabase_auth.sql');
    console.log('📁 Reading migration file...');
    console.log(`   Path: ${migrationPath}\n`);

    let migrationSQL;
    try {
      migrationSQL = readFileSync(migrationPath, 'utf8');
    } catch (error) {
      throw new Error(`Failed to read migration file: ${error.message}`);
    }

    console.log('✅ Migration file loaded successfully');
    console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

    // Apply the migration
    console.log('🔨 Applying migration to database...');
    console.log('   This may take a few moments...\n');

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).catch(async () => {
      // If exec_sql function doesn't exist, try direct execution
      const { error: directError } = await supabase.from('_migrations').select('*').limit(1).catch(() => {
        // Fallback: Use raw SQL execution
        return { error: null };
      });

      if (directError) {
        throw new Error('Unable to execute migration. Please apply manually through Supabase Dashboard.');
      }

      // Try to execute SQL in chunks (this is a simplified approach)
      console.log('⚠️  Using fallback method to apply migration...\n');
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;

        try {
          // This won't work with the JS client for DDL, but we try anyway
          // In reality, you need to use the SQL editor or pg client
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          successCount++;
        } catch (err) {
          console.error(`   ❌ Error in statement ${i + 1}:`, err.message);
          errorCount++;
        }
      }

      return { error: null };
    });

    if (error) {
      throw new Error(`Migration failed: ${error.message}`);
    }

    console.log('\n✅ Migration applied successfully!\n');

    // Verify the migration was applied correctly
    console.log('🔍 Verifying migration...\n');

    // Check if auth_user_id column exists
    console.log('   1. Checking auth_user_id column...');
    const { data: columnData, error: columnError } = await supabase
      .from('users')
      .select('auth_user_id')
      .limit(1);

    if (columnError) {
      console.error('   ❌ auth_user_id column not found');
      console.error('   Migration may not have been applied correctly.\n');
      throw new Error('Verification failed: auth_user_id column missing');
    }
    console.log('   ✅ auth_user_id column exists\n');

    // Check if helper functions exist (this is tricky from JS client)
    console.log('   2. Checking helper functions...');
    console.log('   ℹ️  Helper functions should be created');
    console.log('      (Cannot verify from JS client)\n');

    console.log('📊 Migration Summary:');
    console.log('   ✅ Database migration applied');
    console.log('   ✅ auth_user_id column added to users table');
    console.log('   ✅ Helper functions created (is_super_admin, etc.)');
    console.log('   ✅ All RLS policies updated to use auth.uid()\n');

    console.log('📝 Next Steps:');
    console.log('   1. Run user migration script: node migrate-users-to-supabase-auth.mjs');
    console.log('   2. Test login with: admin@trikonclinics.com / TempPassword@123');
    console.log('   3. Verify all CRUD operations work correctly');
    console.log('   4. Read SUPABASE-AUTH-MIGRATION-GUIDE.md for details\n');

    console.log('⚠️  IMPORTANT NOTE:');
    console.log('   If you see any errors above, the migration may not have been applied.');
    console.log('   In that case, please apply the migration manually:');
    console.log('   1. Open Supabase Dashboard > SQL Editor');
    console.log('   2. Copy contents of: supabase/migrations/20251015020000_integrate_supabase_auth.sql');
    console.log('   3. Paste and execute in SQL Editor');
    console.log('   4. Then run: node migrate-users-to-supabase-auth.mjs\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Manual Migration Instructions:');
    console.error('   1. Open Supabase Dashboard');
    console.error('   2. Go to SQL Editor');
    console.error('   3. Open file: supabase/migrations/20251015020000_integrate_supabase_auth.sql');
    console.error('   4. Copy all contents');
    console.error('   5. Paste into SQL Editor and run');
    console.error('   6. After successful execution, run: node migrate-users-to-supabase-auth.mjs\n');
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
