import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';
import { HospitalBrandName } from './HospitalBrandName';

interface HeroMinimalProps {
  hospitalName?: string;
  tagline?: string;
  description?: string;
  appointmentLink?: string | null;
}

export const HeroMinimal: React.FC<HeroMinimalProps> = ({
  hospitalName = 'Trikon Clinics',
  tagline = 'Centre for Movement Disorders & Sleep Medicine',
  description = 'Quality Neurological Healthcare with Compassion and Excellence',
  appointmentLink,
}) => {
  const { colors, layoutTypography, layoutSpacing } = useModernTheme();

  return (
    <section
      className="relative flex items-center overflow-hidden transition-colors duration-300 md:min-h-[600px]"
      style={{
        backgroundColor: `hsl(var(--color-bg-surface))`,
        paddingTop: '0',
        paddingBottom: '0',
      }}
    >
      <div className="relative w-full">
        <div className="md:max-w-4xl md:mx-auto px-4 py-12 sm:px-6 lg:px-8 md:py-16 text-center">
          <div className="inline-block mb-6">
            <p
              className="text-sm font-light tracking-wide uppercase"
              style={{
                color: `hsl(var(--color-text-secondary))`,
                letterSpacing: '0.1em',
              }}
            >
              {tagline}
            </p>
          </div>

          <h1 className="mb-8 leading-tight text-5xl md:text-6xl lg:text-7xl">
            <HospitalBrandName
              hospitalName={hospitalName}
              accentColor={`hsl(var(--color-primary))`}
              textColor={`hsl(var(--color-text-primary))`}
              lineHeight={layoutTypography.headingLineHeight}
            />
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto"
            style={{
              color: `hsl(var(--color-text-secondary))`,
              marginBottom: '3rem',
              lineHeight: '1.6',
              fontWeight: '400',
            }}
          >
            {description}
          </p>

          <div className="flex justify-center mt-12">
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-2 transition-all text-base px-8 py-4 rounded-lg font-medium hover:opacity-90"
              style={{
                backgroundColor: `hsl(var(--color-primary))`,
                color: `hsl(var(--color-text-inverse))`,
              }}
            >
              <Calendar className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>
          </div>

          <div
            className="mt-16 pt-12 border-t"
            style={{
              borderTopColor: `hsl(var(--color-border-default))`,
            }}
          >
            <p
              className="text-sm font-light"
              style={{
                color: `hsl(var(--color-text-muted))`,
              }}
            >
              Expert neurological care you can trust
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
