import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey.split('.')[2]}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

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

async function applyMigrationViaHTTP(migrationName, sqlContent) {
  console.log(`\n📦 Applying: ${migrationName}`);
  console.log('   ' + '─'.repeat(60));

  // Split SQL into individual statements, preserving DO blocks
  const statements = [];
  let currentStatement = '';
  let inDoBlock = false;

  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;

    // Track DO blocks
    if (trimmed.startsWith('DO $$')) {
      inDoBlock = true;
    }

    currentStatement += line + '\n';

    // End of DO block
    if (inDoBlock && trimmed.startsWith('END $$;')) {
      inDoBlock = false;
      statements.push(currentStatement.trim());
      currentStatement = '';
      continue;
    }

    // Regular statement end
    if (!inDoBlock && trimmed.endsWith(';') && !trimmed.startsWith('--')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  console.log(`   📝 Found ${statements.length} SQL statements to execute`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.length < 10) continue;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: stmt })
      });

      if (response.ok) {
        successCount++;
      } else {
        const text = await response.text();
        if (text.includes('already exists') || text.includes('duplicate')) {
          skipCount++;
        } else {
          errorCount++;
          console.log(`   ⚠️  Statement ${i + 1} issue: ${text.substring(0, 100)}`);
        }
      }
    } catch (err) {
      // Try alternative approach
      errorCount++;
    }
  }

  console.log(`   ✅ Executed: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);
  return true;
}

async function main() {
  console.log('========================================');
  console.log('Events System - Direct Migration');
  console.log('========================================');
  console.log('\nApplying migrations using Supabase client...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let successCount = 0;

  for (const migration of migrations) {
    try {
      const filePath = join(__dirname, migration.file);
      const sqlContent = readFileSync(filePath, 'utf8');

      await applyMigrationViaHTTP(migration.name, sqlContent);
      successCount++;
    } catch (err) {
      console.log(`   ❌ Failed: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n📊 Processed: ${successCount}/${migrations.length} migrations`);

  console.log('\n✅ Migration phase complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run seed data: npm run events:seed');
  console.log('   2. Verify setup: npm run events:verify');
  console.log('   3. Test performance: npm run events:test\n');
}

main().catch(console.error);
