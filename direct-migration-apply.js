#!/usr/bin/env node
/**
 * Direct PostgreSQL migration application
 * Connects to Supabase database and executes migrations
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const { Client } = pg;

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Extract project details
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference');
  process.exit(1);
}

// Supabase database connection details
// Connection pooler for IPv4 (port 6543)
const dbHost = `aws-0-us-east-1.pooler.supabase.com`;
const dbPort = 6543;
const dbName = 'postgres';
const dbUser = 'postgres';

// For actual password, we need the database password, not the service role key
// The service role key is NOT the database password

console.log('========================================');
console.log('Events System - Database Migration');
console.log('========================================\n');

console.log('ℹ️  Direct PostgreSQL connection requires database password.');
console.log('   The Service Role Key is NOT the database password.\n');

console.log('📋 To get your database password:');
console.log(`   1. Visit: https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('   2. Look for "Database password" section');
console.log('   3. Reset password if needed\n');

console.log('🔧 Connection String Format:');
console.log(`   postgresql://postgres:[YOUR-PASSWORD]@${dbHost}:${dbPort}/${dbName}\n`);

console.log('========================================\n');

console.log('📝 RECOMMENDED APPROACH:\n');
console.log('Since we have the Service Role Key, we can use the Management API.');
console.log('However, Supabase requires manual SQL execution for DDL operations.\n');

console.log('FASTEST SOLUTION:');
console.log(`1. Visit: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('2. Execute this consolidated SQL:\n');
console.log('='.repeat(60));

try {
  const sql1 = readFileSync('supabase/migrations/20251014000000_create_events_system.sql', 'utf8');
  const sql2 = readFileSync('supabase/migrations/20251014010000_add_events_feature_flags.sql', 'utf8');
  const sql3 = readFileSync('supabase/migrations/20251014020000_setup_events_storage.sql', 'utf8');

  const consolidatedSql = `
-- ============================================================
-- EVENTS SYSTEM COMPLETE MIGRATION
-- Execute this entire block in Supabase SQL Editor
-- ============================================================

${sql1}

${sql2}

${sql3}

-- ============================================================
-- MIGRATION COMPLETE
-- Run: npm run events:seed
-- ============================================================
  `.trim();

  console.log(consolidatedSql);
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ After executing the above SQL, run:');
  console.log('   npm run events:seed\n');

} catch (err) {
  console.error('❌ Error reading migration files:', err.message);
  process.exit(1);
}
