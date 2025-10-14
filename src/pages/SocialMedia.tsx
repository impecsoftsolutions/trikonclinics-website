import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Share2, Plus, Edit2, Trash2, Save, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

interface SocialMediaPlatform {
  id: string;
  platform_name: string;
  profile_url: string;
  is_enabled: boolean;
  display_order: number;
}

export const SocialMedia: React.FC = () => {
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<SocialMediaPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    platform_name: '',
    profile_url: '',
    is_enabled: true,
    display_order: 0,
  });

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media')
        .select('*')
        .order('display_order');

      if (error) throw error;
      if (data) setPlatforms(data);
    } catch (error) {
      console.error('Error loading platforms:', error);
      setMessage({ type: 'error', text: 'Failed to load social media platforms' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      platform_name: '',
      profile_url: '',
      is_enabled: true,
      display_order: platforms.length,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (platform: SocialMediaPlatform) => {
    setFormData({
      platform_name: platform.platform_name,
      profile_url: platform.profile_url,
      is_enabled: platform.is_enabled,
      display_order: platform.display_order,
    });
    setEditingId(platform.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const platformData = {
        platform_name: formData.platform_name,
        profile_url: formData.profile_url,
        is_enabled: formData.is_enabled,
        display_order: formData.display_order,
        last_updated_by: user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('social_media')
          .update(platformData)
          .eq('id', editingId);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: user?.id,
          action: 'update',
          description: `Updated social media platform: ${formData.platform_name}`,
          table_affected: 'social_media',
          record_id: editingId,
        });

        setMessage({ type: 'success', text: 'Platform updated successfully!' });
      } else {
        const { data, error } = await supabase
          .from('social_media')
          .insert([platformData])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: user?.id,
          action: 'create',
          description: `Added social media platform: ${formData.platform_name}`,
          table_affected: 'social_media',
          record_id: data.id,
        });

        setMessage({ type: 'success', text: 'Platform added successfully!' });
      }

      await loadPlatforms();
      resetForm();
    } catch (error) {
      console.error('Error saving platform:', error);
      setMessage({ type: 'error', text: 'Failed to save platform' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase
        .from('social_media')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: 'delete',
        description: `Deleted social media platform: ${name}`,
        table_affected: 'social_media',
        record_id: id,
      });

      setMessage({ type: 'success', text: 'Platform deleted successfully!' });
      await loadPlatforms();
    } catch (error) {
      console.error('Error deleting platform:', error);
      setMessage({ type: 'error', text: 'Failed to delete platform' });
    }
  };

  const handleToggleEnabled = async (platform: SocialMediaPlatform) => {
    try {
      const { error } = await supabase
        .from('social_media')
        .update({ is_enabled: !platform.is_enabled })
        .eq('id', platform.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        action: 'update',
        description: `${!platform.is_enabled ? 'Enabled' : 'Disabled'} social media platform: ${platform.platform_name}`,
        table_affected: 'social_media',
        record_id: platform.id,
      });

      await loadPlatforms();
    } catch (error) {
      console.error('Error toggling platform:', error);
      setMessage({ type: 'error', text: 'Failed to update platform status' });
    }
  };

  const moveUp = async (platform: SocialMediaPlatform, index: number) => {
    if (index === 0) return;

    const newPlatforms = [...platforms];
    const temp = newPlatforms[index - 1];
    newPlatforms[index - 1] = newPlatforms[index];
    newPlatforms[index] = temp;

    try {
      await supabase
        .from('social_media')
        .update({ display_order: index - 1 })
        .eq('id', platform.id);

      await supabase
        .from('social_media')
        .update({ display_order: index })
        .eq('id', temp.id);

      await loadPlatforms();
    } catch (error) {
      console.error('Error reordering:', error);
      setMessage({ type: 'error', text: 'Failed to reorder platforms' });
    }
  };

  const moveDown = async (platform: SocialMediaPlatform, index: number) => {
    if (index === platforms.length - 1) return;

    const newPlatforms = [...platforms];
    const temp = newPlatforms[index + 1];
    newPlatforms[index + 1] = newPlatforms[index];
    newPlatforms[index] = temp;

    try {
      await supabase
        .from('social_media')
        .update({ display_order: index + 1 })
        .eq('id', platform.id);

      await supabase
        .from('social_media')
        .update({ display_order: index })
        .eq('id', temp.id);

      await loadPlatforms();
    } catch (error) {
      console.error('Error reordering:', error);
      setMessage({ type: 'error', text: 'Failed to reorder platforms' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading social media platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Social Media</h1>
          </div>
          <p className="text-gray-600">Manage social media platform links</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setFormData({
                platform_name: '',
                profile_url: '',
                is_enabled: true,
                display_order: platforms.length,
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Platform
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
              {editingId ? 'Edit Platform' : 'Add New Platform'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.platform_name}
                onChange={(e) => setFormData({ ...formData, platform_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Facebook, Instagram, Twitter, LinkedIn"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Display on website
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
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
                    {editingId ? 'Update' : 'Save'} Platform
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {platforms.length === 0 ? (
          <div className="text-center py-12">
            <Share2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">No social media platforms added yet</p>
            <button
              onClick={() => {
                setFormData({
                  platform_name: '',
                  profile_url: '',
                  is_enabled: true,
                  display_order: 0,
                });
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Platform
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile URL
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {platforms.map((platform, index) => (
                  <tr key={platform.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {platform.platform_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={platform.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 break-all"
                      >
                        {platform.profile_url}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleEnabled(platform)}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          platform.is_enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {platform.is_enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveUp(platform, index)}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 min-w-[2rem] text-center">
                          {index + 1}
                        </span>
                        <button
                          onClick={() => moveDown(platform, index)}
                          disabled={index === platforms.length - 1}
                          className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(platform)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(platform.id, platform.platform_name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
