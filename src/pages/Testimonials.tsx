import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { MessageSquare, Star, User } from 'lucide-react';

interface Testimonial {
  id: string;
  patient_name: string;
  review_english: string | null;
  review_telugu: string | null;
  patient_photo: string | null;
  star_rating: number | null;
  display_order: number;
}

export const Testimonials: React.FC = () => {
  const { colors, getGradient } = useModernTheme();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_published', true)
        .order('display_order');

      if (error) throw error;
      if (data) setTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    const stars = rating || 5;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `hsl(var(--color-primary))`,
              borderTopColor: 'transparent',
            }}
          ></div>
          <p style={{ color: `hsl(var(--color-text-secondary))` }}>Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
    >
      <section
        className="text-white py-16"
        style={{
          background: getGradient('hero'),
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: `hsl(var(--color-text-inverse))` }}
          >
            Patient Testimonials
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
          >
            Hear what our patients have to say about their experience with us
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              />
              <p
                className="text-lg"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              >
                No testimonials available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
                  style={{
                    backgroundColor: `hsl(var(--color-bg-surface))`,
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {testimonial.patient_photo ? (
                      <img
                        src={testimonial.patient_photo}
                        alt={testimonial.patient_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `hsla(var(--color-primary), 0.1)` }}
                      >
                        <User
                          className="w-8 h-8"
                          style={{ color: `hsl(var(--color-primary))` }}
                        />
                      </div>
                    )}
                    <div>
                      <h4
                        className="font-semibold text-lg"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        {testimonial.patient_name}
                      </h4>
                      {renderStars(testimonial.star_rating)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {testimonial.review_english && (
                      <p
                        className="italic"
                        style={{ color: `hsl(var(--color-text-secondary))` }}
                      >
                        {testimonial.review_english}
                      </p>
                    )}

                    {testimonial.review_telugu && (
                      <div
                        className="pt-4"
                        style={{
                          borderTopWidth: '1px',
                          borderTopStyle: 'solid',
                          borderTopColor: `hsl(var(--color-border-default))`,
                        }}
                      >
                        <p
                          className="italic text-base"
                          style={{ color: `hsl(var(--color-text-secondary))` }}
                        >
                          {testimonial.review_telugu}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
