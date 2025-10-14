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

const PERFORMANCE_TARGET_MS = 100;

async function measureQuery(name, queryFn) {
  console.log(`\n📊 Testing: ${name}`);

  const startTime = performance.now();
  const result = await queryFn();
  const endTime = performance.now();
  const duration = Math.round(endTime - startTime);

  const status = duration < PERFORMANCE_TARGET_MS ? '✅' : '⚠️';
  const statusText = duration < PERFORMANCE_TARGET_MS ? 'PASS' : 'SLOW';

  console.log(`   ${status} Duration: ${duration}ms (target: <${PERFORMANCE_TARGET_MS}ms) - ${statusText}`);

  if (result.error) {
    console.log(`   ❌ Query Error: ${result.error.message}`);
    return { name, duration, error: result.error.message, passed: false };
  }

  console.log(`   ✓ Rows returned: ${result.data?.length || 0}`);

  return { name, duration, rows: result.data?.length || 0, passed: duration < PERFORMANCE_TARGET_MS };
}

async function testPublishedEventsListing() {
  return await measureQuery(
    'Get published events with pagination (Page 1)',
    async () => {
      return await supabase
        .from('events')
        .select('id, title, slug, event_date, is_featured, created_at')
        .eq('status', 'published')
        .order('event_date', { ascending: false })
        .range(0, 19);
    }
  );
}

async function testSingleEventBySlug() {
  const { data: events } = await supabase
    .from('events')
    .select('slug')
    .limit(1)
    .maybeSingle();

  if (!events) {
    console.log('\n⚠️  No events found for slug test');
    return { name: 'Get single event by slug', duration: 0, passed: true, skipped: true };
  }

  return await measureQuery(
    `Get single event by slug (${events.slug})`,
    async () => {
      return await supabase
        .from('events')
        .select('*')
        .eq('slug', events.slug)
        .maybeSingle();
    }
  );
}

async function testEventWithImages() {
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!events) {
    console.log('\n⚠️  No events found for images test');
    return { name: 'Get event with images', duration: 0, passed: true, skipped: true };
  }

  return await measureQuery(
    'Get event with all images ordered by display_order',
    async () => {
      return await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', events.id)
        .order('display_order');
    }
  );
}

async function testEventWithVideos() {
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!events) {
    console.log('\n⚠️  No events found for videos test');
    return { name: 'Get event with videos', duration: 0, passed: true, skipped: true };
  }

  return await measureQuery(
    'Get event with all videos ordered by display_order',
    async () => {
      return await supabase
        .from('event_videos')
        .select('*')
        .eq('event_id', events.id)
        .order('display_order');
    }
  );
}

async function testEventsByTag() {
  const { data: tags } = await supabase
    .from('tags')
    .select('id, slug')
    .limit(1)
    .maybeSingle();

  if (!tags) {
    console.log('\n⚠️  No tags found for filter test');
    return { name: 'Get events filtered by tag', duration: 0, passed: true, skipped: true };
  }

  return await measureQuery(
    `Get events filtered by tag (${tags.slug})`,
    async () => {
      return await supabase
        .from('event_tags')
        .select(`
          event_id,
          events!inner(
            id,
            title,
            slug,
            event_date,
            status
          )
        `)
        .eq('tag_id', tags.id)
        .eq('events.status', 'published')
        .order('events(event_date)', { ascending: false });
    }
  );
}

async function testFeaturedEvents() {
  return await measureQuery(
    'Get featured published events',
    async () => {
      return await supabase
        .from('events')
        .select('id, title, slug, event_date, is_featured')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('event_date', { ascending: false })
        .limit(10);
    }
  );
}

async function testComplexEventQuery() {
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (!events) {
    console.log('\n⚠️  No events found for complex query test');
    return { name: 'Complex query with relations', duration: 0, passed: true, skipped: true };
  }

  return await measureQuery(
    'Get event with all related data (images, videos, tags)',
    async () => {
      return await supabase
        .from('events')
        .select(`
          *,
          event_images(
            id,
            image_url_small,
            image_url_medium,
            image_url_large,
            alt_text,
            display_order
          ),
          event_videos(
            id,
            youtube_url,
            youtube_video_id,
            display_order
          ),
          event_tags(
            tags(
              id,
              tag_name,
              slug
            )
          )
        `)
        .eq('id', events.id)
        .maybeSingle();
    }
  );
}

async function testIndexUsage() {
  console.log('\n🔍 Checking index usage with EXPLAIN ANALYZE...');
  console.log('   Note: This requires direct PostgreSQL access');
  console.log('   The following queries should use indexes:');
  console.log('   - events(status, event_date DESC) for listing queries');
  console.log('   - events(slug) for slug lookups');
  console.log('   - event_images(event_id, display_order) for gallery ordering');
  console.log('   - event_videos(event_id, display_order) for video ordering');
  console.log('   - event_tags(event_id) and event_tags(tag_id) for filtering');
}

async function verifyIndexes() {
  console.log('\n📋 Verifying indexes exist...');

  const expectedIndexes = [
    'idx_events_status_date',
    'idx_events_slug',
    'idx_events_created_by',
    'idx_events_is_featured',
    'idx_event_images_event_id_order',
    'idx_event_videos_event_id_order',
    'idx_tags_slug',
    'idx_tags_name',
    'idx_event_tags_event_id',
    'idx_event_tags_tag_id',
  ];

  console.log('   Expected indexes:');
  expectedIndexes.forEach(idx => console.log(`   - ${idx}`));
  console.log('   Note: Index verification requires database admin access');
}

async function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('PERFORMANCE TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed && !r.skipped);
  const failed = results.filter(r => !r.passed && !r.skipped);
  const skipped = results.filter(r => r.skipped);

  console.log(`\n✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`⏭️  Skipped: ${skipped.length}`);

  if (failed.length > 0) {
    console.log('\n⚠️  SLOW QUERIES (exceeding target):');
    failed.forEach(result => {
      console.log(`   - ${result.name}: ${result.duration}ms`);
    });
  }

  const avgDuration = results
    .filter(r => !r.skipped)
    .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => !r.skipped).length;

  console.log(`\n📈 Average query time: ${Math.round(avgDuration)}ms`);
  console.log(`🎯 Performance target: <${PERFORMANCE_TARGET_MS}ms per query`);

  if (failed.length === 0) {
    console.log('\n🎉 All performance tests PASSED!');
  } else {
    console.log('\n⚠️  Some queries are slower than target.');
    console.log('   Consider:');
    console.log('   - Checking if all indexes are created properly');
    console.log('   - Running VACUUM ANALYZE on the database');
    console.log('   - Reviewing query plans with EXPLAIN ANALYZE');
    console.log('   - Adding more specific indexes if needed');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  console.log('========================================');
  console.log('Events Performance Benchmark Tests');
  console.log('========================================');
  console.log(`\n🎯 Performance Target: All queries under ${PERFORMANCE_TARGET_MS}ms\n`);

  try {
    const results = [];

    results.push(await testPublishedEventsListing());
    results.push(await testSingleEventBySlug());
    results.push(await testEventWithImages());
    results.push(await testEventWithVideos());
    results.push(await testEventsByTag());
    results.push(await testFeaturedEvents());
    results.push(await testComplexEventQuery());

    await testIndexUsage();
    await verifyIndexes();

    await printSummary(results);

  } catch (error) {
    console.error('\n❌ Performance tests failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
