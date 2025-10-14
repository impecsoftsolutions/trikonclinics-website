import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg1MzcsImV4cCI6MjA3NTUwNDUzN30.B142DvwZvXWRGnayzvzzzZOzNxLlE9Ryl3jwX1Nrqlw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigration() {
  console.log('============================================================');
  console.log('Theme Cache Sync Fix - Migration Application');
  console.log('============================================================\n');

  console.log('📖 Reading migration file...');
  const migrationPath = join(__dirname, 'supabase/migrations/20251010100000_fix_theme_update_cache_sync.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  console.log(`✓ Migration file loaded (${migrationSQL.length} characters)\n`);

  console.log('⚠️  This migration must be applied manually using the Supabase Dashboard.\n');

  console.log('📝 INSTRUCTIONS:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql');
  console.log('   2. Click "New Query"');
  console.log('   3. Copy the entire contents of:');
  console.log('      supabase/migrations/20251010100000_fix_theme_update_cache_sync.sql');
  console.log('   4. Paste into the SQL editor');
  console.log('   5. Click "Run" (or press Ctrl+Enter)\n');

  console.log('✨ What this migration fixes:');
  console.log('   • Theme edits now immediately invalidate cache');
  console.log('   • Active theme updates sync to modern_site_settings');
  console.log('   • Automatic trigger keeps hashes in sync');
  console.log('   • Added manual refresh_theme_cache() utility function\n');

  console.log('🎯 After applying the migration:');
  console.log('   1. Edit your active theme in the Modern Theme Settings page');
  console.log('   2. Save the changes');
  console.log('   3. Refresh the website (or wait up to 60 seconds)');
  console.log('   4. Your changes will now appear immediately!\n');

  console.log('============================================================\n');
}

applyMigration();
