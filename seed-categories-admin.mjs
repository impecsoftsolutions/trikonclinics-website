import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);
const categories = [
  { tag_name: 'Health Camps', slug: 'health-camps' },
  { tag_name: 'Awareness Programs', slug: 'awareness-programs' },
  { tag_name: 'Seminars & Workshops', slug: 'seminars-workshops' },
  { tag_name: 'Announcements', slug: 'announcements' },
  { tag_name: 'Community Outreach', slug: 'community-outreach' }
];
console.log('Creating 5 event categories...');
const result = await supabase.from('tags').insert(categories).select();
if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Success! Created categories:');
  result.data.forEach((cat) => {
    console.log('  -', cat.tag_name, '(slug:', cat.slug + ')');
  });
}
