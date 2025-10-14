#!/usr/bin/env node
/**
 * This script manually applies the events system migrations by executing
 * the SQL through the Supabase connection pool.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Pool } = pg;

// Create a connection to Supabase Postgres
// Note: This requires the DATABASE_URL or postgres connection string
const projectRef = process.env.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from VITE_SUPABASE_URL');
  process.exit(1);
}

console.log('========================================');
console.log('Events System - Direct SQL Execution');
console.log('========================================\n');

console.log('ℹ️  This script requires direct database access.');
console.log('   Since the JS client cannot execute DDL directly,');
console.log('   we need to use the Supabase Dashboard SQL Editor.\n');

console.log('📋 MANUAL MIGRATION STEPS:\n');

console.log('1️⃣  Open Supabase Dashboard:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);

console.log('2️⃣  Copy and execute Migration 1:');
console.log(`   File: supabase/migrations/20251014000000_create_events_system.sql`);
console.log('   This creates: tags, events, event_images, event_videos, event_tags tables\n');

console.log('3️⃣  Copy and execute Migration 2:');
console.log(`   File: supabase/migrations/20251014010000_add_events_feature_flags.sql`);
console.log('   This adds: events_enabled, events_public_access flags\n');

console.log('4️⃣  Copy and execute Migration 3:');
console.log(`   File: supabase/migrations/20251014020000_setup_events_storage.sql`);
console.log('   This creates: events storage bucket and policies\n');

console.log('5️⃣  After applying migrations, run:');
console.log('   npm run events:seed\n');

console.log('========================================\n');

// Alternative: Show the SQL content
console.log('📄 OR copy the SQL below and execute in Dashboard:\n');
console.log('='.repeat(60));

try {
  const migration1 = readFileSync('supabase/migrations/20251014000000_create_events_system.sql', 'utf8');
  const migration2 = readFileSync('supabase/migrations/20251014010000_add_events_feature_flags.sql', 'utf8');
  const migration3 = readFileSync('supabase/migrations/20251014020000_setup_events_storage.sql', 'utf8');

  console.log('\n-- MIGRATION 1: Create Events System Tables');
  console.log(migration1);
  console.log('\n-- MIGRATION 2: Add Feature Flags');
  console.log(migration2);
  console.log('\n-- MIGRATION 3: Setup Storage');
  console.log(migration3);
} catch (err) {
  console.log('Could not read migration files:', err.message);
}
