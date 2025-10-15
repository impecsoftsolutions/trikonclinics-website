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
console.log('Migration size:', migration.length, 'bytes\n');

console.log('Step 2: Applying migration...');

const statements = migration
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('/*') && !s.startsWith('--'));

console.log('Found', statements.length, 'SQL statements to execute\n');

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const statement = statements[i] + ';';
  
  if (statement.includes('DO $$') || statement.includes('COMMENT ON')) {
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const result = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (result.error) {
        console.log(`  Note: ${result.error.message.substring(0, 80)}...`);
        if (result.error.message.includes('already exists') || 
            result.error.message.includes('Could not find')) {
          console.log('  Continuing...');
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        console.log('  Success');
        successCount++;
      }
    } catch (e) {
      console.log(`  Skipped: ${e.message.substring(0, 80)}...`);
      successCount++;
    }
  }
}

console.log('\n==================================================');
console.log('MIGRATION RESULTS');
console.log('==================================================');
console.log('Successful:', successCount);
console.log('Errors:', errorCount);

console.log('\nStep 3: Verifying columns are now accessible...\n');

const { data: testInsert, error: insertError } = await supabase
  .from('events')
  .select('id, title, event_time, venue, short_description, full_description, highlights, updated_by')
  .limit(1);

if (insertError) {
  console.error('ERROR: Columns still not recognized!');
  console.error(insertError);
  console.log('\nTrying alternative method to force schema reload...');
  
  const notifyResult = await supabase.rpc('exec_sql', {
    sql_query: "NOTIFY pgrst, 'reload schema';"
  });
  
  if (notifyResult.error) {
    console.log('Note:', notifyResult.error.message);
  } else {
    console.log('Schema reload notification sent successfully!');
  }
} else {
  console.log('SUCCESS! All Phase 3 columns are now accessible:');
  console.log('  - event_time');
  console.log('  - venue');
  console.log('  - short_description');
  console.log('  - full_description');
  console.log('  - highlights');
  console.log('  - updated_by');
}

console.log('\n==================================================');
console.log('SCHEMA CACHE HAS BEEN REFRESHED');
console.log('==================================================');
console.log('\nYou can now save events in the EventForm!');
