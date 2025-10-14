import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { HospitalBrandName } from './variants/HospitalBrandName';

interface ContactInfo {
  address: string | null;
  phone_numbers: string[] | null;
  email_addresses: string[] | null;
}

interface SocialMedia {
  id: string;
  platform_name: string;
  profile_url: string;
  display_order: number;
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export const PublicFooter: React.FC = () => {
  const { colors, healthLibraryEnabled } = useModernTheme();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    const [contactResult, socialResult, profileResult] = await Promise.all([
      supabase.from('contact_information').select('*').maybeSingle(),
      supabase
        .from('social_media')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order'),
      supabase.from('hospital_profile').select('*').maybeSingle(),
    ]);

    if (contactResult.data) {
      setContactInfo(contactResult.data);
    }

    if (socialResult.data) {
      setSocialMedia(socialResult.data);
    }

    if (profileResult.data) {
      setHospitalProfile(profileResult.data);
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const normalizedName = platformName.toLowerCase();
    const Icon = platformIcons[normalizedName];
    return Icon || Building2;
  };

  const allNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'Services', path: '/services' },
    { name: 'Health Library', path: '/health-library' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'Contact', path: '/contact' },
  ];

  const navLinks = allNavLinks.filter(
    (link) => link.name !== 'Health Library' || healthLibraryEnabled
  );

  return (
    <footer
      className="transition-colors duration-300"
      style={{
        backgroundColor: `hsl(var(--color-bg-elevated))`,
        borderTop: `1px solid hsl(var(--color-border-default))`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className={`grid grid-cols-1 ${
            socialMedia.length > 0 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'
          } gap-12`}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              {hospitalProfile?.logo_image ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={hospitalProfile.logo_image}
                    alt={`${hospitalProfile.name || 'Hospital'} Logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(var(--color-primary))`,
                  }}
                >
                  <Building2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">
                  <HospitalBrandName
                    hospitalName={hospitalProfile?.name || 'Trikon Clinics'}
                    accentColor={`hsl(var(--color-primary))`}
                    textColor={`hsl(var(--color-text-primary))`}
                  />
                </h3>
              </div>
            </div>
            <p
              className="text-base leading-relaxed"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            >
              Providing quality healthcare services with compassion and excellence.
            </p>
          </div>

          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              Contact Us
            </h4>
            <div className="space-y-3">
              {contactInfo?.address && (
                <div className="flex items-start gap-2">
                  <MapPin
                    className="w-5 h-5 flex-shrink-0 mt-1"
                    style={{ color: `hsl(var(--color-primary))` }}
                  />
                  <p
                    className="text-base"
                    style={{
                      color: `hsl(var(--color-text-secondary))`,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {contactInfo.address}
                  </p>
                </div>
              )}
              {contactInfo?.phone_numbers && contactInfo.phone_numbers.length > 0 && (
                <div className="flex items-start gap-2">
                  <Phone
                    className="w-5 h-5 flex-shrink-0 mt-1"
                    style={{ color: `hsl(var(--color-primary))` }}
                  />
                  <div>
                    {contactInfo.phone_numbers.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:${phone}`}
                        className="block text-base transition-colors"
                        style={{ color: `hsl(var(--color-text-secondary))` }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(var(--color-primary))`)}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = `hsl(var(--color-text-secondary))`)
                        }
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {contactInfo?.email_addresses && contactInfo.email_addresses.length > 0 && (
                <div className="flex items-start gap-2">
                  <Mail
                    className="w-5 h-5 flex-shrink-0 mt-1"
                    style={{ color: `hsl(var(--color-primary))` }}
                  />
                  <div>
                    {contactInfo.email_addresses.map((email, index) => (
                      <a
                        key={index}
                        href={`mailto:${email}`}
                        className="block text-base transition-colors"
                        style={{ color: `hsl(var(--color-text-secondary))` }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(var(--color-primary))`)}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = `hsl(var(--color-text-secondary))`)
                        }
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4
              className="text-lg font-semibold mb-4"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              Quick Links
            </h4>
            <nav className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-base transition-colors"
                  style={{ color: `hsl(var(--color-text-secondary))` }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = `hsl(var(--color-primary))`)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = `hsl(var(--color-text-secondary))`)
                  }
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {socialMedia.length > 0 && (
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Follow Us
              </h4>
              <div className="flex gap-2">
                {socialMedia.map((platform) => {
                  const Icon = getPlatformIcon(platform.platform_name);
                  return (
                    <a
                      key={platform.id}
                      href={platform.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-90"
                      style={{ backgroundColor: `hsl(var(--color-primary))` }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="mt-8 pt-6 text-center"
          style={{
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: `hsl(var(--color-border-default))`,
          }}
        >
          <p
            className="text-base"
            style={{ color: `hsl(var(--color-text-secondary))` }}
          >
            © {new Date().getFullYear()}{' '}
            <HospitalBrandName
              hospitalName={hospitalProfile?.name || 'Trikon Clinics'}
              accentColor={`hsl(var(--color-primary))`}
              textColor={`hsl(var(--color-text-secondary))`}
            />
            . All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
