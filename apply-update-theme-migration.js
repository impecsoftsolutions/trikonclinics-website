/**
 * Apply Update Theme Function Migration
 *
 * This script applies the update_theme function migration to the Supabase database.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('============================================================');
console.log('Apply Update Theme Function Migration');
console.log('============================================================\n');

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251010000000_add_update_theme_function.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`✓ Migration file loaded (${migrationSQL.length} characters)\n`);

    // Parse the SQL into individual statements
    // Remove comments and split by statement terminators
    const cleanSQL = migrationSQL
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/--[^\n]*/g, ''); // Remove -- comments

    // Split into CREATE FUNCTION statements
    const statements = cleanSQL
      .split(/(?=CREATE OR REPLACE FUNCTION)/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Try to execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      // Extract function name for logging
      const funcMatch = statement.match(/CREATE OR REPLACE FUNCTION\s+(\w+)/i);
      if (funcMatch) {
        console.log(`  Function: ${funcMatch[1]}`);
      }

      // Note: The Supabase JS client cannot directly execute DDL statements
      // We need to use the Management API or run this via the dashboard
      console.log('  ⚠️  Cannot execute DDL via Supabase JS client\n');
    }

    console.log('⚠️  Important: This migration must be applied manually.\n');
    console.log('Please use one of these methods:\n');

    console.log('METHOD 1: Supabase Dashboard SQL Editor (Recommended)');
    console.log(`   1. Go to ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor`);
    console.log('   2. Click "SQL Editor" in the left sidebar');
    console.log('   3. Click "New Query"');
    console.log('   4. Copy the contents of: supabase/migrations/20251010000000_add_update_theme_function.sql');
    console.log('   5. Paste into the editor');
    console.log('   6. Click "Run"\n');

    console.log('METHOD 2: Use the provided SQL directly');
    console.log('   Copy and paste this SQL into the Supabase Dashboard SQL Editor:\n');
    console.log('---BEGIN SQL---');
    console.log(migrationSQL);
    console.log('---END SQL---\n');

    // Check if the function already exists
    console.log('🔍 Checking if function already exists...\n');

    try {
      // Try to call the function with a dummy UUID to see if it exists
      const { error } = await supabase.rpc('update_theme', {
        p_theme_id: '00000000-0000-0000-0000-000000000000',
        p_config: {},
        p_change_description: 'test',
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message.includes('Could not find')) {
          console.log('❌ Function update_theme does NOT exist yet');
          console.log('   Please apply the migration using METHOD 1 above.\n');
        } else {
          console.log('✓ Function update_theme EXISTS in the database');
          console.log(`   Test call returned: ${error.message}\n`);
        }
      } else {
        console.log('✓ Function update_theme EXISTS and is callable\n');
      }
    } catch (err) {
      console.log('⚠️  Could not verify function existence:', err.message, '\n');
    }

    console.log('============================================================');
    console.log('Next Steps:');
    console.log('1. Apply the migration using the Supabase Dashboard');
    console.log('2. Run this script again to verify the function was created');
    console.log('3. Test theme editing in the application');
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration();
