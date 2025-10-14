import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Phone, Save, Loader2, Plus, X } from 'lucide-react';

interface ContactData {
  id?: string;
  address: string;
  phone_numbers: string[];
  email_addresses: string[];
  working_hours: string;
  appointment_booking_link: string;
  google_maps_code: string;
}

export const ContactInfo: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<ContactData>({
    address: '',
    phone_numbers: [''],
    email_addresses: [''],
    working_hours: '',
    appointment_booking_link: '',
    google_maps_code: '',
  });

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_information')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          address: data.address || '',
          phone_numbers: data.phone_numbers && data.phone_numbers.length > 0 ? data.phone_numbers : [''],
          email_addresses: data.email_addresses && data.email_addresses.length > 0 ? data.email_addresses : [''],
          working_hours: data.working_hours || '',
          appointment_booking_link: data.appointment_booking_link || '',
          google_maps_code: data.google_maps_code || '',
        });
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
      setMessage({ type: 'error', text: 'Failed to load contact information' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const contactData = {
        address: formData.address,
        phone_numbers: formData.phone_numbers.filter(p => p.trim() !== ''),
        email_addresses: formData.email_addresses.filter(e => e.trim() !== ''),
        working_hours: formData.working_hours,
        appointment_booking_link: formData.appointment_booking_link,
        google_maps_code: formData.google_maps_code,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (formData.id) {
        const { error } = await supabase
          .from('contact_information')
          .update(contactData)
          .eq('id', formData.id);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: user?.id,
          action: 'update',
          description: `Updated contact information`,
          table_affected: 'contact_information',
          record_id: formData.id,
        });
      } else {
        const { data, error } = await supabase
          .from('contact_information')
          .insert([contactData])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: user?.id,
          action: 'create',
          description: `Created contact information`,
          table_affected: 'contact_information',
          record_id: data.id,
        });
      }

      setMessage({ type: 'success', text: 'Contact information saved successfully!' });
      await loadContactInfo();
    } catch (error) {
      console.error('Error saving contact info:', error);
      setMessage({ type: 'error', text: 'Failed to save contact information' });
    } finally {
      setSaving(false);
    }
  };

  const addPhoneNumber = () => {
    setFormData({ ...formData, phone_numbers: [...formData.phone_numbers, ''] });
  };

  const removePhoneNumber = (index: number) => {
    const updated = formData.phone_numbers.filter((_, i) => i !== index);
    setFormData({ ...formData, phone_numbers: updated.length > 0 ? updated : [''] });
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const updated = [...formData.phone_numbers];
    updated[index] = value;
    setFormData({ ...formData, phone_numbers: updated });
  };

  const addEmail = () => {
    setFormData({ ...formData, email_addresses: [...formData.email_addresses, ''] });
  };

  const removeEmail = (index: number) => {
    const updated = formData.email_addresses.filter((_, i) => i !== index);
    setFormData({ ...formData, email_addresses: updated.length > 0 ? updated : [''] });
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...formData.email_addresses];
    updated[index] = value;
    setFormData({ ...formData, email_addresses: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contact information...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Phone className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Contact Information</h1>
        </div>
        <p className="text-gray-600">Manage hospital contact details and location</p>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Address</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complete Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter the full hospital address"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Phone Numbers</h2>
          <div className="space-y-3">
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
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addPhoneNumber}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Another Phone Number
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Email Addresses</h2>
          <div className="space-y-3">
            {formData.email_addresses.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email address"
                />
                {formData.email_addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(index)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmail}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Another Email Address
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Hours
              </label>
              <input
                type="text"
                value={formData.working_hours}
                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM, Sunday: Closed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Booking Link
              </label>
              <input
                type="url"
                value={formData.appointment_booking_link}
                onChange={(e) => setFormData({ ...formData, appointment_booking_link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Maps Embed Code
              </label>
              <textarea
                value={formData.google_maps_code}
                onChange={(e) => setFormData({ ...formData, google_maps_code: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste the Google Maps embed iframe code here"
              />
              <p className="text-sm text-gray-500 mt-1">
                Get embed code from Google Maps by clicking Share → Embed a map
              </p>
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
                Save Contact Information
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
