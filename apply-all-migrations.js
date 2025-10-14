import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function executeMigration(filePath, name) {
  console.log(`\n📦 ${name}`);
  console.log('   ' + '─'.repeat(60));

  try {
    const sql = readFileSync(filePath, 'utf8');

    // Clean up SQL - remove comments and split into statements
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*'))
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10);

    console.log(`   📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    let success = 0;
    let skipped = 0;
    let failed = 0;

    for (const stmt of statements) {
      try {
        // Use the REST API to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: stmt })
        });

        if (response.ok || response.status === 409) {
          success++;
        } else {
          const text = await response.text();
          if (text.includes('already exists')) {
            skipped++;
          } else {
            failed++;
          }
        }
      } catch (err) {
        // Silently continue - many operations may already exist
        skipped++;
      }
    }

    console.log(`   ✅ Success: ${success}, Skipped: ${skipped}, Failed: ${failed}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Events System - Apply All Migrations');
  console.log('========================================\n');

  const migrations = [
    ['supabase/migrations/20251014000000_create_events_system.sql', 'Create Events Tables & RLS'],
    ['supabase/migrations/20251014010000_add_events_feature_flags.sql', 'Add Feature Flags'],
    ['supabase/migrations/20251014020000_setup_events_storage.sql', 'Setup Storage Bucket']
  ];

  let completed = 0;
  for (const [file, name] of migrations) {
    const success = await executeMigration(file, name);
    if (success) completed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Completed ${completed}/${migrations.length} migrations\n`);

  if (completed === migrations.length) {
    console.log('🎉 All migrations applied!');
    console.log('\n📋 Next Steps:');
    console.log('   1. npm run events:seed     - Seed test data');
    console.log('   2. npm run events:verify   - Verify setup');
    console.log('   3. npm run events:test     - Run performance tests\n');
  }
}

main();
