const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Applying health_library_enabled column migration...');

  try {
    // First, check if column exists by trying to query it
    console.log('Checking if column already exists...');
    const { data: testData, error: testError } = await supabase
      .from('modern_site_settings')
      .select('health_library_enabled')
      .limit(1);

    if (!testError) {
      console.log('✅ Column health_library_enabled already exists!');
      console.log('Current value:', testData);
      return;
    }

    if (testError.code === '42703') {
      console.log('Column does not exist. Need to add it via Supabase SQL Editor.');
      console.log('\n📋 MANUAL STEP REQUIRED:');
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log('━'.repeat(60));
      console.log('ALTER TABLE modern_site_settings');
      console.log('ADD COLUMN health_library_enabled boolean DEFAULT false;');
      console.log('━'.repeat(60));
      console.log('\nAfter running the SQL, the toggle will work automatically.');
    } else {
      console.error('Unexpected error:', testError);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

applyMigration();
