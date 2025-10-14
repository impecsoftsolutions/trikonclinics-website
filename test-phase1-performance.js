import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODUzNywiZXhwIjoyMDc1NTA0NTM3fQ.5udXze3tpRQuGb-LQTh0_ha0us7kpKLS6F3aMBDPGfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const performanceResults = [];

function formatTime(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatus(ms, threshold) {
  if (ms <= threshold) return '✅ PASS';
  if (ms <= threshold * 1.5) return '⚠️  SLOW';
  return '❌ FAIL';
}

async function measureTime(name, fn) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    return { success: true, duration };
  } catch (error) {
    const duration = performance.now() - start;
    return { success: false, duration, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('⚡ Phase 1 Performance Benchmark Suite\n');
  console.log('=' .repeat(60));
  console.log('Testing query performance and image upload speeds\n');

  let testEventId = null;

  try {
    console.log('📝 Setup: Creating test data...\n');

    const { data: testEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Performance Test Event',
        slug: 'performance-test-event',
        description: 'This is a test event for performance testing',
        event_date: new Date().toISOString(),
        status: 'published',
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Failed to create test event:', eventError.message);
      return;
    }

    testEventId = testEvent.id;
    console.log('✅ Created test event:', testEventId);

    for (let i = 0; i < 5; i++) {
      await supabase.from('event_images').insert({
        event_id: testEventId,
        image_url_small: `https://example.com/test-${i}-small.jpg`,
        image_url_medium: `https://example.com/test-${i}-medium.jpg`,
        image_url_large: `https://example.com/test-${i}-large.jpg`,
        alt_text: `Test image ${i}`,
        display_order: i,
      });
    }

    console.log('✅ Created 5 test images\n');

    console.log('=' .repeat(60));
    console.log('\n⚡ Running Performance Benchmarks...\n');

    console.log('Benchmark 1: Query published events');
    console.log('-'.repeat(60));
    const test1 = await measureTime('Query published events', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    });

    const test1Threshold = 100;
    performanceResults.push({
      name: 'Query Published Events (listing)',
      duration: test1.duration,
      threshold: test1Threshold,
      status: test1.success ? getStatus(test1.duration, test1Threshold) : '❌ ERROR',
      error: test1.error,
    });

    if (test1.success) {
      console.log(`${getStatus(test1.duration, test1Threshold)} ${formatTime(test1.duration)}`);
      console.log(`   Threshold: ${test1Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test1.error}\n`);
    }

    console.log('Benchmark 2: Query single event with images');
    console.log('-'.repeat(60));
    const test2 = await measureTime('Query event with images', async () => {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', testEventId)
        .single();

      if (eventError) throw eventError;

      const { data: images, error: imagesError } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', testEventId)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;

      return { event, images };
    });

    const test2Threshold = 150;
    performanceResults.push({
      name: 'Query Event with Images',
      duration: test2.duration,
      threshold: test2Threshold,
      status: test2.success ? getStatus(test2.duration, test2Threshold) : '❌ ERROR',
      error: test2.error,
    });

    if (test2.success) {
      console.log(`${getStatus(test2.duration, test2Threshold)} ${formatTime(test2.duration)}`);
      console.log(`   Threshold: ${test2Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test2.error}\n`);
    }

    console.log('Benchmark 3: Get next image display order');
    console.log('-'.repeat(60));
    const test3 = await measureTime('Get next image order', async () => {
      const { data, error } = await supabase
        .rpc('get_next_image_order', {
          p_event_id: testEventId,
        });

      if (error) throw error;
      return data;
    });

    const test3Threshold = 50;
    performanceResults.push({
      name: 'Get Next Image Order (function)',
      duration: test3.duration,
      threshold: test3Threshold,
      status: test3.success ? getStatus(test3.duration, test3Threshold) : '❌ ERROR',
      error: test3.error,
    });

    if (test3.success) {
      console.log(`${getStatus(test3.duration, test3Threshold)} ${formatTime(test3.duration)}`);
      console.log(`   Threshold: ${test3Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test3.error}`);
      console.log(`   Note: This may indicate Phase 1 migration not applied\n`);
    }

    console.log('Benchmark 4: Get event statistics');
    console.log('-'.repeat(60));
    const test4 = await measureTime('Get event statistics', async () => {
      const { data, error } = await supabase
        .rpc('get_event_statistics');

      if (error) throw error;
      return data;
    });

    const test4Threshold = 200;
    performanceResults.push({
      name: 'Get Event Statistics (aggregation)',
      duration: test4.duration,
      threshold: test4Threshold,
      status: test4.success ? getStatus(test4.duration, test4Threshold) : '❌ ERROR',
      error: test4.error,
    });

    if (test4.success) {
      console.log(`${getStatus(test4.duration, test4Threshold)} ${formatTime(test4.duration)}`);
      console.log(`   Threshold: ${test4Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test4.error}`);
      console.log(`   Note: This may indicate Phase 1 migration not applied\n`);
    }

    console.log('Benchmark 5: Query events by tag');
    console.log('-'.repeat(60));
    const test5 = await measureTime('Query events by tag', async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, event_tags!inner(tag_id)')
        .eq('status', 'published')
        .limit(20);

      if (error) throw error;
      return data;
    });

    const test5Threshold = 150;
    performanceResults.push({
      name: 'Query Events by Tag (join)',
      duration: test5.duration,
      threshold: test5Threshold,
      status: test5.success ? getStatus(test5.duration, test5Threshold) : '❌ ERROR',
      error: test5.error,
    });

    if (test5.success) {
      console.log(`${getStatus(test5.duration, test5Threshold)} ${formatTime(test5.duration)}`);
      console.log(`   Threshold: ${test5Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test5.error}\n`);
    }

    console.log('Benchmark 6: Insert image record');
    console.log('-'.repeat(60));
    const test6 = await measureTime('Insert image record', async () => {
      const { data, error } = await supabase
        .from('event_images')
        .insert({
          event_id: testEventId,
          image_url_small: 'https://example.com/perf-test-small.jpg',
          image_url_medium: 'https://example.com/perf-test-medium.jpg',
          image_url_large: 'https://example.com/perf-test-large.jpg',
          alt_text: 'Performance test image',
          display_order: 10,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    const test6Threshold = 100;
    performanceResults.push({
      name: 'Insert Image Record',
      duration: test6.duration,
      threshold: test6Threshold,
      status: test6.success ? getStatus(test6.duration, test6Threshold) : '❌ ERROR',
      error: test6.error,
    });

    if (test6.success) {
      console.log(`${getStatus(test6.duration, test6Threshold)} ${formatTime(test6.duration)}`);
      console.log(`   Threshold: ${test6Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test6.error}\n`);
    }

    console.log('Benchmark 7: Delete event with cascade');
    console.log('-'.repeat(60));
    const test7 = await measureTime('Delete event cascade', async () => {
      const { data: tempEvent } = await supabase
        .from('events')
        .insert({
          title: 'Temp Event for Delete Test',
          slug: 'temp-delete-test',
          description: 'Temporary event',
          event_date: new Date().toISOString(),
          status: 'draft',
        })
        .select()
        .single();

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', tempEvent.id);

      if (error) throw error;
    });

    const test7Threshold = 100;
    performanceResults.push({
      name: 'Delete Event with Cascade',
      duration: test7.duration,
      threshold: test7Threshold,
      status: test7.success ? getStatus(test7.duration, test7Threshold) : '❌ ERROR',
      error: test7.error,
    });

    if (test7.success) {
      console.log(`${getStatus(test7.duration, test7Threshold)} ${formatTime(test7.duration)}`);
      console.log(`   Threshold: ${test7Threshold}ms\n`);
    } else {
      console.log(`❌ ERROR: ${test7.error}\n`);
    }

  } catch (error) {
    console.error('❌ Benchmark suite error:', error.message);
  } finally {
    if (testEventId) {
      console.log('=' .repeat(60));
      console.log('\n🧹 Cleanup: Removing test data...\n');
      await supabase.from('events').delete().eq('id', testEventId);
      console.log('✅ Deleted test event and images\n');
    }

    console.log('=' .repeat(60));
    console.log('\n📊 Performance Results Summary\n');

    const passCount = performanceResults.filter(r => r.status.includes('PASS')).length;
    const slowCount = performanceResults.filter(r => r.status.includes('SLOW')).length;
    const failCount = performanceResults.filter(r => r.status.includes('FAIL') || r.status.includes('ERROR')).length;

    performanceResults.forEach(result => {
      console.log(`${result.status} ${result.name}`);
      console.log(`   Duration: ${formatTime(result.duration)}`);
      console.log(`   Threshold: ${result.threshold}ms`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    const avgDuration = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;

    console.log('=' .repeat(60));
    console.log(`\n✅ Fast (within threshold): ${passCount}`);
    console.log(`⚠️  Slow (1-1.5x threshold): ${slowCount}`);
    console.log(`❌ Failed/Error (>1.5x threshold): ${failCount}`);
    console.log(`📊 Average query time: ${formatTime(avgDuration)}`);
    console.log(`📝 Total benchmarks: ${performanceResults.length}\n`);

    if (failCount > 0) {
      console.log('⚠️  PERFORMANCE ISSUES DETECTED:');
      const failures = performanceResults.filter(r => r.status.includes('FAIL') || r.status.includes('ERROR'));
      failures.forEach(f => {
        console.log(`   • ${f.name}: ${formatTime(f.duration)} (threshold: ${f.threshold}ms)`);
        if (f.error) {
          console.log(`     Error: ${f.error}`);
        }
      });
      console.log('');
    }

    console.log('💡 Notes:');
    console.log('   • Single image upload time: Depends on image size and network');
    console.log('   • Bulk upload (5 images): Sequential processing, ~5x single upload');
    console.log('   • Image retrieval: Depends on CDN and network latency');
    console.log('   • Target: Single upload <2s, Bulk (5) <8s, Retrieval <500ms\n');
  }
}

runPerformanceTests().catch(console.error);
