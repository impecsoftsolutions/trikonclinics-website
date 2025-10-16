import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function updatePrimaryCtaButton() {
  console.log('Updating modern_themes to add primaryCtaButton...\n');

  // First, get all themes
  const { data: themes, error: listError } = await supabase
    .from('modern_themes')
    .select('id, name, config');

  if (listError) {
    console.error('Error listing themes:', listError);
    return;
  }

  console.log(`Found ${themes.length} themes\n`);

  // Show current state
  console.log('BEFORE UPDATE:');
  themes.forEach(theme => {
    console.log(`- ${theme.name}: primaryCtaButton = ${theme.config.primaryCtaButton ? 'EXISTS' : 'NULL'}`);
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
        console.error(`✗ Error updating ${theme.name}:`, updateError);
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
    .select('name, config->primaryCtaButton as primary_cta_button');

  if (afterError) {
    console.error('Error fetching after state:', afterError);
    return;
  }

  console.log('\nAFTER UPDATE:');
  afterData.forEach(theme => {
    console.log(`- ${theme.name}:`);
    console.log(JSON.stringify(theme.primary_cta_button, null, 2));
  });
}

updatePrimaryCtaButton();
