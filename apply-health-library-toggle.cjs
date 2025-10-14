const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('Applying health_library_enabled column migration...');

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'modern_site_settings' AND column_name = 'health_library_enabled'
          ) THEN
            ALTER TABLE modern_site_settings ADD COLUMN health_library_enabled boolean DEFAULT false;
            RAISE NOTICE 'Column health_library_enabled added successfully';
          ELSE
            RAISE NOTICE 'Column health_library_enabled already exists';
          END IF;
        END $$;
      `
    });

    if (error) {
      console.error('Error executing migration:', error);
      console.log('\nTrying alternative approach...');

      // Alternative: Direct ALTER TABLE
      const { error: altError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE modern_site_settings ADD COLUMN IF NOT EXISTS health_library_enabled boolean DEFAULT false;`
      });

      if (altError) {
        console.error('Alternative approach also failed:', altError);
        process.exit(1);
      }
    }

    console.log('✅ Migration applied successfully!');

    // Verify the column exists
    const { data: settings, error: verifyError } = await supabase
      .from('modern_site_settings')
      .select('health_library_enabled')
      .single();

    if (verifyError) {
      console.error('Verification failed:', verifyError);
    } else {
      console.log('✅ Column verified! Current value:', settings.health_library_enabled);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration();
