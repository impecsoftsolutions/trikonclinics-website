import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Verifying categories in database...\n');

async function verifyCategories() {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('tag_name');

    if (error) {
      console.error('Error querying tags table:', error);
      return;
    }

    const count = data ? data.length : 0;
    console.log('Total categories found:', count);

    if (data && data.length > 0) {
      console.log('\nCategories in database:\n');
      data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.tag_name} (ID: ${category.id}, Slug: ${category.slug})`);
      });
    } else {
      console.log('\nNo categories found in database!');
    }
  } catch (err) {
    console.error('Exception during verification:', err);
  }
}

verifyCategories();
