import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PREDEFINED_TAGS = [
  { tag_name: 'Health Camps', slug: 'health-camps' },
  { tag_name: 'Awareness Programs', slug: 'awareness-programs' },
  { tag_name: 'Seminars & Workshops', slug: 'seminars-workshops' },
  { tag_name: 'Announcements', slug: 'announcements' },
  { tag_name: 'Community Outreach', slug: 'community-outreach' },
];

async function seedTags() {
  console.log('\n🏷️  Seeding tags...');

  for (const tag of PREDEFINED_TAGS) {
    const { data: existing } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tag.slug)
      .maybeSingle();

    if (existing) {
      console.log(`   ✓ Tag "${tag.tag_name}" already exists (slug: ${tag.slug})`);
      continue;
    }

    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) {
      console.error(`   ✗ Failed to create tag "${tag.tag_name}":`, error.message);
    } else {
      console.log(`   ✓ Created tag "${tag.tag_name}" (id: ${data.id})`);
    }
  }

  const { data: allTags } = await supabase
    .from('tags')
    .select('id, tag_name, slug')
    .order('tag_name');

  return allTags || [];
}

async function getFirstAdminUser() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .in('role', ['Super Admin', 'Admin', 'Content Manager'])
    .eq('is_enabled', true)
    .order('created_at')
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.log('   ⚠️  No admin user found. Events will be created without created_by.');
    return null;
  }

  return data.id;
}

async function seedTestEvents(tags, adminUserId) {
  console.log('\n📅 Seeding test events...');

  const events = [
    {
      title: 'Free Health Checkup Camp',
      slug: 'free-health-checkup-camp-2024',
      description: 'We organized a free health checkup camp for the local community. Basic health screenings including blood pressure, blood sugar, and general consultation were provided to over 200 people.',
      event_date: new Date('2024-09-15T09:00:00Z').toISOString(),
      status: 'published',
      is_featured: false,
      created_by: adminUserId,
      images: 1,
      videos: 1,
      tagSlugs: ['health-camps', 'community-outreach'],
    },
    {
      title: 'Diabetes Awareness Mega Event with Multiple Sessions and Community Health Screening',
      slug: 'diabetes-awareness-mega-event-2024',
      description: `Our comprehensive diabetes awareness event was a huge success! We conducted multiple sessions throughout the day including:

- Educational seminars on diabetes prevention and management
- Interactive workshops on healthy cooking and meal planning
- Free blood sugar screening for all attendees
- One-on-one consultations with endocrinologists
- Exercise and yoga demonstrations
- Distribution of educational materials and diet charts

The event was attended by over 500 community members and featured talks by renowned diabetes specialists. We also launched our diabetes support group that will meet monthly to provide ongoing support and education to patients and their families.

Special thanks to all our volunteers, medical staff, and sponsors who made this event possible. Together, we are working towards a healthier community!`,
      event_date: new Date('2024-10-20T08:00:00Z').toISOString(),
      status: 'published',
      is_featured: true,
      created_by: adminUserId,
      images: 25,
      videos: 3,
      tagSlugs: ['awareness-programs', 'seminars-workshops', 'health-camps'],
    },
    {
      title: 'New Advanced Cardiology Department Opening Soon! 🎉 Special Inaugural Offer',
      slug: 'new-cardiology-department-opening-2025',
      description: 'We are excited to announce the opening of our new state-of-the-art Cardiology Department with advanced diagnostic facilities including 3D Echo, Cardiac CT, and 24/7 emergency cardiac care. Grand opening scheduled for Q1 2025.',
      event_date: new Date('2025-01-15T10:00:00Z').toISOString(),
      status: 'draft',
      is_featured: true,
      created_by: adminUserId,
      images: 5,
      videos: 1,
      tagSlugs: ['announcements'],
    },
  ];

  for (const eventData of events) {
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('slug', eventData.slug)
      .maybeSingle();

    if (existing) {
      console.log(`   ✓ Event "${eventData.title.substring(0, 50)}..." already exists`);
      continue;
    }

    const { title, slug, description, event_date, status, is_featured, created_by } = eventData;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title,
        slug,
        description,
        event_date,
        status,
        is_featured,
        created_by,
      })
      .select()
      .single();

    if (eventError) {
      console.error(`   ✗ Failed to create event "${title}":`, eventError.message);
      continue;
    }

    console.log(`   ✓ Created event "${title.substring(0, 50)}..." (status: ${status})`);

    for (let i = 0; i < eventData.images; i++) {
      const { error: imageError } = await supabase
        .from('event_images')
        .insert({
          event_id: event.id,
          image_url_small: `events/${event.id}/images/small/image-${i + 1}.jpg`,
          image_url_medium: `events/${event.id}/images/medium/image-${i + 1}.jpg`,
          image_url_large: `events/${event.id}/images/large/image-${i + 1}.jpg`,
          alt_text: `Event image ${i + 1} for ${title}`,
          display_order: i,
        });

      if (imageError) {
        console.error(`     ✗ Failed to create image ${i + 1}:`, imageError.message);
      }
    }

    console.log(`     ✓ Created ${eventData.images} placeholder image records`);

    for (let i = 0; i < eventData.videos; i++) {
      const videoIds = ['dQw4w9WgXcQ', 'jNQXAC9IVRw', 'y6120QOlsfU'];
      const videoId = videoIds[i % videoIds.length];

      const { error: videoError } = await supabase
        .from('event_videos')
        .insert({
          event_id: event.id,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          youtube_video_id: videoId,
          display_order: i,
        });

      if (videoError) {
        console.error(`     ✗ Failed to create video ${i + 1}:`, videoError.message);
      }
    }

    console.log(`     ✓ Created ${eventData.videos} video records`);

    for (const tagSlug of eventData.tagSlugs) {
      const tag = tags.find(t => t.slug === tagSlug);
      if (tag) {
        const { error: tagError } = await supabase
          .from('event_tags')
          .insert({
            event_id: event.id,
            tag_id: tag.id,
          });

        if (tagError && !tagError.message.includes('duplicate')) {
          console.error(`     ✗ Failed to link tag "${tag.tag_name}":`, tagError.message);
        }
      }
    }

    console.log(`     ✓ Linked ${eventData.tagSlugs.length} tags`);
  }
}

