const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Removing dark mode from all themes...');

    // Step 1: Get all themes
    const { data: themes, error: fetchError } = await supabase
      .from('modern_themes')
      .select('id, name, config');

    if (fetchError) {
      console.error('❌ Failed to fetch themes:', fetchError.message);
      process.exit(1);
    }

    console.log(`   Found ${themes.length} themes to update`);

    // Step 2: Update each theme to remove dark colors
    for (const theme of themes) {
      const config = theme.config;

      if (config.colors && config.colors.dark) {
        // Replace colors object with just light mode colors
        config.colors = config.colors.light;
      }

      if (config.layouts?.navigation?.enableThemeModeToggle !== undefined) {
        delete config.layouts.navigation.enableThemeModeToggle;
      }

      const { error: updateError } = await supabase
        .from('modern_themes')
        .update({
          config: config,
          config_hash: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', theme.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${theme.name}:`, updateError.message);
      } else {
        console.log(`   ✅ Updated ${theme.name}`);
      }
    }

    // Step 3: Update config hashes
    for (const theme of themes) {
      const configStr = JSON.stringify(theme.config);
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(configStr).digest('hex');

      await supabase
        .from('modern_themes')
        .update({ config_hash: hash })
        .eq('id', theme.id);
    }

    // Step 4: Update site settings
    const { error: settingsError } = await supabase
      .from('modern_site_settings')
      .update({
        site_mode: 'light',
        updated_at: new Date().toISOString()
      })
      .not('id', 'is', null);

    if (settingsError) {
      console.error('   ❌ Failed to update site settings:', settingsError.message);
    } else {
      console.log('   ✅ Updated site settings to light mode');
    }

    // Step 5: Update theme_hash to force reload
    const { data: settings } = await supabase
      .from('modern_site_settings')
      .select('active_theme_id')
      .limit(1)
      .single();

    if (settings?.active_theme_id) {
      const { data: activeTheme } = await supabase
        .from('modern_themes')
        .select('config_hash')
        .eq('id', settings.active_theme_id)
        .single();

      if (activeTheme) {
        await supabase
          .from('modern_site_settings')
          .update({ theme_hash: activeTheme.config_hash })
          .not('id', 'is', null);
        console.log('   ✅ Updated theme hash to force cache refresh');
      }
    }

    console.log('');
    console.log('✅ Dark mode removal completed successfully');
    console.log('✨ All themes now locked to light mode only');
    console.log('🏥 Appropriate for medical/healthcare websites');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();
