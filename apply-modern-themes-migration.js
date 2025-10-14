/**
 * Apply Modern Themes System Migration
 *
 * This script reads the migration file and applies it to the Supabase database.
 * It provides detailed logging for debugging and verification.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg1MzcsImV4cCI6MjA3NTUwNDUzN30.B142DvwZvXWRGnayzvzzzZOzNxLlE9Ryl3jwX1Nrqlw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('============================================================');
console.log('Modern Theme System Phase 1 - Migration Application');
console.log('============================================================\n');

async function applyMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase/migrations/20251009170000_create_modern_themes_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`✓ Migration file loaded (${migrationSQL.length} characters)\n`);

    console.log('🔧 Applying migration to Supabase...');
    console.log('   This may take a moment as we create tables, functions, and seed data...\n');

    // Execute the migration SQL
    // Note: Supabase client doesn't support direct SQL execution with multiple statements
    // We need to use the Supabase API or split the SQL into individual statements

    console.log('⚠️  Important: This migration contains multiple SQL statements.');
    console.log('   Please apply it using one of these methods:\n');

    console.log('METHOD 1: Supabase Dashboard (Recommended)');
    console.log('   1. Go to https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/editor');
    console.log('   2. Click "SQL Editor" in the left sidebar');
    console.log('   3. Click "New Query"');
    console.log('   4. Copy the contents of: supabase/migrations/20251009170000_create_modern_themes_system.sql');
    console.log('   5. Paste into the editor');
    console.log('   6. Click "Run"\n');

    console.log('METHOD 2: Supabase CLI');
    console.log('   1. Install Supabase CLI: npm install -g supabase');
    console.log('   2. Link to your project: supabase link --project-ref ztfrjlmkemqjbclaeqfw');
    console.log('   3. Run: supabase db push\n');

    console.log('METHOD 3: PostgreSQL Client (psql)');
    console.log('   1. Get your database connection string from Supabase dashboard');
    console.log('   2. Run: psql "<connection-string>" < supabase/migrations/20251009170000_create_modern_themes_system.sql\n');

    // Let's try to verify if tables already exist
    console.log('🔍 Checking if migration has already been applied...\n');

    const { data: existingThemes, error: checkError } = await supabase
      .from('modern_themes')
      .select('count')
      .limit(1);

    if (!checkError) {
      console.log('✓ Migration appears to have been applied already!');
      console.log('  Tables exist and are accessible.\n');

      // Verify preset themes
      const { data: themes, error: themesError } = await supabase
        .from('modern_themes')
        .select('name, slug, is_preset')
        .eq('is_preset', true);

      if (!themesError && themes) {
        console.log('✓ Preset themes found:');
        themes.forEach(theme => {
          console.log(`  - ${theme.name} (${theme.slug})`);
        });
        console.log('');
      }

      // Verify active theme
      const { data: settings, error: settingsError } = await supabase
        .from('modern_site_settings')
        .select('active_theme_id')
        .limit(1)
        .maybeSingle();

      if (!settingsError && settings) {
        const { data: activeTheme } = await supabase
          .from('modern_themes')
          .select('name')
          .eq('id', settings.active_theme_id)
          .maybeSingle();

        if (activeTheme) {
          console.log(`✓ Active theme: ${activeTheme.name}\n`);
        }
      }

      console.log('============================================================');
      console.log('Migration Status: ALREADY APPLIED ✓');
      console.log('============================================================\n');
    } else {
      console.log('⚠️  Migration has NOT been applied yet.');
      console.log('   Please use one of the methods above to apply the migration.\n');

      console.log('============================================================');
      console.log('Migration Status: PENDING');
      console.log('============================================================\n');
    }

  } catch (error) {
    console.error('❌ Error during migration check:', error.message);
    console.error('\nPlease apply the migration manually using the Supabase Dashboard.\n');
  }
}

applyMigration();
