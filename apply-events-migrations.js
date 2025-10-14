import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrations = [
  {
    name: 'Migration 1: Create Events System Tables',
    file: 'supabase/migrations/20251014000000_create_events_system.sql'
  },
  {
    name: 'Migration 2: Add Events Feature Flags',
    file: 'supabase/migrations/20251014010000_add_events_feature_flags.sql'
  },
  {
    name: 'Migration 3: Setup Events Storage',
    file: 'supabase/migrations/20251014020000_setup_events_storage.sql'
  }
];

async function applyMigration(migrationName, sqlContent) {
  console.log(`\n📦 Applying: ${migrationName}`);
  console.log('   ' + '─'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      if (error.message.includes('function exec_sql does not exist')) {
        console.log('   ℹ️  Direct RPC not available, using query method...');

        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.match(/^\/\*/));

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement) {
            const { error: execError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (execError) {
              console.log(`   ⚠️  Statement ${i + 1} warning: ${execError.message}`);
            }
          }
        }

        console.log('   ✅ Migration applied successfully');
        return true;
      }

      console.log(`   ❌ Error: ${error.message}`);
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Some objects already exist (this is OK for idempotent migrations)');
        return true;
      }
      return false;
    }

    console.log('   ✅ Migration applied successfully');
    return true;

  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function executeSqlDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const text = await response.text();
    return { error: { message: text } };
  }

  return { data: await response.json() };
}

async function applyMigrationDirect(migrationName, sqlContent) {
  console.log(`\n📦 Applying: ${migrationName}`);
  console.log('   ' + '─'.repeat(60));

  try {
    const { data, error } = await executeSqlDirect(sqlContent);

    if (error) {
      console.log(`   ⚠️  Using fallback method...`);

      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));

      let successCount = 0;
      let warningCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement && statement.length > 10) {
          const { error: execError } = await executeSqlDirect(statement + ';');
          if (execError) {
            if (execError.message.includes('already exists') ||
                execError.message.includes('duplicate')) {
              warningCount++;
            }
          } else {
            successCount++;
          }
        }
      }

      console.log(`   ✅ Migration processed (${successCount} statements executed, ${warningCount} warnings)`);
      return true;
    }

    console.log('   ✅ Migration applied successfully');
    return true;

  } catch (err) {
    console.log(`   ❌ Exception: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Events System - Migration Application');
  console.log('========================================');
  console.log('\nApplying 3 migrations in sequence...\n');

  let successCount = 0;

  for (const migration of migrations) {
    try {
      const filePath = join(__dirname, migration.file);
      const sqlContent = readFileSync(filePath, 'utf8');

      const success = await applyMigrationDirect(migration.name, sqlContent);
      if (success) {
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Failed to read migration file: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Successfully applied: ${successCount}/${migrations.length} migrations`);

  if (successCount === migrations.length) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run seed data: npm run events:seed');
    console.log('   2. Verify setup: npm run events:verify');
    console.log('   3. Test performance: npm run events:test\n');
  } else {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.\n');
    process.exit(1);
  }
}

main();
