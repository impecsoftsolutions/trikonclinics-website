import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';

interface ContactInfo {
  address: string | null;
  phone_numbers: string[] | null;
  email_addresses: string[] | null;
  working_hours: string | null;
  appointment_booking_link: string | null;
  google_maps_code: string | null;
}

export const Contact: React.FC = () => {
  const { colors, getGradient, callUsButton } = useModernTheme();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [hospitalName, setHospitalName] = useState<string>('Trikon Clinics');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const [contactResult, hospitalResult] = await Promise.all([
        supabase.from('contact_information').select('*').maybeSingle(),
        supabase.from('hospital_profile').select('name').maybeSingle(),
      ]);

      if (contactResult.error) throw contactResult.error;
      if (contactResult.data) setContactInfo(contactResult.data);

      if (hospitalResult.data?.name) {
        setHospitalName(hospitalResult.data.name);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
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
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `hsl(var(--color-primary))`,
              borderTopColor: 'transparent',
            }}
          ></div>
          <p style={{ color: `hsl(var(--color-text-secondary))` }}>
            Loading contact information...
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
            Contact Us
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
          >
            Get in touch with us for appointments and inquiries
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              {hospitalName}
            </h2>
            <div
              className="w-24 h-1 mx-auto"
              style={{ backgroundColor: `hsl(var(--color-primary))` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div
                className="rounded-xl shadow-md p-8"
                style={{ backgroundColor: `hsl(var(--color-bg-surface))` }}
              >
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: `hsl(var(--color-text-primary))` }}
                >
                  Get In Touch
                </h2>

                {contactInfo?.address && (
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `hsla(var(--color-primary), 0.1)` }}
                    >
                      <MapPin className="w-6 h-6" style={{ color: `hsl(var(--color-primary))` }} />
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        Address
                      </h3>
                      <p
                        style={{
                          color: `hsl(var(--color-text-secondary))`,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {contactInfo.address}
                      </p>
                    </div>
                  </div>
                )}

                {contactInfo?.phone_numbers && contactInfo.phone_numbers.length > 0 && (
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `hsla(var(--color-primary), 0.1)` }}
                    >
                      <Phone className="w-6 h-6" style={{ color: `hsl(var(--color-primary))` }} />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        Phone
                      </h3>
                      {contactInfo.phone_numbers.map((phone, index) => (
                        <a
                          key={index}
                          href={`tel:${phone}`}
                          className="block hover:underline"
                          style={{ color: `hsl(var(--color-primary))` }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(var(--color-secondary))`)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = `hsl(var(--color-primary))`)}
                        >
                          {phone}
                        </a>
                      ))}
                      <div className="mt-4">
                        <a
                          href={`tel:${contactInfo.phone_numbers[0]}`}
                          className="inline-block px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-md"
                          style={{
                            backgroundColor: callUsButton.backgroundColor,
                            color: callUsButton.textColor,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = String(callUsButton.hoverOpacity);
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          {callUsButton.text}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {contactInfo?.email_addresses && contactInfo.email_addresses.length > 0 && (
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `hsla(var(--color-primary), 0.1)` }}
                    >
                      <Mail className="w-6 h-6" style={{ color: `hsl(var(--color-primary))` }} />
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        Email
                      </h3>
                      {contactInfo.email_addresses.map((email, index) => (
                        <a
                          key={index}
                          href={`mailto:${email}`}
                          className="block hover:underline"
                          style={{ color: `hsl(var(--color-primary))` }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(var(--color-secondary))`)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = `hsl(var(--color-primary))`)}
                        >
                          {email}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {contactInfo?.working_hours && (
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `hsla(var(--color-primary), 0.1)` }}
                    >
                      <Clock className="w-6 h-6" style={{ color: `hsl(var(--color-primary))` }} />
                    </div>
                    <div>
                      <h3
                        className="font-semibold mb-1"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        Working Hours
                      </h3>
                      <p
                        className="whitespace-pre-line"
                        style={{ color: `hsl(var(--color-text-secondary))` }}
                      >
                        {contactInfo.working_hours}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="rounded-xl shadow-md overflow-hidden h-full"
              style={{ backgroundColor: `hsl(var(--color-bg-surface))` }}
            >
              {contactInfo?.google_maps_code ? (
                <div
                  className="w-full h-full"
                  style={{ display: 'flex' }}
                  dangerouslySetInnerHTML={{
                    __html: contactInfo.google_maps_code.replace(
                      /<iframe/g,
                      '<iframe style="display:block; border:0; width:100%; height:100%; min-height:500px;"'
                    )
                  }}
                />
              ) : (
                <div
                  className="w-full h-full min-h-[400px] flex items-center justify-center"
                  style={{ backgroundColor: `hsl(var(--color-bg-elevated))` }}
                >
                  <div className="text-center">
                    <MapPin
                      className="w-16 h-16 mx-auto mb-4"
                      style={{ color: `hsl(var(--color-text-secondary))` }}
                    />
                    <p style={{ color: `hsl(var(--color-text-secondary))` }}>Map not available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
