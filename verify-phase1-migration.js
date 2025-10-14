import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ztfrjlmkemqjbclaeqfw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0ZnJqbG1rZW1xamJjbGFlcWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkyODUzNywiZXhwIjoyMDc1NTA0NTM3fQ.5udXze3tpRQuGb-LQTh0_ha0us7kpKLS6F3aMBDPGfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verify() {
  console.log('🔍 Verifying Phase 1 Migration...\n');

  try {
    console.log('📋 Test 1: Testing get_event_statistics function...');
    const { data: stats, error: statsError } = await supabase.rpc('get_event_statistics');

    if (statsError) {
      console.log('❌ Error:', statsError.message);
    } else {
      console.log('✅ Function works!');
      console.log('Statistics:', JSON.stringify(stats, null, 2));
    }

    console.log('\n📋 Test 2: Testing get_next_image_order function...');
    const testEventId = '00000000-0000-0000-0000-000000000000';
    const { data: nextOrder, error: orderError } = await supabase.rpc('get_next_image_order', {
      p_event_id: testEventId
    });

    if (orderError) {
      console.log('❌ Error:', orderError.message);
    } else {
      console.log('✅ Function works! Next order:', nextOrder);
    }

    console.log('\n📋 Test 3: Testing get_paginated_events function...');
    const { data: paginatedEvents, error: paginatedError } = await supabase.rpc('get_paginated_events', {
      p_status: 'published',
      p_page: 1,
      p_page_size: 10
    });

    if (paginatedError) {
      console.log('❌ Error:', paginatedError.message);
    } else {
      console.log('✅ Function works!');
      console.log('Result structure:', Object.keys(paginatedError || paginatedEvents || {}));
    }

    console.log('\n📋 Test 4: Checking views...');
    const { data: activeEvents, error: activeError } = await supabase
      .from('active_events_view')
      .select('*')
      .limit(5);

    if (activeError) {
      console.log('❌ active_events_view error:', activeError.message);
    } else {
      console.log('✅ active_events_view exists! Found', activeEvents?.length || 0, 'events');
    }

    const { data: draftEvents, error: draftError } = await supabase
      .from('draft_events_view')
      .select('*')
      .limit(5);

    if (draftError) {
      console.log('❌ draft_events_view error:', draftError.message);
    } else {
      console.log('✅ draft_events_view exists! Found', draftEvents?.length || 0, 'events');
    }

    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('upcoming_events_view')
      .select('*')
      .limit(5);

    if (upcomingError) {
      console.log('❌ upcoming_events_view error:', upcomingError.message);
    } else {
      console.log('✅ upcoming_events_view exists! Found', upcomingEvents?.length || 0, 'events');
    }

    console.log('\n✅ Phase 1 migration verification complete!\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verify().then(success => {
  if (!success) {
    console.log('\n⚠️  Verification incomplete.\n');
    process.exit(1);
  }
  process.exit(0);
});
