import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/BackButton';

const ManageEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    status: 'draft' as 'draft' | 'published'
  });

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const checkSlugUnique = async (slug: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('events')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error checking slug:', error);
      return false;
    }

    return data === null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.event_date) {
      setError('Event date is required');
      return;
    }

    setLoading(true);

    try {
      let slug = generateSlug(formData.title);
      let isUnique = await checkSlugUnique(slug);

      if (!isUnique) {
        slug = `${slug}-${Date.now()}`;
      }

      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          title: formData.title.trim(),
          slug: slug,
          event_date: formData.event_date,
          status: formData.status,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSuccess('Event saved successfully!');

      setTimeout(() => {
        navigate('/admin/events');
      }, 1500);

    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/admin/events" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event title"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
            Event Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              id="event_date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageEvents;
