import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Applying RLS policies for tags table...\n');

const policies = [
  {
    name: 'Enable RLS',
    sql: 'ALTER TABLE tags ENABLE ROW LEVEL SECURITY;'
  },
  {
    name: 'Drop existing read policy',
    sql: 'DROP POLICY IF EXISTS "Allow public read access to tags" ON tags;'
  },
  {
    name: 'Create public read policy',
    sql: 'CREATE POLICY "Allow public read access to tags" ON tags FOR SELECT TO anon, authenticated USING (true);'
  }
];

for (const policy of policies) {
  console.log(`Executing: ${policy.name}`);
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
    if (error) {
      console.log(`  Note: ${error.message}`);
    } else {
      console.log('  Success');
    }
  } catch (e) {
    console.log(`  Skipped (${e.message})`);
  }
}

console.log('\nVerifying categories are accessible with anon key...');

const anonClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await anonClient.from('tags').select('*').order('tag_name');

if (error) {
  console.error('ERROR: Categories still not accessible!', error);
} else {
  console.log(`SUCCESS! Found ${data.length} categories:`);
  data.forEach((cat) => {
    console.log(`  - ${cat.tag_name}`);
  });
}
