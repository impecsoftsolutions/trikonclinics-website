import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const connectionString = 'postgresql://postgres.ztfrjlmkemqjbclaeqfw:Aadya%40123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const client = new Client({ connectionString });

async function applyMigration() {
  try {
    await client.connect();
    console.log('Connected to database');

    const migration = fs.readFileSync(
      'supabase/migrations/20251015000000_fix_tags_rls_public_read.sql',
      'utf8'
    );

    console.log('Applying RLS fix migration...\n');
    await client.query(migration);
    console.log('Migration applied successfully!');

    console.log('\nVerifying tags are now readable...');
    const result = await client.query('SELECT * FROM tags ORDER BY tag_name');
    console.log(`Found ${result.rows.length} categories:`);
    result.rows.forEach((row) => {
      console.log(`  - ${row.tag_name} (slug: ${row.slug})`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

applyMigration();
