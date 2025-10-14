import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
import { User, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  qualification: string;
  specialisation: string;
  years_of_experience: number;
  expertise_details: string;
  photo: string | null;
  display_order: number;
  is_enabled: boolean;
}

export const ManageDoctors: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    qualification: '',
    specialisation: '',
    years_of_experience: 0,
    expertise_details: '',
    photo: null as string | null,
    display_order: 0,
    is_enabled: true,
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      qualification: '',
      specialisation: '',
      years_of_experience: 0,
      expertise_details: '',
      photo: null,
      display_order: 0,
      is_enabled: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (doctor: Doctor) => {
    setFormData({
      name: doctor.name,
      qualification: doctor.qualification || '',
      specialisation: doctor.specialisation || '',
      years_of_experience: doctor.years_of_experience,
      expertise_details: doctor.expertise_details || '',
      photo: doctor.photo,
      display_order: doctor.display_order,
      is_enabled: doctor.is_enabled,
    });
    setEditingId(doctor.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const doctorData = {
        name: formData.name,
        qualification: formData.qualification,
        specialisation: formData.specialisation,
        years_of_experience: formData.years_of_experience,
        expertise_details: formData.expertise_details,
        photo: formData.photo,
        display_order: formData.display_order,
        is_enabled: formData.is_enabled,
        added_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('doctors')
          .update(doctorData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Doctor updated successfully!' });
      } else {
        const { error } = await supabase
          .from('doctors')
          .insert([doctorData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Doctor added successfully!' });
      }

      await loadDoctors();
      resetForm();
    } catch (error) {
      console.error('Error saving doctor:', error);
      setMessage({ type: 'error', text: 'Failed to save doctor' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Doctor deleted successfully!' });
      await loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setMessage({ type: 'error', text: 'Failed to delete doctor' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Manage Doctors</h1>
          </div>
          <p className="text-gray-600">Add and manage doctor profiles</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Doctor
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? 'Edit Doctor' : 'Add New Doctor'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <ImageUpload
              currentImage={formData.photo}
              onImageChange={(url) => setFormData({ ...formData, photo: url })}
              bucket="doctors"
              label="Doctor Photo"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
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
                  Qualification
                </label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MBBS, MD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialisation
                </label>
                <input
                  type="text"
                  value={formData.specialisation}
                  onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Cardiologist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_of_experience}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700">
                  Display on website
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expertise Details
              </label>
              <textarea
                value={formData.expertise_details}
                onChange={(e) => setFormData({ ...formData, expertise_details: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the doctor's expertise and areas of specialization"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update' : 'Save'} Doctor
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              {doctor.photo ? (
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-32 h-32 text-blue-600" />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{doctor.name}</h3>
                  {doctor.qualification && (
                    <p className="text-sm text-gray-600">{doctor.qualification}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doctor.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {doctor.is_enabled ? 'Active' : 'Inactive'}
                </span>
              </div>

              {doctor.specialisation && (
                <p className="text-sm text-gray-600 mb-2">{doctor.specialisation}</p>
              )}

              <p className="text-sm text-gray-500 mb-4">
                {doctor.years_of_experience} years experience
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(doctor)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(doctor.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {doctors.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No doctors added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Doctor
          </button>
        </div>
      )}
    </div>
  );
};
