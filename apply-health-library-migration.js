import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying health_library_enabled migration...\n');

  try {
    const migrationPath = join(__dirname, 'supabase/migrations/20251011000000_add_health_library_toggle.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    const sqlStatements = migrationSQL
      .split(/\/\*[\s\S]*?\*\//)
      .join('')
      .trim();

    console.log('📝 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlStatements
    });

    if (error) {
      console.error('❌ Migration failed via RPC:', error.message);
      console.log('\n📋 Manual migration required. Please run this SQL in Supabase SQL Editor:\n');
      console.log('━'.repeat(80));
      console.log(sqlStatements);
      console.log('━'.repeat(80));
      console.log('\nSteps:');
      console.log('1. Go to https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql');
      console.log('2. Copy and paste the SQL above');
      console.log('3. Click "Run" to execute');
      console.log('4. Reload your application\n');
      process.exit(1);
    }

    console.log('✅ Migration executed successfully!\n');

    console.log('🔍 Verifying column exists...');
    const { data: settings, error: verifyError } = await supabase
      .from('modern_site_settings')
      .select('id, health_library_enabled, active_theme_id')
      .maybeSingle();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      process.exit(1);
    }

    if (!settings) {
      console.log('⚠️  No settings row found. Creating default settings...');
      const { error: insertError } = await supabase
        .from('modern_site_settings')
        .insert({ health_library_enabled: true });

      if (insertError) {
        console.error('❌ Failed to create settings row:', insertError.message);
        process.exit(1);
      }

      console.log('✅ Default settings row created');
    } else {
      console.log('✅ Column verified!');
      console.log(`   Settings ID: ${settings.id}`);
      console.log(`   Health Library Enabled: ${settings.health_library_enabled}`);
      console.log(`   Active Theme ID: ${settings.active_theme_id || 'Not set'}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('   The health_library_enabled column is now available.');
    console.log('   Default value: true (enabled)');
    console.log('\nNext steps:');
    console.log('1. Reload your application');
    console.log('2. Go to Admin > Health Library (Manage Illnesses)');
    console.log('3. Test the "Public Visibility" toggle');
    console.log('4. Verify the Health Library appears/disappears from public navigation\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

applyMigration();
