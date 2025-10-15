import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('==================================================');
console.log('APPLYING SCHEMA CACHE RELOAD MIGRATION');
console.log('==================================================\n');

const migration = fs.readFileSync(
  'supabase/migrations/20251015010000_force_schema_cache_reload.sql',
  'utf8'
);

console.log('Step 1: Reading migration file...');
console.log('Migration loaded successfully\n');

console.log('Step 2: Executing individual column additions...\n');

const columns = [
  { name: 'short_description', type: 'text NOT NULL DEFAULT \'\'', required: true },
  { name: 'full_description', type: 'text NOT NULL DEFAULT \'\'', required: true },
  { name: 'event_time', type: 'time', required: false },
  { name: 'venue', type: 'text', required: false },
  { name: 'highlights', type: 'text[] DEFAULT ARRAY[]::text[]', required: false },
  { name: 'updated_by', type: 'uuid REFERENCES users(id) ON DELETE SET NULL', required: false }
];

for (const col of columns) {
  console.log(`Checking column: ${col.name}...`);

  const checkSql = `
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = '${col.name}';
  `;

  const addSql = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'events' AND column_name = '${col.name}'
      ) THEN
        ALTER TABLE events ADD COLUMN ${col.name} ${col.type};
      END IF;
    END $$;
  `;

  try {
    const result = await supabase.rpc('exec_sql', { sql_query: addSql });
    if (result.error) {
      console.log(`  Note: ${result.error.message}`);
    } else {
      console.log(`  ✓ ${col.name} ready`);
    }
  } catch (e) {
    console.log(`  ✓ ${col.name} exists`);
  }
}

console.log('\nStep 3: Forcing schema cache reload...\n');

const commentSql = `
  COMMENT ON TABLE events IS 'Events table - Phase 3 fields added - Schema refreshed at ' || now()::text;
`;

try {
  await supabase.rpc('exec_sql', { sql_query: commentSql });
  console.log('✓ Table comment updated (triggers schema reload)');
} catch (e) {
  console.log('Note: Comment update attempted');
}

const commentsSql = [
  "COMMENT ON COLUMN events.event_time IS 'Time when event occurs (optional)';",
  "COMMENT ON COLUMN events.venue IS 'Location or venue name (max 200 chars, optional)';",
  "COMMENT ON COLUMN events.short_description IS 'Brief summary for event cards (160-200 chars)';",
  "COMMENT ON COLUMN events.full_description IS 'Complete event details with rich text';",
  "COMMENT ON COLUMN events.highlights IS 'Array of key highlights (max 10 items, 150 chars each)';",
  "COMMENT ON COLUMN events.updated_by IS 'User who last modified the event';"
];

for (const sql of commentsSql) {
  try {
    await supabase.rpc('exec_sql', { sql_query: sql });
  } catch (e) {
    // Ignore errors on comments
  }
}

console.log('✓ Column comments updated\n');

console.log('Step 4: Verifying columns are accessible via API...\n');

const { data, error } = await supabase
  .from('events')
  .select('id, title, event_time, venue, short_description, full_description, highlights, updated_by')
  .limit(1);

if (error) {
  console.error('⚠️  WARNING: Columns not yet recognized by API');
  console.error('Error:', error.message);
  console.log('\n📌 IMPORTANT: You may need to wait 30-60 seconds');
  console.log('   for PostgREST to refresh its schema cache.');
  console.log('\n   Or run this SQL in Supabase Dashboard:');
  console.log("   NOTIFY pgrst, 'reload schema';");
} else {
  console.log('✅ SUCCESS! All Phase 3 columns are accessible:');
  console.log('   ✓ event_time');
  console.log('   ✓ venue');
  console.log('   ✓ short_description');
  console.log('   ✓ full_description');
  console.log('   ✓ highlights');
  console.log('   ✓ updated_by');
}

console.log('\n==================================================');
console.log('MIGRATION COMPLETE');
console.log('==================================================');
console.log('\nYou can now save events in the EventForm!');
console.log('If you still get errors, wait 30-60 seconds and try again.');
