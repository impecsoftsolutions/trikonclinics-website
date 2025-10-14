import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying migration directly...\n');

  const sql = `
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
  ) THEN
    ALTER TABLE modern_site_settings
    ADD COLUMN health_library_enabled boolean DEFAULT true NOT NULL;
    RAISE NOTICE 'Column health_library_enabled added successfully';
  ELSE
    RAISE NOTICE 'Column health_library_enabled already exists';
  END IF;

  -- Ensure there is at least one settings row
  IF NOT EXISTS (SELECT 1 FROM modern_site_settings LIMIT 1) THEN
    INSERT INTO modern_site_settings (health_library_enabled)
    VALUES (true);
    RAISE NOTICE 'Initialized modern_site_settings table';
  ELSE
    UPDATE modern_site_settings
    SET health_library_enabled = COALESCE(health_library_enabled, true)
    WHERE health_library_enabled IS NULL;
    RAISE NOTICE 'Updated existing rows';
  END IF;
END $$;
`;

  try {
    // Try using the REST API directly with a POST request
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      console.log('❌ Direct REST API approach failed\n');

      // Try alternative: Check if we can use pg_stat_statements or similar
      console.log('🔄 Trying alternative approach with service role...\n');

      // Let's try to add the column using a simpler ALTER TABLE via a stored procedure
      const { error: altError } = await supabase.rpc('exec', { query: sql });

      if (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
        console.log('\n📋 Manual action required:');
        console.log('Please run the SQL in Supabase SQL Editor at:');
        console.log('https://supabase.com/dashboard/project/ztfrjlmkemqjbclaeqfw/sql');
        console.log('\nSQL to run:');
        console.log('━'.repeat(80));
        console.log(sql);
        console.log('━'.repeat(80));
        return;
      }

      console.log('✅ Migration applied successfully!');
    } else {
      console.log('✅ Migration applied via REST API!');
    }

    // Verify
    console.log('\n🔍 Verifying...');
    const { data, error } = await supabase
      .from('modern_site_settings')
      .select('id, health_library_enabled')
      .maybeSingle();

    if (error) {
      console.error('❌ Verification failed:', error.message);
    } else if (data) {
      console.log('✅ Column verified!');
      console.log(`   health_library_enabled: ${data.health_library_enabled}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nPlease apply the migration manually in Supabase SQL Editor.');
  }
}

applyMigration();
