/**
 * Automatic Migration Application Script
 *
 * This script attempts to apply the migration automatically by executing
 * the SQL directly through Supabase's REST API.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg1MzcsImV4cCI6MjA3NTUwNDUzN30.B142DvwZvXWRGnayzvzzzZOzNxLlE9Ryl3jwX1Nrqlw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('============================================================');
console.log('Automatic Migration Application');
console.log('============================================================\n');

async function executeSQLDirect(sql) {
  try {
    // Try using Supabase's RPC endpoint to execute SQL
    // Note: This requires a custom function or proper permissions
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function applyMigration() {
  console.log('📖 Reading migration file...');
  const migrationPath = join(__dirname, 'supabase/migrations/20251009170000_create_modern_themes_system.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');
  console.log(`✓ Migration file loaded\n`);

  console.log('🔍 Checking current database state...\n');

  // Check if tables already exist
  const { data: existingCheck, error: checkError } = await supabase
    .from('modern_themes')
    .select('count')
    .limit(1);

  if (!checkError) {
    console.log('✅ MIGRATION ALREADY APPLIED!');
    console.log('   The modern_themes table exists.\n');

    // Show existing themes
    const { data: themes } = await supabase
      .from('modern_themes')
      .select('name, slug, is_preset, validation_status')
      .eq('is_preset', true);

    if (themes && themes.length > 0) {
      console.log('📋 Preset Themes:');
      themes.forEach(theme => {
        console.log(`   ${theme.validation_status === 'passed' ? '✓' : '⚠'} ${theme.name} (${theme.slug})`);
      });
      console.log('');
    }

    // Show active theme
    const { data: settings } = await supabase
      .from('modern_site_settings')
      .select('active_theme_id')
      .maybeSingle();

    if (settings && settings.active_theme_id) {
      const { data: activeTheme } = await supabase
        .from('modern_themes')
        .select('name, slug')
        .eq('id', settings.active_theme_id)
        .maybeSingle();

      if (activeTheme) {
        console.log(`🎨 Active Theme: ${activeTheme.name}\n`);
      }
    }

    console.log('============================================================');
    console.log('Status: Migration Verified ✓');
    console.log('============================================================\n');
    console.log('Ready to proceed to Phase 2!\n');
    return;
  }

  console.log('⚠️  Tables not found. Migration needs to be applied.\n');
  console.log('📝 MANUAL APPLICATION REQUIRED\n');
  console.log('The Supabase anon key does not have permissions to execute DDL statements.');
  console.log('Please apply the migration manually using the Supabase Dashboard:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/editor');
  console.log('2. Click "SQL Editor" → "New Query"');
  console.log('3. Copy contents from: supabase/migrations/20251009170000_create_modern_themes_system.sql');
  console.log('4. Paste and click "Run"\n');
  console.log('See MIGRATION-INSTRUCTIONS.md for detailed steps.\n');
}

applyMigration().catch(console.error);
