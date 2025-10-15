import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

console.log('Fixing RLS policies for tags table...\n');

const sql = `
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to tags" ON tags;
DROP POLICY IF EXISTS "Allow authenticated users to read tags" ON tags;

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to read tags
CREATE POLICY "Allow public read access to tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users with content management role to insert/update/delete
CREATE POLICY "Content managers can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'content_manager')
    )
  );
`;

const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

if (error) {
  console.error('Error fixing RLS policies:', error);
  console.log('\nTrying alternative approach...\n');
  
  const queries = [
    "ALTER TABLE tags ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS \"Allow public read access to tags\" ON tags;",
    "CREATE POLICY \"Allow public read access to tags\" ON tags FOR SELECT TO anon, authenticated USING (true);"
  ];
  
  for (const query of queries) {
    console.log('Executing:', query);
    const result = await supabase.rpc('exec_sql', { sql_query: query });
    if (result.error) {
      console.error('Error:', result.error.message);
    } else {
      console.log('Success!');
    }
  }
} else {
  console.log('RLS policies updated successfully!');
}

console.log('\nVerifying categories are now accessible...');
const { data, error: readError } = await supabase.from('tags').select('*');
console.log('Categories readable:', data ? data.length : 0);
if (readError) {
  console.error('Still cannot read:', readError);
}
