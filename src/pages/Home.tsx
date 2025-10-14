import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { Target, Star, Clock, Shield, Zap, Brain, Moon, Heart, Calendar } from 'lucide-react';
import { HeroVariant } from '../components/variants/HeroVariant';
import { CardVariant } from '../components/variants/CardVariant';

interface HospitalProfile {
  name: string;
  about_text: string | null;
  mission: string | null;
  banner_image: string | null;
}

interface Service {
  id: string;
  service_name: string;
  description: string | null;
  icon_image: string | null;
  display_order: number;
}

interface Testimonial {
  id: string;
  patient_name: string;
  review_english: string | null;
  star_rating: number | null;
  patient_photo: string | null;
}

interface ContactInfo {
  appointment_booking_link: string | null;
  phone_numbers: string[] | null;
}

export const Home: React.FC = () => {
  const { colors, getGradient } = useModernTheme();
  const [hospitalProfile, setHospitalProfile] = useState<HospitalProfile | null>(null);
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [profileResult, servicesResult, testimonialsResult, contactResult] = await Promise.all([
        supabase.from('hospital_profile').select('*').maybeSingle(),
        supabase
          .from('services')
          .select('*')
          .eq('is_enabled', true)
          .order('display_order')
          .limit(3),
        supabase
          .from('testimonials')
          .select('*')
          .eq('is_published', true)
          .order('display_order')
          .limit(3),
        supabase.from('contact_information').select('*').maybeSingle(),
      ]);

      if (profileResult.data) setHospitalProfile(profileResult.data);
      if (servicesResult.data) setFeaturedServices(servicesResult.data);
      if (testimonialsResult.data) setTestimonials(testimonialsResult.data);
      if (contactResult.data) setContactInfo(contactResult.data);
    } catch (error) {
      console.error('Error loading home data:', error);
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

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

  const features = [
    {
      icon: Clock,
      title: '24/7 Emergency',
      description: 'Round-the-clock emergency care when you need it most',
    },
    {
      icon: Brain,
      title: 'Movement Disorders',
      description: "Specialized care for Parkinson's and movement conditions",
    },
    {
      icon: Moon,
      title: 'Sleep Medicine',
      description: 'Comprehensive sleep disorder diagnosis and treatment',
    },
    {
      icon: Shield,
      title: 'Patient Safety',
      description: 'Highest standards of hygiene and patient care',
    },
  ];

  return (
    <div
      className="transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
    >
      <HeroVariant
        hospitalName={hospitalProfile?.name || 'Trikon Clinics'}
        tagline="Centre for Movement Disorders & Sleep Medicine"
        description="Quality Neurological Healthcare with Compassion and Excellence"
        bannerImage={hospitalProfile?.banner_image}
        appointmentLink={contactInfo?.appointment_booking_link}
        phoneNumber={contactInfo?.phone_numbers?.[0]}
      />

      <section
        className="py-16 relative transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <CardVariant
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      {hospitalProfile?.about_text && (
        <section
          className="py-16 transition-colors duration-300"
          style={{ backgroundColor: `hsl(var(--color-bg-elevated))` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block mb-3">
                <span
                  className="px-4 py-2 rounded-lg text-base font-semibold"
                  style={{
                    backgroundColor: `hsla(var(--color-primary), 0.08)`,
                    color: `hsl(var(--color-primary))`,
                  }}
                >
                  About Us
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-semibold mb-3"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Your Health, Our Priority
              </h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <div
                className="rounded-xl shadow-sm p-8 md:p-10 transition-colors duration-300"
                style={{
                  backgroundColor: `hsl(var(--color-bg-surface))`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `hsl(var(--color-border-default))`,
                }}
              >
                <p
                  className="text-base leading-relaxed text-center whitespace-pre-line"
                  style={{ color: `hsl(var(--color-text-secondary))` }}
                >
                  {hospitalProfile.about_text}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {hospitalProfile?.mission && (
        <section
          className="py-16 transition-colors duration-300"
          style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="flex flex-col md:flex-row items-center gap-8 rounded-xl p-8 md:p-12 shadow-lg text-white"
              style={{
                background: getGradient('hero'),
              }}
            >
              <div className="md:w-1/4 flex justify-center">
                <div
                  className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Target className="w-12 h-12" style={{ color: `hsl(var(--color-primary))` }} />
                </div>
              </div>
              <div className="md:w-3/4">
                <div className="inline-block mb-3">
                  <span className="bg-white/15 px-4 py-2 rounded-lg text-base font-semibold" style={{ color: `hsl(var(--color-text-inverse))` }}>
                    Our Mission
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{ color: `hsl(var(--color-text-inverse))` }}>
                  Committed to Excellence
                </h2>
                <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.95 }}>
                  {hospitalProfile.mission}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {featuredServices.length > 0 && (
        <section
          className="py-16 transition-colors duration-300"
          style={{ backgroundColor: `hsl(var(--color-bg-elevated))` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block mb-3">
                <span
                  className="px-4 py-2 rounded-lg text-base font-semibold"
                  style={{
                    backgroundColor: `hsla(var(--color-primary), 0.08)`,
                    color: `hsl(var(--color-primary))`,
                  }}
                >
                  Our Services
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-semibold mb-3"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Comprehensive Neurological Care
              </h2>
              <p
                className="text-base max-w-2xl mx-auto"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              >
                Specialized care tailored to your neurological health needs
              </p>
            </div>

            <div className="max-w-4xl mx-auto mb-10">
              {featuredServices.map((service, index) => {
                const truncatedDescription = service.description
                  ? service.description.length > 100
                    ? service.description.substring(0, 100) + '...'
                    : service.description
                  : 'Specialized medical service for your healthcare needs';

                return (
                  <React.Fragment key={service.id}>
                    <Link
                      to="/services"
                      className="flex items-center gap-6 py-6 px-6 rounded-lg transition-all duration-200 group"
                      style={{
                        backgroundColor: `hsl(var(--color-bg-surface))`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `hsla(var(--color-primary), 0.03)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `hsl(var(--color-bg-surface))`;
                      }}
                    >
                      <div className="flex-shrink-0">
                        {service.icon_image ? (
                          <img
                            src={service.icon_image}
                            alt={service.service_name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-20 h-20 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `hsla(var(--color-primary), 0.1)`,
                            }}
                          >
                            <Heart
                              className="w-10 h-10"
                              style={{ color: `hsl(var(--color-primary))` }}
                              strokeWidth={2}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-xl md:text-2xl font-bold mb-2 group-hover:underline"
                          style={{ color: `hsl(var(--color-text-primary))` }}
                        >
                          {service.service_name}
                        </h3>
                        <p
                          className="text-sm md:text-base leading-relaxed"
                          style={{ color: `hsl(var(--color-text-secondary))` }}
                        >
                          {truncatedDescription}
                        </p>
                      </div>
                    </Link>
                    {index < featuredServices.length - 1 && (
                      <div
                        className="w-full h-px my-0"
                        style={{ backgroundColor: '#E5E7EB' }}
                      ></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="text-center">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
                style={{ backgroundColor: `hsl(var(--color-primary))` }}
              >
                View All Services
                <Zap className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {testimonials.length > 0 && (
        <section
          className="py-16 transition-colors duration-300"
          style={{ backgroundColor: `hsl(var(--color-bg-page))` }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block mb-3">
                <span className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg text-base font-semibold">
                  Testimonials
                </span>
              </div>
              <h2
                className="text-3xl md:text-4xl font-semibold mb-3"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                What Our Patients Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <CardVariant
                  key={testimonial.id}
                  icon={Star}
                  title=""
                  description={testimonial.review_english || ''}
                  image={testimonial.patient_photo}
                  rating={testimonial.star_rating}
                  author={testimonial.patient_name}
                />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/testimonials"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: `hsl(var(--color-primary))` }}
              >
                Read More Reviews
                <Star className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section
        className="py-16 relative overflow-hidden"
        style={{
          background: getGradient('hero'),
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4" style={{ color: `hsl(var(--color-text-inverse))` }}>
            Ready to Take Care of Your Health?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.95 }}>
            Book an appointment today and experience quality neurological healthcare with
            compassionate professionals
          </p>
          <div className="flex justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: 'white', color: `hsl(var(--color-primary))` }}
            >
              <Calendar className="w-5 h-5" />
              Schedule Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
