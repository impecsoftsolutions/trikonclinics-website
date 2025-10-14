import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { Search, BookOpen, Tag } from 'lucide-react';

interface Category {
  id: string;
  category_name: string;
  slug: string;
}

interface Illness {
  id: string;
  illness_name: string;
  slug: string;
  short_summary: string;
  tags: string[];
  category_id: string;
}

export default function HealthLibrary() {
  const { colors } = useModernTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [illnesses, setIllnesses] = useState<Illness[]>([]);
  const [filteredIllnesses, setFilteredIllnesses] = useState<Illness[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterIllnesses();
  }, [searchTerm, selectedCategory, illnesses]);

  async function fetchData() {
    try {
      const [categoriesRes, illnessesRes] = await Promise.all([
        supabase
          .from('health_library_categories')
          .select('*')
          .eq('is_enabled', true)
          .order('display_order'),
        supabase
          .from('health_library_illnesses')
          .select('*')
          .eq('visibility', 'published')
          .order('display_order')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (illnessesRes.data) setIllnesses(illnessesRes.data);
    } catch (error) {
      console.error('Error fetching health library data:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterIllnesses() {
    let filtered = [...illnesses];

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(illness => illness.category_id === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(illness =>
        illness.illness_name.toLowerCase().includes(term) ||
        illness.short_summary.toLowerCase().includes(term) ||
        illness.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredIllnesses(filtered);
  }

  function getIllnessesByCategory(categoryId: string) {
    return filteredIllnesses.filter(illness => illness.category_id === categoryId);
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderBottomColor: `hsl(var(--color-primary))` }}
        ></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12" style={{ color: `hsl(var(--color-primary))` }} />
          </div>
          <h1 className="text-4xl font-bold mb-4" style={{ color: `hsl(var(--color-text-primary))` }}>Health Library</h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: `hsl(var(--color-text-secondary))` }}>
            Explore our comprehensive collection of health information. Learn about various conditions, their symptoms, and management approaches.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: `hsl(var(--color-text-muted))` }} />
            <input
              type="text"
              placeholder="Search by illness name, symptoms, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:outline-none transition-colors duration-300"
              style={{
                backgroundColor: `hsl(var(--color-bg-surface))`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: `hsl(var(--color-border-default))`,
                color: `hsl(var(--color-text-primary))`,
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                backgroundColor: selectedCategory === 'all' ? `hsl(var(--color-primary))` : `hsl(var(--color-bg-surface))`,
                color: selectedCategory === 'all' ? `hsl(var(--color-text-inverse))` : `hsl(var(--color-text-primary))`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: selectedCategory === 'all' ? `hsl(var(--color-primary))` : `hsl(var(--color-border-default))`,
              }}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
                style={{
                  backgroundColor: selectedCategory === category.id ? `hsl(var(--color-primary))` : `hsl(var(--color-bg-surface))`,
                  color: selectedCategory === category.id ? `hsl(var(--color-text-inverse))` : `hsl(var(--color-text-primary))`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: selectedCategory === category.id ? `hsl(var(--color-primary))` : `hsl(var(--color-border-default))`,
                }}
              >
                {category.category_name}
              </button>
            ))}
          </div>
        </div>

        {filteredIllnesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: `hsl(var(--color-text-muted))` }}>No health information found matching your criteria.</p>
          </div>
        ) : selectedCategory === 'all' ? (
          <div className="space-y-12">
            {categories.map((category) => {
              const categoryIllnesses = getIllnessesByCategory(category.id);
              if (categoryIllnesses.length === 0) return null;

              return (
                <div key={category.id}>
                  <h2 className="text-2xl font-bold mb-6 pb-2 border-b-2" style={{ color: `hsl(var(--color-text-primary))`, borderColor: `hsl(var(--color-primary))` }}>
                    {category.category_name}
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryIllnesses.map((illness) => (
                      <Link
                        key={illness.id}
                        to={`/health-library/${illness.slug}`}
                        className="rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6"
                        style={{
                          backgroundColor: `hsl(var(--color-bg-surface))`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          borderColor: `hsl(var(--color-border-default))`,
                        }}
                      >
                        <h3 className="text-xl font-semibold mb-3" style={{ color: `hsl(var(--color-text-primary))` }}>
                          {illness.illness_name}
                        </h3>
                        <p className="mb-4 line-clamp-3" style={{ color: `hsl(var(--color-text-secondary))` }}>
                          {illness.short_summary}
                        </p>
                        {illness.tags && illness.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {illness.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `hsla(var(--color-primary), 0.1)`,
                                  color: `hsl(var(--color-primary))`,
                                }}
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredIllnesses.map((illness) => (
              <Link
                key={illness.id}
                to={`/health-library/${illness.slug}`}
                className="rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6"
                style={{
                  backgroundColor: `hsl(var(--color-bg-surface))`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `hsl(var(--color-border-default))`,
                }}
              >
                <h3 className="text-xl font-semibold mb-3" style={{ color: `hsl(var(--color-text-primary))` }}>
                  {illness.illness_name}
                </h3>
                <p className="mb-4 line-clamp-3" style={{ color: `hsl(var(--color-text-secondary))` }}>
                  {illness.short_summary}
                </p>
                {illness.tags && illness.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {illness.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `hsla(var(--color-primary), 0.1)`,
                          color: `hsl(var(--color-primary))`,
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
