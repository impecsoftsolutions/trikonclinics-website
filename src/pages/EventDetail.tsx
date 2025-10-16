import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useModernTheme } from '../hooks/useModernTheme';
import { BackButton } from '../components/BackButton';
import { Calendar, X, Image as ImageIcon, Video as VideoIcon, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface EventImage {
  id: string;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  caption: string | null;
  display_order: number;
  is_featured: boolean;
}

interface EventVideo {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string | null;
  display_order: number;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  short_description: string | null;
  full_description: string | null;
  featured_image_id: string | null;
}

export const EventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { colors, getGradient, primaryCtaButton } = useModernTheme();

  const [event, setEvent] = useState<Event | null>(null);
  const [images, setImages] = useState<EventImage[]>([]);
  const [videos, setVideos] = useState<EventVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (slug) {
      loadEventData();
    }
  }, [slug]);

  useEffect(() => {
    if (lightboxIndex === -1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, images.length]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(false);

      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, slug, event_date, short_description, full_description, featured_image_id')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData) {
        setError(true);
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('event_images')
        .select('id, original_url, medium_url, thumbnail_url, caption, display_order, is_featured')
        .eq('event_id', eventData.id)
        .order('display_order', { ascending: true });

      if (imagesError) throw imagesError;
      if (imagesData) setImages(imagesData);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('event_videos')
        .select('id, youtube_url, youtube_video_id, title, display_order')
        .eq('event_id', eventData.id)
        .order('display_order', { ascending: true });

      if (videosError) throw videosError;
      if (videosData) setVideos(videosData);

    } catch (err) {
      console.error('Error loading event:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const getFeaturedImage = (): EventImage | null => {
    if (!event?.featured_image_id || images.length === 0) return null;
    return images.find(img => img.id === event.featured_image_id) || images[0];
  };

  const formatEventDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const openLightbox = (image: EventImage) => {
    const index = images.findIndex(img => img.id === image.id);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(-1);
  };

  const goToNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const goToPreviousImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextImage();
    }
    if (isRightSwipe) {
      goToPreviousImage();
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: `hsl(var(--color-bg-base))` }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `hsl(var(--color-primary))`,
              borderTopColor: 'transparent',
            }}
          ></div>
          <p style={{ color: `hsl(var(--color-text-secondary))` }}>Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div
        className="min-h-screen py-20"
        style={{ backgroundColor: `hsl(var(--color-bg-base))` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle
              className="w-20 h-20 mx-auto mb-6"
              style={{ color: `hsl(var(--color-semantic-error))` }}
            />
            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              Event Not Found
            </h1>
            <p
              className="text-lg mb-8"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            >
              The event you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <BackButton to="/events" />
              <Link
                to="/events"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-opacity"
                style={{
                  backgroundColor: primaryCtaButton.backgroundColor,
                  color: primaryCtaButton.textColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = String(primaryCtaButton.hoverOpacity);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Browse All Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const featuredImage = getFeaturedImage();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: `hsl(var(--color-bg-base))` }}
    >
      {/* Hero Section */}
      <section
        className="text-white py-20"
        style={{
          background: getGradient('hero'),
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <BackButton to="/events" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Calendar
              className="w-6 h-6"
              style={{ color: `hsl(var(--color-text-inverse))` }}
            />
            <span
              className="text-lg font-medium"
              style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.95 }}
            >
              {formatEventDate(event.event_date)}
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: `hsl(var(--color-text-inverse))` }}
          >
            {event.title}
          </h1>
          {event.short_description && (
            <p
              className="text-xl max-w-3xl leading-relaxed"
              style={{ color: `hsl(var(--color-text-inverse))`, opacity: 0.9 }}
            >
              {event.short_description}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Image */}
        {featuredImage && (
          <div className="mb-12">
            <img
              src={featuredImage.medium_url || featuredImage.original_url}
              alt={event.title}
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
              style={{ maxHeight: '600px' }}
            />
          </div>
        )}

        {/* Full Description */}
        {event.full_description && (
          <div
            className="mb-16 rounded-2xl shadow-lg p-8"
            style={{
              backgroundColor: `hsl(var(--color-bg-surface))`,
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: `hsl(var(--color-border-default))`,
            }}
          >
            <p
              className="text-lg leading-relaxed whitespace-pre-wrap"
              style={{ color: `hsl(var(--color-text-primary))` }}
            >
              {event.full_description}
            </p>
          </div>
        )}

        {/* Photo Gallery */}
        {images.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <ImageIcon
                className="w-8 h-8"
                style={{ color: `hsl(var(--color-primary))` }}
              />
              <h2
                className="text-3xl font-bold"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Photo Gallery
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  onClick={() => openLightbox(image)}
                  style={{ backgroundColor: `hsl(var(--color-bg-surface))` }}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image.thumbnail_url}
                      alt={image.caption || event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  {image.caption && (
                    <div
                      className="p-4"
                      style={{ backgroundColor: `hsl(var(--color-bg-surface))` }}
                    >
                      <p
                        className="text-sm"
                        style={{ color: `hsl(var(--color-text-secondary))` }}
                      >
                        {image.caption}
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Section */}
        {videos.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <VideoIcon
                className="w-8 h-8"
                style={{ color: `hsl(var(--color-primary))` }}
              />
              <h2
                className="text-3xl font-bold"
                style={{ color: `hsl(var(--color-text-primary))` }}
              >
                Videos
              </h2>
            </div>
            <div className="space-y-8">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-2xl shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: `hsl(var(--color-bg-surface))`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `hsl(var(--color-border-default))`,
                  }}
                >
                  {video.title && (
                    <div className="p-6 pb-4">
                      <h3
                        className="text-xl font-semibold"
                        style={{ color: `hsl(var(--color-text-primary))` }}
                      >
                        {video.title}
                      </h3>
                    </div>
                  )}
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                      title={video.title || `Video ${video.display_order + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ border: 'none' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && videos.length === 0 && !event.full_description && (
          <div className="text-center py-12">
            <AlertCircle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            />
            <p
              className="text-lg"
              style={{ color: `hsl(var(--color-text-secondary))` }}
            >
              Additional content for this event will be available soon.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex >= 0 && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 z-10"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8 text-white" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full z-10">
            <span className="text-lg font-medium">
              {lightboxIndex + 1} / {images.length}
            </span>
          </div>

          {/* Previous Button - Desktop Only */}
          {images.length > 1 && (
            <button
              className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousImage();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Next Button - Desktop Only */}
          {images.length > 1 && (
            <button
              className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-300 z-10"
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          )}

          {/* Image Container with Touch Support */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full px-4 md:px-16"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={images[lightboxIndex].original_url}
              alt={images[lightboxIndex].caption || event.title}
              className="w-full h-full object-contain rounded-lg transition-opacity duration-300"
              key={lightboxIndex}
            />

            {/* Caption */}
            {images[lightboxIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-4 rounded-b-lg">
                <p className="text-center text-lg">{images[lightboxIndex].caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
