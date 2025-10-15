import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
const { data, error } = await supabase.from('tags').select('*').order('tag_name');
console.log('Categories found:', data ? data.length : 0);
if (data) {
  data.forEach((cat) => {
    console.log('  -', cat.tag_name, '(slug:', cat.slug + ')');
  });
}
if (error) console.error('Error:', error);
