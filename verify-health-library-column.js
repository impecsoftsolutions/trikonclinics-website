import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function verifyColumn() {
  console.log('🔍 Checking health_library_enabled column...\n');

  try {
    const { data, error } = await supabase
      .from('modern_site_settings')
      .select('id, health_library_enabled, active_theme_id, site_mode')
      .maybeSingle();

    if (error) {
      if (error.code === '42703') {
        console.log('❌ Column health_library_enabled does NOT exist');
        console.log('\n📋 Please run this SQL in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql\n');
        console.log('━'.repeat(80));
        console.log(`-- Add health_library_enabled column to modern_site_settings
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
  ) THEN
    -- Add column with default true and NOT NULL
    ALTER TABLE modern_site_settings
    ADD COLUMN health_library_enabled boolean DEFAULT true NOT NULL;

    RAISE NOTICE 'Column health_library_enabled added successfully with default value true';
  ELSE
    RAISE NOTICE 'Column health_library_enabled already exists';
  END IF;

  -- Ensure there is at least one settings row
  IF NOT EXISTS (SELECT 1 FROM modern_site_settings LIMIT 1) THEN
    INSERT INTO modern_site_settings (health_library_enabled)
    VALUES (true);

    RAISE NOTICE 'Initialized modern_site_settings table with default row';
  ELSE
    -- Update existing rows to ensure they have a value
    UPDATE modern_site_settings
    SET health_library_enabled = COALESCE(health_library_enabled, true)
    WHERE health_library_enabled IS NULL;

    RAISE NOTICE 'Updated existing rows to ensure health_library_enabled has a value';
  END IF;
END $$;`);
        console.log('━'.repeat(80));
        console.log('\nAfter running the SQL, run this script again to verify.\n');
        process.exit(1);
      }

      console.error('❌ Query error:', error.message);
      console.error(error);
      process.exit(1);
    }

    if (!data) {
      console.log('⚠️  No settings row found in modern_site_settings table');
      console.log('   This is unexpected - the table should have at least one row.');
      console.log('\n📋 Please run this SQL to create a settings row:');
      console.log('━'.repeat(80));
      console.log('INSERT INTO modern_site_settings (health_library_enabled)');
      console.log('VALUES (true);');
      console.log('━'.repeat(80));
      process.exit(1);
    }

    console.log('✅ Column health_library_enabled EXISTS!\n');
    console.log('📊 Settings Row Details:');
    console.log('   Settings ID:', data.id);
    console.log('   Health Library Enabled:', data.health_library_enabled);
    console.log('   Active Theme ID:', data.active_theme_id || 'Not set');
    console.log('   Site Mode:', data.site_mode || 'Not set');
    console.log('\n🎉 Migration successful! The column is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Reload your application');
    console.log('2. Check the browser console - errors should be gone');
    console.log('3. Go to Admin > Health Library (Manage Illnesses)');
    console.log('4. Test the "Public Visibility" toggle\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

verifyColumn();
