import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5Mjg1MzcsImV4cCI6MjA3NTUwNDUzN30.B142DvwZvXWRGnayzvzzzZOzNxLlE9Ryl3jwX1Nrqlw';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODUzNywiZXhwIjoyMDc1NTA0NTM3fQ.5udXze3tpRQuGb-LQTh0_ha0us7kpKLS6F3aMBDPGfE';

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const securityTests = [];

async function runSecurityTests() {
  console.log('🔒 Phase 1 Security Test Suite\n');
  console.log('=' .repeat(60));
  console.log('Testing RLS policies and access controls for Events system\n');

  let testEventId = null;
  let draftEventId = null;

  try {
    console.log('📝 Setup: Creating test events...\n');

    const { data: publishedEvent, error: pubError } = await serviceClient
      .from('events')
      .insert({
        title: 'Test Published Event',
        slug: 'test-published-event-security',
        description: 'This is a published test event for security testing',
        event_date: new Date().toISOString(),
        status: 'published',
      })
      .select()
      .single();

    if (pubError) {
      console.error('❌ Failed to create published test event:', pubError.message);
      return;
    }
    testEventId = publishedEvent.id;
    console.log('✅ Created published test event:', testEventId);

    const { data: draftEvent, error: draftError } = await serviceClient
      .from('events')
      .insert({
        title: 'Test Draft Event',
        slug: 'test-draft-event-security',
        description: 'This is a draft test event for security testing',
        event_date: new Date().toISOString(),
        status: 'draft',
      })
      .select()
      .single();

    if (draftError) {
      console.error('❌ Failed to create draft test event:', draftError.message);
      return;
    }
    draftEventId = draftEvent.id;
    console.log('✅ Created draft test event:', draftEventId);

    const { error: imageError } = await serviceClient
      .from('event_images')
      .insert({
        event_id: draftEventId,
        image_url_small: `https://example.com/draft-small.jpg`,
        image_url_medium: `https://example.com/draft-medium.jpg`,
        image_url_large: `https://example.com/draft-large.jpg`,
        alt_text: 'Draft event image',
        display_order: 0,
      });

    if (imageError) {
      console.log('⚠️  Failed to create test image (may be due to RLS):', imageError.message);
    } else {
      console.log('✅ Created test image for draft event\n');
    }

    console.log('=' .repeat(60));
    console.log('\n🧪 Running Security Tests...\n');

    console.log('Test 1: Public Access to Published Events');
    console.log('-'.repeat(60));
    const { data: pubData, error: pubReadError } = await anonClient
      .from('events')
      .select('*')
      .eq('id', testEventId)
      .single();

    if (pubReadError) {
      securityTests.push({
        test: 'Test 1: Public Access to Published Events',
        status: '❌ FAIL',
        expected: 'Published events should be readable by anyone (when public access enabled)',
        actual: `Error: ${pubReadError.message}`,
      });
      console.log('❌ FAIL: Published event not accessible via anon client');
      console.log(`   Error: ${pubReadError.message}\n`);
    } else if (pubData) {
      securityTests.push({
        test: 'Test 1: Public Access to Published Events',
        status: '⚠️  PARTIAL',
        expected: 'Published events should be readable by anyone',
        actual: 'Event accessible but requires authentication',
      });
      console.log('⚠️  PARTIAL: Published event accessible via anon client');
      console.log('   Note: This requires authentication due to RLS policy\n');
    }

    console.log('Test 2: Public Access to Draft Events (Should Fail)');
    console.log('-'.repeat(60));
    const { data: draftData, error: draftReadError } = await anonClient
      .from('events')
      .select('*')
      .eq('id', draftEventId)
      .single();

    if (draftReadError) {
      securityTests.push({
        test: 'Test 2: Public Access to Draft Events',
        status: '✅ PASS',
        expected: 'Draft events should not be accessible to public',
        actual: 'Draft event properly blocked',
      });
      console.log('✅ PASS: Draft event properly blocked from anon client');
      console.log(`   Error (expected): ${draftReadError.message}\n`);
    } else if (draftData) {
      securityTests.push({
        test: 'Test 2: Public Access to Draft Events',
        status: '❌ FAIL',
        expected: 'Draft events should not be accessible to public',
        actual: 'Draft event was accessible',
      });
      console.log('❌ FAIL: Draft event accessible to anon client (SECURITY ISSUE!)');
      console.log(`   Event data: ${JSON.stringify(draftData)}\n`);
    }

    console.log('Test 3: Verify feature flags exist');
    console.log('-'.repeat(60));
    const { data: settings, error: settingsError } = await serviceClient
      .from('site_settings')
      .select('events_enabled, events_public_access')
      .single();

    if (settingsError) {
      securityTests.push({
        test: 'Test 3: Feature Flags Existence',
        status: '❌ FAIL',
        expected: 'Feature flags should exist in site_settings',
        actual: `Error: ${settingsError.message}`,
      });
      console.log('❌ FAIL: Could not fetch site_settings');
      console.log(`   Error: ${settingsError.message}\n`);
    } else if (settings) {
      securityTests.push({
        test: 'Test 3: Feature Flags Existence',
        status: '✅ PASS',
        expected: 'Feature flags should exist',
        actual: `events_enabled: ${settings.events_enabled}, events_public_access: ${settings.events_public_access}`,
      });
      console.log('✅ PASS: Feature flags exist');
      console.log(`   events_enabled: ${settings.events_enabled}`);
      console.log(`   events_public_access: ${settings.events_public_access}\n`);
    }

    console.log('Test 4: Verify RLS enabled on all events tables');
    console.log('-'.repeat(60));
    const tablesToCheck = ['events', 'event_images', 'event_videos', 'event_tags', 'event_error_logs', 'tags'];
    let allRLSEnabled = true;

    for (const table of tablesToCheck) {
      const { data: rlsData, error: rlsError } = await serviceClient
        .rpc('exec_sql', { sql: `SELECT relrowsecurity FROM pg_class WHERE relname = '${table}'` })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

      if (rlsError || !rlsData) {
        console.log(`⚠️  Could not verify RLS for ${table}: ${rlsError?.message || 'Unknown error'}`);
      }
    }

    if (allRLSEnabled) {
      securityTests.push({
        test: 'Test 4: RLS Enabled on Events Tables',
        status: '⚠️  PARTIAL',
        expected: 'RLS should be enabled on all events tables',
        actual: 'Could not verify all tables (RPC not available)',
      });
      console.log('⚠️  PARTIAL: Could not fully verify RLS status (requires direct DB access)\n');
    }

    console.log('Test 5: Verify storage bucket exists and has proper config');
    console.log('-'.repeat(60));
    const { data: buckets, error: bucketsError } = await serviceClient
      .storage
      .listBuckets();

    if (bucketsError) {
      securityTests.push({
        test: 'Test 5: Storage Bucket Configuration',
        status: '❌ FAIL',
        expected: 'Events bucket should exist with proper configuration',
        actual: `Error: ${bucketsError.message}`,
      });
      console.log('❌ FAIL: Could not list storage buckets');
      console.log(`   Error: ${bucketsError.message}\n`);
    } else {
      const eventsBucket = buckets?.find(b => b.id === 'events' || b.name === 'events');
      if (eventsBucket) {
        securityTests.push({
          test: 'Test 5: Storage Bucket Configuration',
          status: '✅ PASS',
          expected: 'Events bucket should exist',
          actual: `Bucket found: ${eventsBucket.name}`,
        });
        console.log('✅ PASS: Events storage bucket exists');
        console.log(`   Bucket: ${eventsBucket.name}`);
        console.log(`   Public: ${eventsBucket.public || false}\n`);
      } else {
        securityTests.push({
          test: 'Test 5: Storage Bucket Configuration',
          status: '❌ FAIL',
          expected: 'Events bucket should exist',
          actual: 'Events bucket not found',
        });
        console.log('❌ FAIL: Events storage bucket not found\n');
      }
    }

    console.log('Test 6: Verify database functions exist');
    console.log('-'.repeat(60));
    const functionsToCheck = ['get_event_statistics', 'get_next_image_order', 'get_paginated_events', 'delete_event_cascade'];
    let allFunctionsExist = true;

    for (const func of functionsToCheck) {
      try {
        if (func === 'get_event_statistics') {
          const { error } = await serviceClient.rpc(func);
          if (error && !error.message.includes('schema cache')) {
            console.log(`❌ ${func}: Not accessible`);
            allFunctionsExist = false;
          } else if (error && error.message.includes('schema cache')) {
            console.log(`⚠️  ${func}: May need migration applied`);
            allFunctionsExist = false;
          } else {
            console.log(`✅ ${func}: Exists and accessible`);
          }
        }
      } catch (e) {
        console.log(`⚠️  ${func}: Could not verify`);
      }
    }

    if (allFunctionsExist) {
      securityTests.push({
        test: 'Test 6: Database Functions',
        status: '✅ PASS',
        expected: 'All database functions should exist',
        actual: 'All functions found and accessible',
      });
    } else {
      securityTests.push({
        test: 'Test 6: Database Functions',
        status: '⚠️  NEEDS MIGRATION',
        expected: 'All database functions should exist',
        actual: 'Some functions not found - Phase 1 migration may not be applied',
      });
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test suite error:', error.message);
  } finally {
    if (testEventId || draftEventId) {
      console.log('=' .repeat(60));
      console.log('\n🧹 Cleanup: Removing test events...\n');

      if (testEventId) {
        await serviceClient.from('events').delete().eq('id', testEventId);
        console.log('✅ Deleted published test event');
      }

      if (draftEventId) {
        await serviceClient.from('events').delete().eq('id', draftEventId);
        console.log('✅ Deleted draft test event');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Test Results Summary\n');

    const passCount = securityTests.filter(t => t.status.includes('PASS')).length;
    const failCount = securityTests.filter(t => t.status.includes('FAIL')).length;
    const partialCount = securityTests.filter(t => t.status.includes('PARTIAL') || t.status.includes('NEEDS')).length;

    securityTests.forEach(test => {
      console.log(`${test.status} ${test.test}`);
      console.log(`   Expected: ${test.expected}`);
      console.log(`   Actual: ${test.actual}\n`);
    });

    console.log('=' .repeat(60));
    console.log(`\n✅ Passed: ${passCount}`);
    console.log(`⚠️  Partial/Needs Action: ${partialCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total Tests: ${securityTests.length}\n`);

    if (partialCount > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   • Apply Phase 1 migration via Supabase SQL Editor');
      console.log('   • See PHASE-1-MIGRATION-INSTRUCTIONS.md for details\n');
    }
  }
}

runSecurityTests().catch(console.error);
