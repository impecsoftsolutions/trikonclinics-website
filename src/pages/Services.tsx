import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { Heart, Stethoscope } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  icon_image: string | null;
  display_order: number;
}

export const Services: React.FC = () => {
  const { colors, getGradient } = useModernTheme();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (!loading && services.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [loading, services]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order');

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `hsl(var(--color-primary))`,
              borderTopColor: 'transparent',
            }}
          ></div>
          <p style={{ color: `hsl(var(--color-text-secondary))` }}>Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <section
        className="text-white py-20"
        style={{
          background: getGradient('hero'),
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: `hsl(var(--color-text-inverse))` }}
          >
            Our Services
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
          >
            Comprehensive healthcare services tailored to your needs
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              />
              <p
                className="text-lg"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              >
                No services available at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  id={`service-${service.id}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer scroll-mt-24"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full h-64 md:w-60 md:h-60 lg:w-[280px] lg:h-[280px] flex-shrink-0">
                      {service.icon_image ? (
                        <img
                          src={service.icon_image}
                          alt={service.service_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, hsla(var(--color-primary), 0.8), hsla(var(--color-primary), 0.5))`,
                          }}
                        >
                          <Heart className="w-20 h-20 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-8 md:p-10">
                      <h3
                        className="text-2xl md:text-3xl font-bold mb-4"
                        style={{ color: '#1E6FBA' }}
                      >
                        {service.service_name}
                      </h3>
                      {service.description && (
                        <p
                          className="text-lg leading-relaxed"
                          style={{ color: `hsl(var(--color-text-secondary))` }}
                        >
                          {service.description}
                        </p>
                      )}
                    </div>
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
