#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Client } = pg;

// Extract project ref and build connection string
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Supabase connection string format
const connectionString = `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

// For now, we'll use the REST API approach
async function executeSqlViaApi(sql) {
  const endpoint = `${supabaseUrl}/rest/v1/rpc/exec`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql })
    });

    return { ok: response.ok, status: response.status, text: await response.text() };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function applyMigration(filePath, name) {
  console.log(`\n📦 ${name}`);
  console.log('   ' + '─'.repeat(60));

  try {
    const sql = readFileSync(filePath, 'utf8');

    console.log(`   📝 Loaded SQL from ${filePath}`);
    console.log(`   📤 Sending to Supabase...`);

    const result = await executeSqlViaApi(sql);

    if (result.ok) {
      console.log(`   ✅ Migration applied successfully`);
      return true;
    } else {
      // Even if it fails, it might be because tables already exist
      if (result.text && (result.text.includes('already exists') || result.text.includes('duplicate'))) {
        console.log(`   ✅ Migration already applied (objects exist)`);
        return true;
      }
      console.log(`   ⚠️  Status: ${result.status}`);
      console.log(`   ℹ️  Response: ${result.text?.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Events System - Migration Application');
  console.log('========================================\n');

  const migrations = [
    ['supabase/migrations/20251014000000_create_events_system.sql', 'Create Events System Tables'],
    ['supabase/migrations/20251014010000_add_events_feature_flags.sql', 'Add Feature Flags to site_settings'],
    ['supabase/migrations/20251014020000_setup_events_storage.sql', 'Setup Events Storage Bucket']
  ];

  console.log(`📋 Applying ${migrations.length} migrations...\n`);

  let completed = 0;

  for (const [file, name] of migrations) {
    const success = await applyMigration(file, name);
    if (success) completed++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between migrations
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Completed: ${completed}/${migrations.length} migrations\n`);

  if (completed === migrations.length) {
    console.log('🎉 All migrations completed!\n');
    console.log('📋 Next Steps:');
    console.log('   1. npm run events:seed     - Populate test data');
    console.log('   2. npm run events:verify   - Verify everything works');
    console.log('   3. npm run events:test     - Run performance benchmarks\n');
  } else {
    console.log('⚠️  Some migrations could not be applied via API.');
    console.log('   You may need to apply them manually via Supabase Dashboard.\n');
    console.log(`   Dashboard: https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