async function verifySeeding() {
  console.log('\n🔍 Verifying seeded data...');

  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .order('tag_name');

  if (tagsError) {
    console.error('   ✗ Failed to fetch tags:', tagsError.message);
  } else {
    console.log(`   ✓ Total tags in database: ${tags.length}`);
  }

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*, event_images(count), event_videos(count), event_tags(count)')
    .order('event_date', { ascending: false });

  if (eventsError) {
    console.error('   ✗ Failed to fetch events:', eventsError.message);
  } else {
    console.log(`   ✓ Total events in database: ${events.length}`);
    events.forEach(event => {
      console.log(`     - ${event.title.substring(0, 50)}...`);
      console.log(`       Status: ${event.status}, Featured: ${event.is_featured}`);
      console.log(`       Images: ${event.event_images[0]?.count || 0}, Videos: ${event.event_videos[0]?.count || 0}, Tags: ${event.event_tags[0]?.count || 0}`);
    });
  }
}

async function main() {
  console.log('========================================');
  console.log('Events & News System - Seed Data Script');
  console.log('========================================');

  try {
    const tags = await seedTags();

    const adminUserId = await getFirstAdminUser();

    await seedTestEvents(tags, adminUserId);

    await verifySeeding();

    console.log('\n✅ Seeding completed successfully!\n');
    console.log('📌 Notes:');
    console.log('   - Image files are NOT created, only database records');
    console.log('   - Actual image files need to be uploaded separately');
    console.log('   - This script is idempotent (safe to run multiple times)');
    console.log('   - Duplicate entries are skipped automatically\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
