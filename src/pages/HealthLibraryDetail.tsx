import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { BackButton } from '../components/BackButton';
import { Tag, AlertCircle, Stethoscope } from 'lucide-react';

interface Image {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

interface Category {
  category_name: string;
  slug: string;
}

interface Illness {
  id: string;
  illness_name: string;
  short_summary: string;
  meaning: string | null;
  symptoms: string[];
  management_treatment: string[];
  tags: string[];
  health_library_categories: Category | null;
}

export default function HealthLibraryDetail() {
  const { colors } = useModernTheme();
  const { slug } = useParams<{ slug: string }>();
  const [illness, setIllness] = useState<Illness | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchIllness();
    }
  }, [slug]);

  async function fetchIllness() {
    try {
      const { data: illnessData, error: illnessError } = await supabase
        .from('health_library_illnesses')
        .select(`
          *,
          health_library_categories (
            category_name,
            slug
          )
        `)
        .eq('slug', slug)
        .eq('visibility', 'published')
        .maybeSingle();

      if (illnessError) throw illnessError;

      if (!illnessData) {
        setError(true);
        setLoading(false);
        return;
      }

      setIllness(illnessData);

      const { data: imagesData } = await supabase
        .from('health_library_images')
        .select('*')
        .eq('illness_id', illnessData.id)
        .order('display_order');

      if (imagesData) setImages(imagesData);
    } catch (err) {
      console.error('Error fetching illness:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
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

  if (error || !illness) {
    return (
      <div
        className="min-h-screen py-12 transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4" style={{ color: `hsl(var(--color-text-primary))` }}>Health Information Not Found</h1>
            <p className="mb-8" style={{ color: `hsl(var(--color-text-secondary))` }}>The health information you're looking for doesn't exist or has been removed.</p>
            <div className="flex justify-center">
              <BackButton to="/health-library" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <BackButton to="/health-library" />
        </div>

        {illness.health_library_categories && (
          <div className="mb-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `hsla(var(--color-primary), 0.1)`,
                color: `hsl(var(--color-primary))`,
              }}
            >
              {illness.health_library_categories.category_name}
            </span>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4" style={{ color: `hsl(var(--color-text-primary))` }}>{illness.illness_name}</h1>

        <p className="text-xl mb-8 leading-relaxed" style={{ color: `hsl(var(--color-text-secondary))` }}>
          {illness.short_summary}
        </p>

        {illness.tags && illness.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {illness.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `hsl(var(--color-bg-elevated))`,
                  color: `hsl(var(--color-text-secondary))`,
                }}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {images.length > 0 && (
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {images.map((image) => (
              <div key={image.id} className="rounded-lg overflow-hidden shadow-md">
                <img
                  src={image.image_url}
                  alt={image.alt_text || illness.illness_name}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-lg shadow-md p-8 space-y-8 transition-colors duration-300"
          style={{
            backgroundColor: `hsl(var(--color-bg-surface))`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: `hsl(var(--color-border-default))`,
          }}
        >
          {illness.meaning && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: `hsl(var(--color-text-primary))` }}>
                <Stethoscope className="h-6 w-6 mr-2" style={{ color: `hsl(var(--color-primary))` }} />
                What It Means
              </h2>
              <p className="leading-relaxed" style={{ color: `hsl(var(--color-text-secondary))` }}>{illness.meaning}</p>
            </div>
          )}

          {illness.symptoms && illness.symptoms.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: `hsl(var(--color-text-primary))` }}>
                <AlertCircle className="h-6 w-6 mr-2" style={{ color: `hsl(var(--color-semantic-error))` }} />
                Common Symptoms
              </h2>
              <ul className="space-y-2">
                {illness.symptoms.map((symptom, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: `hsl(var(--color-semantic-error))` }}></span>
                    <span style={{ color: `hsl(var(--color-text-secondary))` }}>{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {illness.management_treatment && illness.management_treatment.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: `hsl(var(--color-text-primary))` }}>
                <Stethoscope className="h-6 w-6 mr-2" style={{ color: `hsl(var(--color-semantic-success))` }} />
                Management & Treatment
              </h2>
              <ul className="space-y-2">
                {illness.management_treatment.map((treatment, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: `hsl(var(--color-semantic-success))` }}></span>
                    <span style={{ color: `hsl(var(--color-text-secondary))` }}>{treatment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="border-l-4 p-4 mt-8"
            style={{
              backgroundColor: `hsla(var(--color-semantic-warning), 0.1)`,
              borderColor: `hsl(var(--color-semantic-warning))`,
            }}
          >
            <p className="text-sm" style={{ color: `hsl(var(--color-text-primary))` }}>
              <strong>Disclaimer:</strong> This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
