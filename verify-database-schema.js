import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyDatabaseSchema() {
  console.log('=== DATABASE SCHEMA VERIFICATION ===\n');

  try {
    // Check core tables that should exist
    const requiredTables = [
      'users',
      'hospital_profiles',
      'doctors',
      'services',
      'testimonials',
      'modern_themes',
      'categories',
      'illnesses',
      'site_settings'
    ];

    console.log('Checking required tables...\n');

    for (const tableName of requiredTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${tableName}: MISSING or INACCESSIBLE`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ ${tableName}: EXISTS`);

        // Get column info by checking the first row or doing a dummy query
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          console.log(`   Columns: ${columns.join(', ')}\n`);
        } else {
          console.log(`   (empty table)\n`);
        }
      }
    }

    // Check modern_themes specifically for required columns
    console.log('\n=== CHECKING MODERN_THEMES TABLE ===\n');
    const { data: themeData, error: themeError } = await supabase
      .from('modern_themes')
      .select('*')
      .limit(1);

    if (!themeError && themeData) {
      const requiredThemeColumns = [
        'id', 'name', 'is_active', 'colors', 'typography',
        'layout', 'components', 'created_at', 'updated_at'
      ];

      const existingColumns = themeData.length > 0 ? Object.keys(themeData[0]) : [];

      console.log('Required columns for modern_themes:');
      requiredThemeColumns.forEach(col => {
        const exists = existingColumns.includes(col);
        console.log(`${exists ? '✅' : '❌'} ${col}`);
      });

      if (existingColumns.length > 0) {
        console.log('\nAll existing columns:', existingColumns.join(', '));
      }
    }

    // Check site_settings for health_library_enabled
    console.log('\n=== CHECKING SITE_SETTINGS TABLE ===\n');
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);

    if (!settingsError && settingsData) {
      const existingColumns = settingsData.length > 0 ? Object.keys(settingsData[0]) : [];
      console.log('Existing columns:', existingColumns.join(', '));

      const hasHealthLibrary = existingColumns.includes('health_library_enabled');
      console.log(`\n${hasHealthLibrary ? '✅' : '❌'} health_library_enabled column`);
    } else if (settingsError) {
      console.log(`❌ Error: ${settingsError.message}`);
    }

    // Check for any extra tables that might cause issues
    console.log('\n=== CHECKING FOR EVENTS TABLES (should NOT exist) ===\n');
    const eventsTables = ['events', 'event_tags', 'event_registrations'];

    for (const tableName of eventsTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`✅ ${tableName}: DOES NOT EXIST (good - rolled back)`);
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`);
        }
      } else {
        console.log(`❌ ${tableName}: STILL EXISTS (needs cleanup)`);
      }
    }

    console.log('\n=== VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('Error during verification:', err.message);
  }
}

verifyDatabaseSchema();
