import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, Heart, Sparkles, Brain } from 'lucide-react';
import { useModernTheme } from '../../hooks/useModernTheme';
import { HospitalBrandName } from './HospitalBrandName';

interface HeroPlayfulProps {
  hospitalName?: string;
  tagline?: string;
  description?: string;
  bannerImage?: string | null;
  appointmentLink?: string | null;
  phoneNumber?: string | null;
}

export const HeroPlayful: React.FC<HeroPlayfulProps> = ({
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
      className="relative flex items-center overflow-hidden md:min-h-[650px]"
      style={{
        background: getGradient('primary'),
        paddingTop: '0',
        paddingBottom: '0',
      }}
    >
      <div className="absolute inset-0 opacity-5 hidden md:block">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full bg-white animate-pulse delay-75"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white animate-pulse delay-150"></div>
      </div>

      <div className="relative w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-16 md:items-center md:max-w-7xl md:mx-auto md:px-4 sm:md:px-6 lg:md:px-8 md:py-16">
          <div className="text-white relative z-10 order-2 md:order-1 px-4 py-8 md:px-0 md:py-0">
            <div className="inline-flex items-center gap-2 mb-6">
              <Sparkles
                className="w-5 h-5 animate-pulse"
                style={{ color: `hsl(var(--color-decorative-icon))` }}
              />
              <span
                className="text-sm font-semibold tracking-wide"
                style={{
                  color: `hsl(var(--color-text-inverse))`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tagline}
              </span>
            </div>

            <h1 className="mb-6 leading-snug text-4xl md:text-5xl lg:text-6xl">
              <HospitalBrandName
                hospitalName={hospitalName}
                accentColor={`hsl(var(--color-accent))`}
                textColor={`hsl(var(--color-text-inverse))`}
                lineHeight={layoutTypography.headingLineHeight}
              />
            </h1>

            <p
              className="text-xl md:text-2xl mb-8"
              style={{
                color: `hsl(var(--color-text-inverse))`,
                marginBottom: layoutSpacing.elementGap,
                opacity: 0.95,
                lineHeight: '1.5',
              }}
            >
              {description}
            </p>

            <div className="flex items-center gap-3 mb-10 flex-wrap">
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Heart className="w-4 h-4 text-red-300 fill-red-300" />
                <span className="text-sm font-medium" style={{ color: `hsl(var(--color-text-inverse))` }}>
                  Trusted Care
                </span>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Brain className="w-4 h-4 text-blue-300" />
                <span className="text-sm font-medium" style={{ color: `hsl(var(--color-text-inverse))` }}>
                  Expert Team
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="group inline-flex items-center justify-center gap-3 text-white font-bold transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 px-8 py-4 rounded-full"
                style={{
                  backgroundColor: `hsl(var(--color-accent))`,
                }}
              >
                <Calendar className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Book Your Visit
              </Link>
            </div>
          </div>

          <div className="relative order-1 md:order-2 w-full">
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 hidden md:block"
              style={{ backgroundColor: `hsl(var(--color-accent))` }}
            ></div>
            {bannerImage ? (
              <div className="relative z-10">
                <img
                  src={bannerImage}
                  alt={hospitalName}
                  className="w-full h-auto md:shadow-2xl"
                  style={{ borderRadius: '0', display: 'block' }}
                />
              </div>
            ) : (
              <div
                className="relative z-10 w-full h-72 md:h-96 bg-white/20 backdrop-blur-sm flex items-center justify-center"
                style={{ borderRadius: '0' }}
              >
                <Brain className="w-32 h-32 md:w-48 md:h-48 text-white opacity-50" />
              </div>
            )}
            <div
              className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20 hidden md:block"
              style={{ backgroundColor: `hsl(var(--color-secondary))` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 hidden md:block">
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
  );
};
