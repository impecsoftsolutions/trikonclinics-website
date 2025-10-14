import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';

export const createSuperAdmin = async () => {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'superadmin')
      .maybeSingle();

    if (existingUser) {
      console.log('Super Admin user already exists');
      return { success: true, message: 'Super Admin already exists' };
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: 'superadmin',
        password: hashedPassword,
        email: 'admin@trikonclinics.com',
        role: 'Super Admin',
        is_enabled: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Super Admin:', error);
      return { success: false, error: error.message };
    }

    await supabase.from('activity_logs').insert({
      user_id: data.id,
      action: 'create',
      description: 'Super Admin account created',
      table_affected: 'users',
      record_id: data.id,
    });

    console.log('Super Admin created successfully');
    return { success: true, message: 'Super Admin created successfully', data };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to create Super Admin' };
  }
};
