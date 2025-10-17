import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Building2, Menu, X, ChevronDown } from 'lucide-react';
import { useModernTheme } from '../hooks/useModernTheme';
import { useHospitalProfile } from '../hooks/useHospitalProfile';
import { HospitalBrandName } from './variants/HospitalBrandName';
import { supabase } from '../lib/supabase';

interface Service {
  id: string;
  service_name: string;
  display_order: number;
}

export const PublicNav: React.FC = () => {
  const { colors, navigationActiveBackground, theme, healthLibraryEnabled } = useModernTheme();
  const { profile } = useHospitalProfile();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesExpanded, setMobileServicesExpanded] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const hospitalName = profile?.name || 'Trikon Clinics';
  const hospitalLogo = profile?.logo_image;

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, service_name, display_order')
        .eq('is_enabled', true)
        .order('display_order');

      if (error) throw error;
      if (data) setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleServiceClick = (serviceId: string) => {
    setServicesDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileServicesExpanded(false);

    if (location.pathname !== '/services') {
      window.location.href = `/services#service-${serviceId}`;
    } else {
      const element = document.getElementById(`service-${serviceId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const allNavLinks = [
    { name: 'Home', path: '/' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'Services', path: '/services' },
    { name: 'Events', path: '/events' },
    { name: 'Health Library', path: '/health-library' },
    { name: 'Testimonials', path: '/testimonials' },
    { name: 'Contact', path: '/contact' },
  ];

  const navLinks = allNavLinks.filter(
    (link) => link.name !== 'Health Library' || healthLibraryEnabled
  );

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: `hsl(var(--color-bg-surface))`,
        borderBottom: `1px solid hsl(var(--color-border-default))`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <NavLink
            to="/"
            className="flex items-center gap-4 group"
          >
            {hospitalLogo ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden transition-all duration-300 flex-shrink-0">
                <img
                  src={hospitalLogo}
                  alt={`${hospitalName} Logo`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: `hsl(var(--color-primary))`,
                }}
              >
                <Building2
                  className="w-7 h-7"
                  style={{ color: 'white' }}
                  strokeWidth={2.5}
                />
              </div>
            )}
            <div>
              <h1 className="text-xl leading-tight font-bold">
                <HospitalBrandName
                  hospitalName={hospitalName}
                  accentColor={`hsl(var(--color-primary))`}
                  textColor={`hsl(var(--color-text-primary))`}
                  lineHeight="1.2"
                />
              </h1>
            </div>
          </NavLink>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.name === 'Services') {
                return (
                  <div
                    key={link.path}
                    className="relative"
                    onMouseEnter={() => setServicesDropdownOpen(true)}
                    onMouseLeave={() => setServicesDropdownOpen(false)}
                  >
                    <NavLink
                      to={link.path}
                      className="px-4 py-2 font-medium transition-all duration-200 rounded-lg flex items-center gap-1"
                      style={({ isActive }) => ({
                        color: isActive
                          ? (navigationActiveBackground ? 'white' : `hsl(var(--color-primary))`)
                          : `hsl(var(--color-text-primary))`,
                        backgroundColor: isActive && navigationActiveBackground ? navigationActiveBackground : 'transparent',
                      })}
                    >
                      {link.name}
                      <ChevronDown className="w-4 h-4" />
                    </NavLink>
                    {servicesDropdownOpen && services.length > 0 && (
                      <div
                        className="absolute top-full left-0 mt-0 w-64 rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                          backgroundColor: 'white',
                          border: `1px solid rgba(0, 0, 0, 0.06)`,
                          zIndex: 50,
                        }}
                      >
                        <div className="py-1">
                          {services.map((service, index) => (
                            <button
                              key={service.id}
                              onClick={() => handleServiceClick(service.id)}
                              className="w-full text-left px-4 py-3 text-sm font-normal transition-colors duration-200 hover:bg-gray-50"
                              style={{
                                color: `hsl(var(--color-text-secondary))`,
                                borderBottom: index < services.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                              }}
                            >
                              {service.service_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className="px-4 py-2 font-medium transition-all duration-200 rounded-lg"
                  style={({ isActive }) => ({
                    color: isActive
                      ? (navigationActiveBackground ? 'white' : `hsl(var(--color-primary))`)
                      : `hsl(var(--color-text-primary))`,
                    backgroundColor: isActive && navigationActiveBackground ? navigationActiveBackground : 'transparent',
                  })}
                >
                  {link.name}
                </NavLink>
              );
            })}
          </div>

          <div className="md:hidden flex items-center">
            <button
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: mobileMenuOpen ? `hsl(var(--color-primary))` : `hsl(var(--color-bg-elevated))`,
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" style={{ color: mobileMenuOpen ? 'white' : `hsl(var(--color-text-primary))` }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: `hsl(var(--color-text-primary))` }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="md:hidden"
          style={{
            borderTop: `1px solid hsl(var(--color-border-default))`,
            backgroundColor: `hsl(var(--color-bg-surface))`,
          }}
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              if (link.name === 'Services') {
                return (
                  <div key={link.path}>
                    <div className="flex items-center justify-between">
                      <NavLink
                        to={link.path}
                        end={link.path === '/'}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileServicesExpanded(false);
                        }}
                        className="flex-1 px-4 py-2 font-medium transition-all duration-200 rounded-lg"
                        style={({ isActive }) => ({
                          color: isActive
                            ? (navigationActiveBackground ? 'white' : `hsl(var(--color-primary))`)
                            : `hsl(var(--color-text-primary))`,
                          backgroundColor: isActive && navigationActiveBackground ? navigationActiveBackground : 'transparent',
                        })}
                      >
                        {link.name}
                      </NavLink>
                      {services.length > 0 && (
                        <button
                          onClick={() => setMobileServicesExpanded(!mobileServicesExpanded)}
                          className="px-2 py-2 transition-transform duration-200"
                          style={{
                            color: `hsl(var(--color-text-primary))`,
                            transform: mobileServicesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {mobileServicesExpanded && services.length > 0 && (
                      <div className="ml-4 mt-2 animate-in slide-in-from-top-2 duration-200">
                        {services.map((service, index) => (
                          <button
                            key={service.id}
                            onClick={() => handleServiceClick(service.id)}
                            className="w-full text-left px-4 py-3 text-sm font-normal transition-colors duration-200 hover:bg-gray-50 rounded-lg"
                            style={{
                              color: `hsl(var(--color-text-secondary))`,
                              backgroundColor: 'transparent',
                              borderBottom: index < services.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                            }}
                          >
                            {service.service_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 font-medium transition-all duration-200 rounded-lg"
                  style={({ isActive }) => ({
                    color: isActive
                      ? (navigationActiveBackground ? 'white' : `hsl(var(--color-primary))`)
                      : `hsl(var(--color-text-primary))`,
                    backgroundColor: isActive && navigationActiveBackground ? navigationActiveBackground : 'transparent',
                  })}
                >
                  {link.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
