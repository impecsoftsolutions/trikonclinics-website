import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDoctorLayout() {
  console.log('\n=== Checking Doctor Layout Configuration ===\n');

  // Get active theme
  const { data: settings, error: settingsError } = await supabase
    .from('modern_site_settings')
    .select('active_theme_id')
    .limit(1)
    .maybeSingle();

  if (settingsError) {
    console.error('Error loading settings:', settingsError);
    return;
  }

  if (!settings || !settings.active_theme_id) {
    console.log('No active theme found');
    return;
  }

  console.log('Active Theme ID:', settings.active_theme_id);

  // Get the active theme
  const { data: theme, error: themeError } = await supabase
    .from('modern_themes')
    .select('*')
    .eq('id', settings.active_theme_id)
    .maybeSingle();

  if (themeError) {
    console.error('Error loading theme:', themeError);
    return;
  }

  if (!theme) {
    console.log('Active theme not found');
    return;
  }

  console.log('Theme Name:', theme.name);
  console.log('Theme Slug:', theme.slug);
  console.log('\n--- Layout Configuration ---');
  console.log('layoutStyle:', theme.config.layoutStyle);
  console.log('\n--- Full layouts object ---');
  console.log(JSON.stringify(theme.config.layouts, null, 2));

  console.log('\n--- Doctors Page Config ---');
  const doctorsConfig = theme.config.layouts?.pages?.doctors;
  if (doctorsConfig) {
    console.log('doctorLayout:', doctorsConfig.doctorLayout);
    console.log('doctorAlignment:', doctorsConfig.doctorAlignment);
    console.log('Full doctors config:', JSON.stringify(doctorsConfig, null, 2));
  } else {
    console.log('No doctors page configuration found');
  }

  console.log('\n=== End Check ===\n');
}

checkDoctorLayout().catch(console.error);
