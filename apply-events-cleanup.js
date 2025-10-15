import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('=== APPLYING EVENTS CLEANUP MIGRATION ===\n');

  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      './supabase/migrations/20251015030000_remove_events_system.sql',
      'utf-8'
    );

    // Execute the migration
    console.log('Executing migration...\n');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .filter(stmt => {
        const trimmed = stmt.trim();
        return trimmed && !trimmed.startsWith('/*') && !trimmed.startsWith('--');
      });

    // Execute DROP TABLE statements
    console.log('1. Dropping events tables...');
    const { error: dropEventsError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS events CASCADE;'
    });

    if (dropEventsError) {
      console.log(`   Error: ${dropEventsError.message}`);
    } else {
      console.log('   ✅ events table dropped');
    }

    const { error: dropTagsError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS event_tags CASCADE;'
    });

    if (dropTagsError) {
      console.log(`   Error: ${dropTagsError.message}`);
    } else {
      console.log('   ✅ event_tags table dropped');
    }

    const { error: dropRegsError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS event_registrations CASCADE;'
    });

    if (dropRegsError) {
      console.log(`   Error: ${dropRegsError.message}`);
    } else {
      console.log('   ✅ event_registrations table dropped');
    }

    console.log('\n2. Removing events columns from site_settings...');

    // Try using direct ALTER TABLE (requires service role key)
    const { error: dropCol1Error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'site_settings' AND column_name = 'events_enabled'
          ) THEN
            ALTER TABLE site_settings DROP COLUMN events_enabled;
          END IF;
        END $$;
      `
    });

    if (dropCol1Error) {
      console.log(`   Error removing events_enabled: ${dropCol1Error.message}`);
    } else {
      console.log('   ✅ events_enabled column removed');
    }

    const { error: dropCol2Error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'site_settings' AND column_name = 'events_public_access'
          ) THEN
            ALTER TABLE site_settings DROP COLUMN events_public_access;
          END IF;
        END $$;
      `
    });

    if (dropCol2Error) {
      console.log(`   Error removing events_public_access: ${dropCol2Error.message}`);
    } else {
      console.log('   ✅ events_public_access column removed');
    }

    console.log('\n=== MIGRATION COMPLETE ===\n');
    console.log('Run verify-events-cleanup.js to confirm the cleanup.');

  } catch (err) {
    console.error('Error applying migration:', err.message);
  }
}

applyMigration();
