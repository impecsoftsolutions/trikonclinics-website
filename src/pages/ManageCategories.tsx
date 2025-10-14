import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

interface Category {
  id: string;
  category_name: string;
  slug: string;
  display_order: number;
  is_enabled: boolean;
}

export default function ManageCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    category_name: '',
    slug: '',
    display_order: 0,
    is_enabled: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('health_library_categories')
      .select('*')
      .order('display_order');

    if (data) setCategories(data);
  }

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function openModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category_name: category.category_name,
        slug: category.slug,
        display_order: category.display_order,
        is_enabled: category.is_enabled,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        category_name: '',
        slug: '',
        display_order: categories.length,
        is_enabled: true,
      });
    }
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingCategory) {
      await supabase
        .from('health_library_categories')
        .update(formData)
        .eq('id', editingCategory.id);
    } else {
      await supabase.from('health_library_categories').insert(formData);
    }

    setShowModal(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure? This will unlink all illnesses in this category.')) {
      await supabase.from('health_library_categories').delete().eq('id', id);
      fetchCategories();
    }
  }

  async function toggleEnabled(category: Category) {
    await supabase
      .from('health_library_categories')
      .update({ is_enabled: !category.is_enabled })
      .eq('id', category.id);
    fetchCategories();
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Categories</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.category_name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{category.slug}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.is_enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {category.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{category.display_order}</td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toggleEnabled(category)}
                      className="text-gray-600 hover:text-blue-600"
                      title={category.is_enabled ? 'Disable' : 'Enable'}
                    >
                      {category.is_enabled ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => openModal(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.category_name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category_name: e.target.value,
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

              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="is_enabled" className="ml-2 text-sm font-medium">
                  Enabled (visible to public)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Update' : 'Create'}
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
      )}
    </div>
  );
}
