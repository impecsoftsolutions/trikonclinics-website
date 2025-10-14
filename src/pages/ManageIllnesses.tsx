import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Globe } from 'lucide-react';

interface Category {
  id: string;
  category_name: string;
}

interface Illness {
  id: string;
  illness_name: string;
  slug: string;
  short_summary: string;
  meaning: string | null;
  symptoms: string[];
  management_treatment: string[];
  category_id: string | null;
  tags: string[];
  visibility: 'draft' | 'published';
  display_order: number;
  health_library_categories?: { category_name: string } | null;
}

export default function ManageIllnesses() {
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIllness, setEditingIllness] = useState<Illness | null>(null);
  const [healthLibraryEnabled, setHealthLibraryEnabled] = useState(false);
  const [formData, setFormData] = useState({
    illness_name: '',
    slug: '',
    short_summary: '',
    meaning: '',
    symptoms: '',
    management_treatment: '',
    category_id: '',
    tags: '',
    visibility: 'draft' as 'draft' | 'published',
    display_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [illnessesRes, categoriesRes, settingsRes] = await Promise.all([
      supabase
        .from('health_library_illnesses')
        .select(`
          *,
          health_library_categories (
            category_name
          )
        `)
        .order('display_order'),
      supabase
        .from('health_library_categories')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order'),
      supabase
        .from('modern_site_settings')
        .select('health_library_enabled')
        .single(),
    ]);

    if (illnessesRes.data) setIllnesses(illnessesRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (settingsRes.data) setHealthLibraryEnabled(settingsRes.data.health_library_enabled || false);
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function openModal(illness?: Illness) {
    if (illness) {
      setEditingIllness(illness);
      setFormData({
        illness_name: illness.illness_name,
        slug: illness.slug,
        short_summary: illness.short_summary,
        meaning: illness.meaning || '',
        symptoms: illness.symptoms.join('\n'),
        management_treatment: illness.management_treatment.join('\n'),
        category_id: illness.category_id || '',
        tags: illness.tags.join(', '),
        visibility: illness.visibility,
        display_order: illness.display_order,
      });
    } else {
      setEditingIllness(null);
      setFormData({
        illness_name: '',
        slug: '',
        short_summary: '',
        meaning: '',
        symptoms: '',
        management_treatment: '',
        category_id: '',
        tags: '',
        visibility: 'draft',
        display_order: illnesses.length,
      });
    }
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const symptomsArray = formData.symptoms
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const treatmentArray = formData.management_treatment
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const tagsArray = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      illness_name: formData.illness_name,
      slug: formData.slug,
      short_summary: formData.short_summary,
      meaning: formData.meaning || null,
      symptoms: symptomsArray,
      management_treatment: treatmentArray,
      category_id: formData.category_id || null,
      tags: tagsArray,
      visibility: formData.visibility,
      display_order: formData.display_order,
    };

    if (editingIllness) {
      await supabase
        .from('health_library_illnesses')
        .update(payload)
        .eq('id', editingIllness.id);
    } else {
      await supabase.from('health_library_illnesses').insert(payload);
    }

    setShowModal(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this illness?')) {
      await supabase.from('health_library_illnesses').delete().eq('id', id);
      fetchData();
    }
  }

  async function toggleVisibility(illness: Illness) {
    await supabase
      .from('health_library_illnesses')
      .update({ visibility: illness.visibility === 'published' ? 'draft' : 'published' })
      .eq('id', illness.id);
    fetchData();
  }

  async function toggleHealthLibraryVisibility() {
    try {
      const { data: settings } = await supabase
        .from('modern_site_settings')
        .select('id')
        .single();

      if (!settings) throw new Error('Settings not found');

      const { error } = await supabase
        .from('modern_site_settings')
        .update({ health_library_enabled: !healthLibraryEnabled })
        .eq('id', settings.id);

      if (error) throw error;

      setHealthLibraryEnabled(!healthLibraryEnabled);
      alert(`Health Library ${!healthLibraryEnabled ? 'enabled' : 'disabled'} for public visitors`);
    } catch (error) {
      console.error('Error toggling health library visibility:', error);
      alert('Failed to update Health Library visibility');
    }
  }

  const filteredIllnesses = illnesses.filter(illness =>
    illness.illness_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    illness.short_summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Illnesses</h1>
          <p className="text-sm text-gray-600 mt-1">Create and manage health library content</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-300 rounded-lg">
            <Globe className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Public Visibility</span>
            <button
              onClick={toggleHealthLibraryVisibility}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                healthLibraryEnabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  healthLibraryEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-semibold ${
              healthLibraryEnabled ? 'text-green-600' : 'text-gray-500'
            }`}>
              {healthLibraryEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Illness
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search illnesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Illness Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredIllnesses.map((illness) => (
              <tr key={illness.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{illness.illness_name}</div>
                  <div className="text-sm text-gray-500">{illness.short_summary.substring(0, 60)}...</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {illness.health_library_categories?.category_name || 'Uncategorized'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      illness.visibility === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {illness.visibility}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{illness.display_order}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleVisibility(illness)}
                      className="text-gray-600 hover:text-blue-600"
                      title={illness.visibility === 'published' ? 'Unpublish' : 'Publish'}
                    >
                      {illness.visibility === 'published' ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openModal(illness)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(illness.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingIllness ? 'Edit Illness' : 'Add New Illness'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Illness Name</label>
                    <input
                      type="text"
                      required
                      value={formData.illness_name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          illness_name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Short Summary</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.short_summary}
                    onChange={(e) => setFormData({ ...formData, short_summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Detailed Meaning</label>
                  <textarea
                    rows={3}
                    value={formData.meaning}
                    onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Symptoms (one per line)</label>
                  <textarea
                    rows={5}
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Headaches&#10;Dizziness&#10;Breathlessness"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Management & Treatment (one per line)</label>
                  <textarea
                    rows={5}
                    value={formData.management_treatment}
                    onChange={(e) => setFormData({ ...formData, management_treatment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Regular BP checks&#10;Salt control&#10;Exercise"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="blood pressure, heart health"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Visibility</label>
                    <select
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'draft' | 'published' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Order</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingIllness ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
