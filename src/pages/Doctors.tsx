import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { User, Stethoscope } from 'lucide-react';
import { DoctorCard } from '../components/DoctorCard';

interface Doctor {
  id: string;
  name: string;
  qualification: string | null;
  specialisation: string | null;
  years_of_experience: number;
  expertise_details: string | null;
  photo: string | null;
  display_order: number;
}

export const Doctors: React.FC = () => {
  const { getGradient } = useModernTheme();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order');

      if (error) throw error;
      if (data) setDoctors(data);
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div className="text-center">
          <div
            className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `hsl(var(--color-primary))`,
              borderTopColor: 'transparent',
            }}
          ></div>
          <p
            className="font-medium"
            style={{ color: `hsl(var(--color-text-secondary))` }}
          >
            Loading doctors...
          </p>
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
        className="relative text-white py-20"
        style={{
          background: getGradient('hero'),
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 15L45 22.5L45 37.5L30 45L15 37.5L15 22.5Z' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block mb-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Stethoscope className="w-5 h-5" style={{ color: `hsl(var(--color-text-inverse))` }} />
              <span className="text-sm font-medium" style={{ color: `hsl(var(--color-text-inverse))` }}>
                Medical Professionals
              </span>
            </div>
          </div>
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{ color: `hsl(var(--color-text-inverse))` }}
          >
            Meet Our Doctors
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto font-light"
            style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
          >
            Our team of experienced healthcare professionals dedicated to your well-being
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-16 md:h-24"
            viewBox="0 0 1440 74"
            fill="currentColor"
            style={{ color: `hsl(var(--color-bg-page))` }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 74L60 69.3C120 64.7 240 55.3 360 50.7C480 46 600 46 720 50.7C840 55.3 960 64.7 1080 64.7C1200 64.7 1320 55.3 1380 50.7L1440 46V74H1380C1320 74 1200 74 1080 74C960 74 840 74 720 74C600 74 480 74 360 74C240 74 120 74 60 74H0Z"></path>
          </svg>
        </div>
      </section>

      <section
        className="py-20 relative -mt-1 transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div className="container mx-auto px-4">
          {doctors.length === 0 ? (
            <div
              className="text-center py-20 rounded-3xl shadow-lg transition-colors duration-300"
              style={{ backgroundColor: `hsl(var(--color-bg-surface))` }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: getGradient('primary'),
                }}
              >
                <User className="w-12 h-12 text-white" />
              </div>
              <p
                className="text-xl"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              >
                No doctors available at the moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 max-w-7xl mx-auto">
              {doctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.id}
                  name={doctor.name}
                  qualification={doctor.qualification}
                  specialisation={doctor.specialisation}
                  yearsOfExperience={doctor.years_of_experience}
                  expertiseDetails={doctor.expertise_details}
                  photo={doctor.photo}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
