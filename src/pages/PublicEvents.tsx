import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { Calendar, MapPin } from 'lucide-react';
import { format, isPast, isFuture } from 'date-fns';

interface EventImage {
  id: string;
  thumbnail_url: string;
  medium_url: string;
  is_featured: boolean;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  short_description: string | null;
  featured_image_id: string | null;
  event_images?: EventImage[];
}

export const PublicEvents: React.FC = () => {
  const navigate = useNavigate();
  const { colors, getGradient } = useModernTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          slug,
          event_date,
          short_description,
          featured_image_id,
          event_images (
            id,
            thumbnail_url,
            medium_url,
            is_featured
          )
        `)
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const sortedEvents = sortEventsByDate(data);
        setEvents(sortedEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortEventsByDate = (events: Event[]): Event[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(event =>
      isFuture(new Date(event.event_date)) ||
      format(new Date(event.event_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    );
    const past = events.filter(event => isPast(new Date(event.event_date)) &&
      format(new Date(event.event_date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')
    );

    upcoming.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    past.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());

    return [...upcoming, ...past];
  };

  const getThumbnailUrl = (event: Event): string | null => {
    if (!event.event_images || event.event_images.length === 0) {
      return null;
    }

    const featuredImage = event.event_images.find(
      img => img.id === event.featured_image_id
    );

    if (featuredImage) {
      return featuredImage.thumbnail_url;
    }

    return event.event_images[0]?.thumbnail_url || null;
  };

  const formatEventDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const isEventUpcoming = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    return isFuture(eventDate) || format(eventDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
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
          <p style={{ color: `hsl(var(--color-text-secondary))` }}>Loading events...</p>
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
            Events & Activities
          </h1>
          <p
            className="text-xl max-w-3xl mx-auto"
            style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
          >
            Join us for upcoming events and view highlights from past activities
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              />
              <p
                className="text-lg"
                style={{ color: `hsl(var(--color-text-secondary))` }}
              >
                No events available at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => {
                const thumbnailUrl = getThumbnailUrl(event);
                const isUpcoming = isEventUpcoming(event.event_date);

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/events/${event.slug}`)}
                  >
                    <div className="relative h-64">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, hsla(var(--color-primary), 0.8), hsla(var(--color-primary), 0.5))`,
                          }}
                        >
                          <Calendar className="w-20 h-20 text-white" />
                        </div>
                      )}
                      {isUpcoming && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-lg">
                            Upcoming
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar
                          className="w-4 h-4"
                          style={{ color: `hsl(var(--color-primary))` }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: `hsl(var(--color-primary))` }}
                        >
                          {formatEventDate(event.event_date)}
                        </span>
                      </div>

                      <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        {event.title}
                      </h3>

                      {event.short_description && (
                        <p
                          className="text-sm mb-4 line-clamp-3"
                          style={{ color: `hsl(var(--color-text-secondary))` }}
                        >
                          {event.short_description}
                        </p>
                      )}

                      <button
                        className="w-full py-2 px-4 rounded-lg font-semibold transition-colors"
                        style={{
                          backgroundColor: `hsl(var(--color-primary))`,
                          color: `hsl(var(--color-text-inverse))`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
