import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ImageUpload } from '../components/ImageUpload';
import { MessageSquare, Plus, Edit2, Trash2, Save, X, Loader2, Star } from 'lucide-react';

interface Testimonial {
  id: string;
  patient_name: string;
  review_english: string | null;
  review_telugu: string | null;
  patient_photo: string | null;
  star_rating: number | null;
  display_order: number;
  is_published: boolean;
}

export const ManageTestimonials: React.FC = () => {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    patient_name: '',
    review_english: '',
    review_telugu: '',
    patient_photo: null as string | null,
    star_rating: 5,
    display_order: 0,
    is_published: true,
  });

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patient_name: '',
      review_english: '',
      review_telugu: '',
      patient_photo: null,
      star_rating: 5,
      display_order: 0,
      is_published: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      patient_name: testimonial.patient_name,
      review_english: testimonial.review_english || '',
      review_telugu: testimonial.review_telugu || '',
      patient_photo: testimonial.patient_photo,
      star_rating: testimonial.star_rating || 5,
      display_order: testimonial.display_order,
      is_published: testimonial.is_published,
    });
    setEditingId(testimonial.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const testimonialData = {
        patient_name: formData.patient_name,
        review_english: formData.review_english,
        review_telugu: formData.review_telugu,
        patient_photo: formData.patient_photo,
        star_rating: formData.star_rating,
        display_order: formData.display_order,
        is_published: formData.is_published,
        added_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', editingId);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Testimonial updated successfully!' });
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Testimonial added successfully!' });
      }

      await loadTestimonials();
      resetForm();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      setMessage({ type: 'error', text: 'Failed to save testimonial' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Testimonial deleted successfully!' });
      await loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      setMessage({ type: 'error', text: 'Failed to delete testimonial' });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Manage Testimonials</h1>
          </div>
          <p className="text-gray-600">Add and manage patient testimonials</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Testimonial
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
              {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
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
              currentImage={formData.patient_photo}
              onImageChange={(url) => setFormData({ ...formData, patient_photo: url })}
              bucket="testimonials"
              label="Patient Photo"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Star Rating
                </label>
                <select
                  value={formData.star_rating}
                  onChange={(e) => setFormData({ ...formData, star_rating: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={2}>2 Stars</option>
                  <option value={1}>1 Star</option>
                </select>
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
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publish on website
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (English)
              </label>
              <textarea
                value={formData.review_english}
                onChange={(e) => setFormData({ ...formData, review_english: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the patient's review in English"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Telugu)
              </label>
              <textarea
                value={formData.review_telugu}
                onChange={(e) => setFormData({ ...formData, review_telugu: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the patient's review in Telugu"
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
                    {editingId ? 'Update' : 'Save'} Testimonial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              {testimonial.patient_photo ? (
                <img
                  src={testimonial.patient_photo}
                  alt={testimonial.patient_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {testimonial.patient_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{testimonial.patient_name}</h3>
                {renderStars(testimonial.star_rating || 5)}
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                testimonial.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {testimonial.is_published ? 'Published' : 'Draft'}
              </span>
            </div>

            {testimonial.review_english && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                {testimonial.review_english}
              </p>
            )}

            {testimonial.review_telugu && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2 italic">
                {testimonial.review_telugu}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(testimonial)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(testimonial.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && !showForm && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">No testimonials added yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Testimonial
          </button>
        </div>
      )}
    </div>
  );
};
