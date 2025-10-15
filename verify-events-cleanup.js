import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyEventsCleanup() {
  console.log('=== VERIFYING EVENTS CLEANUP ===\n');

  try {
    // Check if events table still exists
    console.log('Checking for events table...');
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (eventsError) {
      if (eventsError.message.includes('does not exist')) {
        console.log('✅ events table: REMOVED\n');
      } else {
        console.log(`⚠️  events table: ${eventsError.message}\n`);
      }
    } else {
      console.log('❌ events table: STILL EXISTS\n');
    }

    // Check site_settings columns
    console.log('Checking site_settings columns...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);

    if (!settingsError && settingsData && settingsData.length > 0) {
      const columns = Object.keys(settingsData[0]);

      const hasEventsEnabled = columns.includes('events_enabled');
      const hasEventsPublicAccess = columns.includes('events_public_access');

      console.log(`${hasEventsEnabled ? '❌' : '✅'} events_enabled column ${hasEventsEnabled ? 'STILL EXISTS' : 'REMOVED'}`);
      console.log(`${hasEventsPublicAccess ? '❌' : '✅'} events_public_access column ${hasEventsPublicAccess ? 'STILL EXISTS' : 'REMOVED'}`);

      console.log('\nRemaining columns in site_settings:', columns.join(', '));
    } else if (settingsError) {
      console.log(`❌ Error checking site_settings: ${settingsError.message}`);
    }

    console.log('\n=== CLEANUP VERIFICATION COMPLETE ===');

  } catch (err) {
    console.error('Error during verification:', err.message);
  }
}

verifyEventsCleanup();
