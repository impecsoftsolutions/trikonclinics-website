#!/usr/bin/env node
/**
 * Final attempt to apply migrations using Supabase Management API
 */
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('========================================');
console.log('Events Migration - Management API Attempt');
console.log('========================================\n');

// Try the Management API
async function applyViaMgmtApi(sql) {
  // Supabase Management API endpoint
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  try {
    const response = await fetch(mgmtUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.text();
    return { ok: response.ok, status: response.status, body: result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('🔌 Attempting to use Supabase Management API...\n');

  const testSql = 'SELECT 1 as test';
  const result = await applyViaMgmtApi(testSql);

  console.log('Status:', result.status);
  console.log('Response:', result.body?.substring(0, 200));

  if (!result.ok) {
    console.log('\n❌ Management API not accessible with current credentials\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('CONCLUSION: Manual SQL execution required\n');
    console.log(`Please visit: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\nAnd execute the SQL from: CONSOLIDATED-MIGRATION.sql\n');
    console.log('Or copy from the migrations folder:');
    console.log('  1. supabase/migrations/20251014000000_create_events_system.sql');
    console.log('  2. supabase/migrations/20251014010000_add_events_feature_flags.sql');
    console.log('  3. supabase/migrations/20251014020000_setup_events_storage.sql\n');
    console.log('After applying migrations, run:');
    console.log('  npm run events:seed\n');
  } else {
    console.log('\n✅ Management API accessible! Applying migrations...\n');

    const migrations = [
      ['supabase/migrations/20251014000000_create_events_system.sql', 'Create Events Tables'],
      ['supabase/migrations/20251014010000_add_events_feature_flags.sql', 'Add Feature Flags'],
      ['supabase/migrations/20251014020000_setup_events_storage.sql', 'Setup Storage']
    ];

    for (const [file, name] of migrations) {
      console.log(`📦 ${name}...`);
      const sql = readFileSync(file, 'utf8');
      const result = await applyViaMgmtApi(sql);

      if (result.ok) {
        console.log(`   ✅ Success\n`);
      } else {
        console.log(`   ⚠️  ${result.status} - ${result.body?.substring(0, 100)}\n`);
      }
    }
  }
}

main().catch(console.error);
