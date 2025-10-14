#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Client } = pg;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not parse project reference');
  process.exit(1);
}

// Connection info
console.log('========================================');
console.log('Events System - PostgreSQL Direct Connection');
console.log('========================================\n');

console.log('📋 To apply migrations, you have two options:\n');

console.log('OPTION 1: Supabase Dashboard (RECOMMENDED)');
console.log(`  1. Visit: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('  2. Copy the contents of each migration file and execute:');
console.log('     - supabase/migrations/20251014000000_create_events_system.sql');
console.log('     - supabase/migrations/20251014010000_add_events_feature_flags.sql');
console.log('     - supabase/migrations/20251014020000_setup_events_storage.sql\n');

console.log('OPTION 2: Use Supabase CLI (if installed)');
console.log('  npx supabase db push\n');

console.log('========================================\n');

console.log('💡 For your convenience, here is the complete SQL to execute:\n');
console.log('='.repeat(60));
console.log('\n-- Copy everything below this line into Supabase Dashboard SQL Editor\n');
console.log('='.repeat(60));

try {
  const migration1 = readFileSync('supabase/migrations/20251014000000_create_events_system.sql', 'utf8');
  console.log(migration1);
  console.log('\n' + '='.repeat(60) + '\n');

  const migration2 = readFileSync('supabase/migrations/20251014010000_add_events_feature_flags.sql', 'utf8');
  console.log(migration2);
  console.log('\n' + '='.repeat(60) + '\n');

  const migration3 = readFileSync('supabase/migrations/20251014020000_setup_events_storage.sql', 'utf8');
  console.log(migration3);
  console.log('\n' + '='.repeat(60) + '\n');

  console.log('After executing the SQL above:');
  console.log('  npm run events:seed\n');

} catch (err) {
  console.error('❌ Could not read migration files:', err.message);
  process.exit(1);
}
