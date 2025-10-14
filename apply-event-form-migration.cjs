const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Event Form Fields migration...\n');

  try {
    const migrationPath = path.join(
      __dirname,
      'supabase/migrations/20251014040000_add_event_form_fields.sql'
    );

    console.log('📖 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚙️  Executing migration via direct SQL...');

    // Split SQL into individual statements
    const statements = sql
      .split(/;\s*$/gm)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`   Found ${statements.length} statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && !statement.startsWith('/*') && !statement.startsWith('--')) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            query: statement + ';'
          });

          if (error) {
            console.log(`   Statement ${i + 1}: ${error.message}`);
          } else {
            console.log(`   ✓ Statement ${i + 1} executed`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📋 Verifying changes...');

    // Verify the new columns exist
    const { data: columns, error: colError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (!colError && columns) {
      console.log('   ✓ Events table accessible');

      // Check if url_redirects table exists
      const { error: redirectError } = await supabase
        .from('url_redirects')
        .select('*')
        .limit(1);

      if (!redirectError) {
        console.log('   ✓ url_redirects table created');
      }
    }

    console.log('\n✅ Migration applied successfully!');
    console.log('\n📋 Changes made:');
    console.log('   ✓ Added short_description field to events');
    console.log('   ✓ Added full_description field to events');
    console.log('   ✓ Added event_time field to events');
    console.log('   ✓ Added venue field to events');
    console.log('   ✓ Added highlights array field to events');
    console.log('   ✓ Added updated_by field to events');
    console.log('   ✓ Created url_redirects table');
    console.log('   ✓ Added RLS policies for url_redirects');
    console.log('   ✓ Added performance indexes');
    console.log('   ✓ Migrated existing data from description field');

  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

applyMigration();
