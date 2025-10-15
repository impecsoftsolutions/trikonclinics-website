import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAndLinkUser() {
  console.log('🚀 Creating Supabase Auth user...');
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@trikonclinics.com',
    password: 'TempPassword@123',
    email_confirm: true
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    return;
  }

  console.log('✅ Auth user created:', authData.user.id);
  
  // Link to database user
  const { error: updateError } = await supabase
    .from('users')
    .update({ auth_user_id: authData.user.id })
    .eq('email', 'admin@trikonclinics.com');

  if (updateError) {
    console.error('❌ Error linking user:', updateError);
    return;
  }

  console.log('✅ User linked successfully!');
  console.log('📧 Email: admin@trikonclinics.com');
  console.log('🔑 Password: TempPassword@123');
}

createAndLinkUser();