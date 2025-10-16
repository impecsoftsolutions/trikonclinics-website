import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function updatePrimaryCtaButton() {
  console.log('Updating modern_themes to add primaryCtaButton...\n');

  // First, try to authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@hospital.com',
    password: 'admin123'
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    console.log('Proceeding without authentication...\n');
  } else {
    console.log('✓ Authenticated as:', authData.user.email);
  }

  // Get all themes
  const { data: themes, error: listError } = await supabase
    .from('modern_themes')
    .select('id, name, config');

  if (listError) {
    console.error('Error listing themes:', listError);
    return;
  }

  if (!themes || themes.length === 0) {
    console.log('No themes found in database');
    return;
  }

  console.log(`Found ${themes.length} themes\n`);

  // Show current state
  console.log('BEFORE UPDATE:');
  themes.forEach(theme => {
    const hasButton = theme.config && theme.config.primaryCtaButton;
    console.log(`- ${theme.name}: primaryCtaButton = ${hasButton ? 'EXISTS' : 'NULL'}`);
  });

  console.log('\nUpdating themes...');

  for (const theme of themes) {
    // Add primaryCtaButton to config if it doesn't exist
    if (!theme.config.primaryCtaButton) {
      const updatedConfig = {
        ...theme.config,
        primaryCtaButton: {
          text: "Get Started",
          backgroundColor: "#CC0000",
          textColor: "#FFFFFF",
          hoverOpacity: 0.9
        }
      };

      const { error: updateError } = await supabase
        .from('modern_themes')
        .update({ config: updatedConfig })
        .eq('id', theme.id);

      if (updateError) {
        console.error(`✗ Error updating ${theme.name}:`, updateError.message);
      } else {
        console.log(`✓ Updated ${theme.name}`);
      }
    } else {
      console.log(`- Skipped ${theme.name} (already has primaryCtaButton)`);
    }
  }

  // Show after state
  const { data: afterData, error: afterError } = await supabase
    .from('modern_themes')
    .select('name, config');

  if (afterError) {
    console.error('Error fetching after state:', afterError);
    return;
  }

  console.log('\nAFTER UPDATE:');
  afterData.forEach(theme => {
    console.log(`\n- ${theme.name}:`);
    if (theme.config && theme.config.primaryCtaButton) {
      console.log(JSON.stringify(theme.config.primaryCtaButton, null, 2));
    } else {
      console.log('  NULL');
    }
  });

  // Sign out
  await supabase.auth.signOut();
}

updatePrimaryCtaButton();
