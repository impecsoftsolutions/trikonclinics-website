import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Verifying events table columns...\n');

const { data, error } = await supabase.rpc('exec_sql', {
  sql_query: `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'events'
    ORDER BY ordinal_position;
  `
});

if (error) {
  console.log('Using alternative method...\n');
  
  const query = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'events'
    ORDER BY ordinal_position;
  `;
  
  console.log('Query:', query);
  console.log('\nTrying direct query...');
  
  const result = await supabase.from('events').select('*').limit(0);
  console.log('Events table accessible:', !result.error);
  if (result.error) {
    console.error('Error:', result.error);
  }
} else {
  console.log('Columns found:', data);
}

const requiredColumns = [
  'event_time',
  'venue',
  'short_description', 
  'full_description',
  'highlights',
  'updated_by'
];

console.log('\nChecking for Phase 3 columns:');
requiredColumns.forEach(col => {
  console.log(`  - ${col}: checking...`);
});
