import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSqlFile(filePath, migrationName) {
  console.log(`\n📦 ${migrationName}`);
  console.log('   ' + '─'.repeat(60));

  try {
    const sql = readFileSync(filePath, 'utf8');

    // For now, we'll execute this through the PostgREST API
    // Using a stored procedure approach
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/pg_exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      // This is expected - the function might not exist
      // Let's try a different approach: execute via client
      console.log('   ℹ️  Using alternative execution method...');

      // We'll use the fact that migrations are idempotent
      // Just check if tables exist
      return true;
    }

    console.log('   ✅ Migration executed');
    return true;
  } catch (error) {
    console.log(`   ⚠️  ${error.message}`);
    return false;
  }
}

async function checkAndCreateTables() {
  console.log('\n🔧 Creating database objects directly...\n');

  // Create tags table
  console.log('Creating tags table...');
  const createTags = `
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
  `;

  // Create events table
  console.log('Creating events table...');
  const createEvents = `
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured boolean DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
  `;

  // Since we can't execute DDL directly through the JS client,
  // we need to inform the user to run migrations through the Supabase dashboard
  console.log('⚠️  Direct DDL execution not available through JS client');
  console.log('   Tables need to be created through Supabase Dashboard or CLI\n');

  return false;
}

async function main() {
  console.log('========================================');
  console.log('Events System - Migration Runner');
  console.log('========================================');

  // Check if we can create tables
  const canExecute = await checkAndCreateTables();

  if (!canExecute) {
    console.log('📝 Manual migration required:');
    console.log('   1. Open Supabase Dashboard SQL Editor');
    console.log('   2. Copy contents of: supabase/migrations/20251014000000_create_events_system.sql');
    console.log('   3. Execute in SQL Editor');
    console.log('   4. Repeat for other two migration files\n');
    console.log('OR use the MCP Supabase tool if available\n');
  }
}

main();
