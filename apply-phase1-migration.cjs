require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { Client } = require('pg');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const connectionString = `postgresql://postgres.ztfrjlmkemqjbclaeqfw:${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20251014030000_phase1_database_enhancements.sql',
      'utf8'
    );

    console.log('Applying Phase 1 migration...');
    await client.query(migrationSQL);
    console.log('✅ Phase 1 migration applied successfully!');

    console.log('\nVerifying database objects...');

    const viewsQuery = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE '%events%'
      ORDER BY table_name
    `);
    console.log('Views created:', viewsQuery.rows.map(r => r.table_name));

    const functionsQuery = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%event%'
      ORDER BY routine_name
    `);
    console.log('Functions created:', functionsQuery.rows.map(r => r.routine_name));

    const indexesQuery = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('events', 'event_images', 'event_videos', 'event_error_logs')
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    console.log('Indexes created:', indexesQuery.rows.map(r => r.indexname));

  } catch (error) {
    console.error('Error applying migration:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
