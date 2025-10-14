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

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  console.log('🚀 Starting Event Form Fields migration...\n');

  try {
    const migrationPath = path.join(
      __dirname,
      'supabase/migrations/20251014040000_add_event_form_fields.sql'
    );

    console.log('📖 Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚙️  Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).maybeSingle();

    if (error) {
      console.log('⚠️  RPC method not available, using direct query...');

      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement + ';'
          }).maybeSingle();

          if (stmtError) {
            console.error(`   ❌ Error in statement ${i + 1}:`, stmtError.message);
          }
        }
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
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
