#!/usr/bin/env node
/**
 * Automatic migration application via Supabase Management API
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('========================================');
console.log('Events System - Auto Migration');
console.log('========================================\n');

// First, let's test if we can reach the database
console.log('🔌 Testing database connection...\n');

const { data: testData, error: testError } = await supabase
  .from('users')
  .select('count')
  .limit(1);

if (testError) {
  console.error('❌ Database connection failed:', testError.message);
  process.exit(1);
}

console.log('✅ Database connection successful\n');

// Now let's try to create a helper function
console.log('📦 Setting up SQL execution helper...\n');

const createHelperFunction = `
CREATE OR REPLACE FUNCTION public.execute_sql(sql_string text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_string;
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;
`;

// We can't create this function directly, so let's just parse and execute individual CREATE TABLE statements
console.log('📋 Parsing migrations into executable statements...\n');

const migrations = [
  'supabase/migrations/20251014000000_create_events_system.sql',
  'supabase/migrations/20251014010000_add_events_feature_flags.sql',
  'supabase/migrations/20251014020000_setup_events_storage.sql'
];

console.log('⚠️  Direct SQL execution not available through Supabase JS client.');
console.log('   Switching to verification mode...\n');

// Let's check if tables already exist
console.log('🔍 Checking for existing tables...\n');

const tablesToCheck = ['tags', 'events', 'event_images', 'event_videos', 'event_tags', 'event_error_logs'];

for (const table of tablesToCheck) {
  const { data, error } = await supabase
    .from(table)
    .select('count')
    .limit(0);

  if (error) {
    console.log(`   ❌ Table "${table}" does not exist`);
  } else {
    console.log(`   ✅ Table "${table}" exists`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📝 NEXT STEPS:\n');
console.log('Since automated migration application is not available,');
console.log('please apply migrations manually:\n');
console.log(`1. Open: https://supabase.com/dashboard/project/${supabaseUrl.match(/([^.]+)\.supabase/)[1]}/sql/new`);
console.log('2. Copy and execute each migration file in order\n');
console.log('OR run: node apply-migrations-pg.js to see the complete SQL\n');
console.log('After migrations are applied, run:');
console.log('  npm run events:seed\n');
