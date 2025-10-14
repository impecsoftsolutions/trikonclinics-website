require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.ztfrjlmkemqjbclaeqfw:Trikon@2024@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function applyMigration() {
  const client = new Client({ connectionString });

  try {
    console.log('🔍 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20251014030000_phase1_database_enhancements.sql',
      'utf8'
    );

    console.log('📝 Applying Phase 1 migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully!\n');

    console.log('🔍 Verifying database objects...\n');

    const viewsResult = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      AND table_name LIKE '%events%'
      ORDER BY table_name
    `);
    console.log('✅ Views created:');
    viewsResult.rows.forEach(row => console.log(`   - ${row.table_name}`));

    const functionsResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name LIKE '%event%'
      ORDER BY routine_name
    `);
    console.log('\n✅ Functions created:');
    functionsResult.rows.forEach(row => console.log(`   - ${row.routine_name}`));

    const indexesResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN ('events', 'event_images', 'event_videos', 'event_error_logs')
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    console.log('\n✅ Indexes created:');
    indexesResult.rows.forEach(row => console.log(`   - ${row.indexname}`));

    console.log('\n✅ Phase 1 migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
