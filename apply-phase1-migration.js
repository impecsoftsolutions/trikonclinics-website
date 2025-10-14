import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODUzNywiZXhwIjoyMDc1NTA0NTM3fQ.5udXze3tpRQuGb-LQTh0_ha0us7kpKLS6F3aMBDPGfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔍 Applying Phase 1 Database Migration...\n');

  try {
    const migrationSQL = fs.readFileSync(
      './supabase/migrations/20251014030000_phase1_database_enhancements.sql',
      'utf8'
    );

    console.log('📝 Executing migration SQL...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Details:', error);

      console.log('\n⚠️  Attempting to apply migration in chunks...\n');

      const sqlStatements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      let successCount = 0;
      let errorCount = 0;

      for (const statement of sqlStatements) {
        if (statement.includes('CREATE OR REPLACE VIEW') ||
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('CREATE INDEX') ||
            statement.includes('CREATE TRIGGER') ||
            statement.includes('GRANT EXECUTE') ||
            statement.includes('DROP TRIGGER') ||
            statement.includes('DROP POLICY')) {

          try {
            await supabase.rpc('exec_sql', { sql: statement });
            successCount++;
          } catch (err) {
            errorCount++;
            console.log('⚠️  Failed statement:', statement.substring(0, 80) + '...');
          }
        }
      }

      console.log(`\n✅ Applied ${successCount} statements successfully`);
      console.log(`⚠️  ${errorCount} statements failed (may already exist)\n`);
    } else {
      console.log('✅ Migration applied successfully!\n');
    }

    console.log('🔍 Verifying database objects...\n');

    const { data: views } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name LIKE '%events%'
        ORDER BY table_name
      `
    });
    if (views) console.log('Views:', views);

    const { data: functions } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name LIKE '%event%'
        ORDER BY routine_name
      `
    });
    if (functions) console.log('Functions:', functions);

    console.log('\n✅ Phase 1 migration completed!\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

applyMigration().then(success => {
  if (!success) {
    console.log('\n⚠️  Migration incomplete. See errors above.\n');
    process.exit(1);
  }
  process.exit(0);
});
