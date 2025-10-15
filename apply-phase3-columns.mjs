import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('==========================================');
console.log('APPLYING PHASE 3 COLUMNS TO EVENTS TABLE');
console.log('==========================================\n');

console.log('This will add the missing columns that prevent EventForm from saving.\n');

const columns = [
  {
    name: 'short_description',
    sql: "ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description text DEFAULT '';"
  },
  {
    name: 'full_description',
    sql: "ALTER TABLE events ADD COLUMN IF NOT EXISTS full_description text DEFAULT '';"
  },
  {
    name: 'event_time',
    sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time time;'
  },
  {
    name: 'venue',
    sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;'
  },
  {
    name: 'highlights',
    sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT ARRAY[]::text[];'
  },
  {
    name: 'updated_by',
    sql: 'ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by uuid;'
  }
];

for (const col of columns) {
  console.log(`Adding column: ${col.name}...`);

  const { error } = await supabase.rpc('exec_sql', { sql_query: col.sql });

  if (error) {
    if (error.message.includes('Could not find the function')) {
      console.log(`  → Using direct alter (exec_sql not available)`);
      // Try alternative method
      const { error: altError } = await supabase
        .from('events')
        .select(col.name)
        .limit(0);

      if (altError && altError.message.includes('does not exist')) {
        console.log(`  ✗ Column missing - needs manual SQL`);
      } else {
        console.log(`  ✓ Column exists`);
      }
    } else {
      console.log(`  Error: ${error.message}`);
    }
  } else {
    console.log(`  ✓ Added successfully`);
  }
}

console.log('\n==========================================');
console.log('CRITICAL: MANUAL ACTION REQUIRED');
console.log('==========================================\n');

console.log('The columns cannot be added automatically because the exec_sql function');
console.log('is not available in your Supabase instance.\n');

console.log('Please run this SQL in the Supabase Dashboard SQL Editor:\n');

console.log('-- Add Phase 3 columns to events table');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description text DEFAULT \'\';');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS full_description text DEFAULT \'\';');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time time;');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS venue text;');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights text[] DEFAULT ARRAY[]::text[];');
console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_by uuid;');
console.log('');
console.log('-- Force schema cache reload');
console.log('COMMENT ON TABLE events IS \'Events table - Phase 3 columns added\';');
console.log('');
console.log('-- Send reload notification to PostgREST');
console.log("NOTIFY pgrst, 'reload schema';");
console.log('\n==========================================');
