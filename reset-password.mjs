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

async function resetPassword() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '27abe569-8c24-4aac-9979-d2ab6ec5948b',
    { password: 'TempPassword@123' }
  );

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Password reset successfully!');
  }
}

resetPassword();