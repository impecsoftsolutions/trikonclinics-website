import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
import { Building2, Save, Loader2 } from 'lucide-react';

interface HospitalProfileData {
  id?: string;
  name: string;
  about_text: string;
  mission: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone_numbers: string[];
  emails: string[];
  working_hours: string;
  logo_image: string | null;
  banner_image: string | null;
}

export const HospitalProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<HospitalProfileData>({
    name: '',
    about_text: '',
    mission: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone_numbers: [''],
    emails: [''],
    working_hours: '',
    logo_image: null,
    banner_image: null,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('hospital_profile')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          name: data.name || '',
          about_text: data.about_text || '',
          mission: data.mission || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          phone_numbers: data.phone_numbers || [''],
          emails: data.emails || [''],
          working_hours: data.working_hours || '',
          logo_image: data.logo_image,
          banner_image: data.banner_image,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load hospital profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const profileData = {
        name: formData.name,
        about_text: formData.about_text,
        mission: formData.mission,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone_numbers: formData.phone_numbers.filter(p => p.trim() !== ''),
        emails: formData.emails.filter(e => e.trim() !== ''),
        working_hours: formData.working_hours,
        logo_image: formData.logo_image,
        banner_image: formData.banner_image,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        const { error } = await supabase
          .from('hospital_profile')
          .update(profileData)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hospital_profile')
          .insert([profileData]);

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Hospital profile saved successfully!' });
      await loadProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save hospital profile' });
    } finally {
      setSaving(false);
    }
  };

  const addPhoneNumber = () => {
    setFormData({ ...formData, phone_numbers: [...formData.phone_numbers, ''] });
  };

  const removePhoneNumber = (index: number) => {
    const updated = formData.phone_numbers.filter((_, i) => i !== index);
    setFormData({ ...formData, phone_numbers: updated });
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const updated = [...formData.phone_numbers];
    updated[index] = value;
    setFormData({ ...formData, phone_numbers: updated });
  };

  const addEmail = () => {
    setFormData({ ...formData, emails: [...formData.emails, ''] });
  };

  const removeEmail = (index: number) => {
    const updated = formData.emails.filter((_, i) => i !== index);
    setFormData({ ...formData, emails: updated });
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...formData.emails];
    updated[index] = value;
    setFormData({ ...formData, emails: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hospital profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Hospital Profile</h1>
        </div>
        <p className="text-gray-600">Manage hospital information and branding</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Branding & Images</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              currentImage={formData.logo_image}
              onImageChange={(url) => setFormData({ ...formData, logo_image: url })}
              bucket="hospital-profile"
              label="Hospital Logo"
              required
            />

            <ImageUpload
              currentImage={formData.banner_image}
              onImageChange={(url) => setFormData({ ...formData, banner_image: url })}
              bucket="hospital-profile"
              label="Banner Image"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                About Hospital
              </label>
              <textarea
                value={formData.about_text}
                onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Statement
              </label>
              <textarea
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Address</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Contact Information</h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Phone Numbers</label>
                <button
                  type="button"
                  onClick={addPhoneNumber}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Phone
                </button>
              </div>
              <div className="space-y-2">
                {formData.phone_numbers.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => updatePhoneNumber(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Phone number"
                    />
                    {formData.phone_numbers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneNumber(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Email Addresses</label>
                <button
                  type="button"
                  onClick={addEmail}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Email
                </button>
              </div>
              <div className="space-y-2">
                {formData.emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Email address"
                    />
                    {formData.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
              <input
                type="text"
                value={formData.working_hours}
                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
