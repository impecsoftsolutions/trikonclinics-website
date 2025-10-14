import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HospitalProfile {
  id: string;
  name: string;
  about_text: string | null;
  mission: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone_numbers: string[] | null;
  emails: string[] | null;
  working_hours: string | null;
  logo_image: string | null;
  banner_image: string | null;
}

export function useHospitalProfile() {
  const [profile, setProfile] = useState<HospitalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('hospital_profile')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        console.error('Error loading hospital profile:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error loading hospital profile:', err);
      setError('Failed to load hospital profile');
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, refresh: loadProfile };
}
