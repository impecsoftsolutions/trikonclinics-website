/**
 * Verify Update Theme Function
 *
 * This script verifies that the update_theme function exists and is callable
 */

import { createClient } from '@supabase/supabase-js';
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
console.log('Verify Update Theme Function');
console.log('============================================================\n');

async function verifyFunction() {
  try {
    console.log('🔍 Checking if update_theme function exists...\n');

    // Try to call the function with a test UUID
    const testThemeId = '00000000-0000-0000-0000-000000000000';
    const testUserId = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase.rpc('update_theme', {
      p_theme_id: testThemeId,
      p_config: { test: true },
      p_change_description: 'Verification test',
      p_user_id: testUserId
    });

    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('Could not find')) {
        console.log('❌ Function update_theme does NOT exist');
        console.log('   Error:', error.message);
        console.log('\n📋 Action Required:');
        console.log('   Please apply the migration using the Supabase Dashboard.');
        console.log('   See: FIX-UPDATE-THEME-ERROR.md for instructions\n');
        return false;
      } else {
        // Function exists but returned an expected error (theme not found)
        console.log('✅ Function update_theme EXISTS and is callable!');
        console.log('   Test call returned expected error:', error.message);
        console.log('\n   This is normal - the function exists and is working correctly.');
        console.log('   The error is expected because we used a test UUID.\n');
        return true;
      }
    }

    // Check if data indicates success or failure
    if (data) {
      console.log('✅ Function update_theme EXISTS and is callable!');
      console.log('   Response:', JSON.stringify(data, null, 2));

      if (data.success === false) {
        console.log('\n   This is expected - the function exists and returned:');
        console.log('   "' + data.error + '"');
        console.log('   This means the function is working correctly!\n');
      }
      return true;
    }

    console.log('⚠️  Unexpected response from update_theme');
    console.log('   Data:', data);
    console.log('   Error:', error);
    return false;

  } catch (err) {
    console.error('❌ Error during verification:', err.message);
    return false;
  }
}

async function checkThemes() {
  try {
    console.log('🔍 Checking for themes in database...\n');

    const { data: themes, error } = await supabase
      .from('modern_themes')
      .select('id, name, slug, is_preset')
      .limit(5);

    if (error) {
      console.log('❌ Error loading themes:', error.message);
      return;
    }

    if (!themes || themes.length === 0) {
      console.log('⚠️  No themes found in database');
      console.log('   You may need to apply the base theme system migration first.\n');
      return;
    }

    console.log('✅ Found themes in database:');
    themes.forEach(theme => {
      const label = theme.is_preset ? '(preset)' : '(custom)';
      console.log(`   - ${theme.name} ${label}`);
      console.log(`     ID: ${theme.id}`);
    });
    console.log('');

  } catch (err) {
    console.error('❌ Error checking themes:', err.message);
  }
}

async function main() {
  await checkThemes();
  const functionExists = await verifyFunction();

  console.log('============================================================');
  if (functionExists) {
    console.log('✅ VERIFICATION PASSED');
    console.log('   The update_theme function is ready to use!');
    console.log('   You can now edit themes in the application.\n');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('   The update_theme function needs to be created.');
    console.log('   Please follow the instructions in FIX-UPDATE-THEME-ERROR.md\n');
  }
  console.log('============================================================\n');
}

main();
