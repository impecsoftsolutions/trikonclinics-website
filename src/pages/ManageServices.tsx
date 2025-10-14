import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
import { Briefcase, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  icon_image: string | null;
  display_order: number;
  is_enabled: boolean;
}

export const ManageServices: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    icon_image: null as string | null,
    display_order: 0,
    is_enabled: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      icon_image: null,
      display_order: 0,
      is_enabled: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setFormData({
      service_name: service.service_name,
      description: service.description || '',
      icon_image: service.icon_image,
      display_order: service.display_order,
      is_enabled: service.is_enabled,
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const serviceData = {
        service_name: formData.service_name,
        description: formData.description,
        icon_image: formData.icon_image,
        display_order: formData.display_order,
        is_enabled: formData.is_enabled,
        added_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Service added successfully!' });
      }

      await loadServices();
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      setMessage({ type: 'error', text: 'Failed to save service' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Service deleted successfully!' });
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setMessage({ type: 'error', text: 'Failed to delete service' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Manage Services</h1>
          </div>
          <p className="text-gray-600">Add and manage medical services</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
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
              {editingId ? 'Edit Service' : 'Add New Service'}
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
              currentImage={formData.icon_image}
              onImageChange={(url) => setFormData({ ...formData, icon_image: url })}
              bucket="services"
              label="Service Icon"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the service offered"
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
                    {editingId ? 'Update' : 'Save'} Service
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  {service.icon_image ? (
                    <img
                      src={service.icon_image}
                      alt={service.service_name}
                      className="w-12 h-12 object-contain"
                    />
                  ) : (
                    <Briefcase className="w-8 h-8 text-blue-600" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{service.service_name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    service.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {service.is_enabled ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No services added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
};
