import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, CheckCircle, Activity, Brain } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';
import { HospitalBrandName } from './HospitalBrandName';

interface HeroModernProps {
  hospitalName?: string;
  tagline?: string;
  description?: string;
  bannerImage?: string | null;
  appointmentLink?: string | null;
  phoneNumber?: string | null;
}

export const HeroModern: React.FC<HeroModernProps> = ({
  hospitalName = 'Trikon Clinics',
  tagline = 'Centre for Movement Disorders & Sleep Medicine',
  description = 'Quality Neurological Healthcare with Compassion and Excellence',
  bannerImage,
  appointmentLink,
  phoneNumber,
}) => {
  const { colors, getGradient, layoutTypography, layoutSpacing } = useModernTheme();

  return (
    <section
      className="relative flex items-center overflow-hidden md:min-h-[580px]"
      style={{
        background: getGradient('hero'),
        paddingTop: '0',
        paddingBottom: '0',
      }}
    >
      <div className="relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-5 md:gap-12 md:items-center md:max-w-7xl md:mx-auto md:px-4 sm:md:px-6 lg:md:px-8 md:py-16">
          <div className="md:col-span-3 text-white order-2 md:order-1 px-4 py-8 md:px-0 md:py-0">
            <div className="inline-block mb-5">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Activity className="w-4 h-4 text-white" />
                <span
                  className="text-sm font-medium"
                  style={{ color: `hsl(var(--color-text-inverse))` }}
                >
                  {tagline}
                </span>
              </div>
            </div>

            <h1 className="mb-5 leading-tight text-3xl md:text-4xl lg:text-5xl">
              <HospitalBrandName
                hospitalName={hospitalName}
                accentColor={`hsl(var(--color-accent))`}
                textColor={`hsl(var(--color-text-inverse))`}
                lineHeight="1.3"
              />
            </h1>

            <p
              className="text-lg md:text-xl mb-8"
              style={{
                color: `hsl(var(--color-text-inverse))`,
                lineHeight: '1.6',
                opacity: 0.95,
              }}
            >
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: `hsl(var(--color-accent))`,
                }}
              >
                <Calendar className="w-5 h-5" />
                Book Appointment
              </Link>
            </div>
          </div>

          <div className="md:col-span-2 order-1 md:order-2 w-full">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt={hospitalName}
                className="w-full h-auto md:rounded-xl md:shadow-xl"
                style={{ display: 'block' }}
              />
            ) : (
              <div className="w-full h-64 md:h-80 bg-white/10 backdrop-blur-sm md:rounded-xl flex items-center justify-center">
                <Brain className="w-24 h-24 md:w-32 md:h-32 text-white opacity-40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
