import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const categories = [
  { tag_name: 'Health Camps', slug: 'health-camps' },
  { tag_name: 'Awareness Programs', slug: 'awareness-programs' },
  { tag_name: 'Seminars & Workshops', slug: 'seminars-workshops' },
  { tag_name: 'Announcements', slug: 'announcements' },
  { tag_name: 'Community Outreach', slug: 'community-outreach' }
];

console.log('Creating 5 event categories...\n');

const { data, error } = await supabase
  .from('tags')
  .insert(categories)
  .select();

if (error) {
  console.error('Error creating categories:', error);
  process.exit(1);
}

console.log('Categories created successfully!');
console.log('\nCreated categories:');
data.forEach((cat, idx) => {
  console.log(`${idx + 1}. ${cat.tag_name} (slug: ${cat.slug})`);
});
