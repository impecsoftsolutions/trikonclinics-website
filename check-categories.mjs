import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('tags')
  .select('*')
  .order('tag_name');

console.log('Categories found:', data ? data.length : 0);
if (data) {
  console.log(JSON.stringify(data, null, 2));
}
if (error) {
  console.error('Error:', error);
}
