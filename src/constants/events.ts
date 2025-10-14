export const EVENTS_PAGE_SIZE = 20;

export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

export const IMAGE_SIZES = {
  SMALL: {
    width: 200,
    folder: 'small',
    description: 'Thumbnail size for lists and previews',
  },
  MEDIUM: {
    width: 600,
    folder: 'medium',
    description: 'Standard size for content display',
  },
  LARGE: {
    width: 1200,
    folder: 'large',
    description: 'Full size for detailed viewing and lightbox',
  },
} as const;

export const MAX_IMAGES_PER_EVENT = 50;
export const MAX_VIDEOS_PER_EVENT = 10;
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

export const YOUTUBE_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export const ERROR_TYPES = {
  UPLOAD_FAILED: 'upload_failed',
  PROCESSING_FAILED: 'processing_failed',
  INVALID_YOUTUBE_URL: 'invalid_youtube_url',
  DATABASE_ERROR: 'database_error',
  STORAGE_ERROR: 'storage_error',
  VALIDATION_ERROR: 'validation_error',
} as const;

export type ErrorType = typeof ERROR_TYPES[keyof typeof ERROR_TYPES];

export const STORAGE_BUCKET = 'events';

export const getEventImagePath = (eventId: string, imageId: string, size: 'small' | 'medium' | 'large'): string => {
  return `events/${eventId}/images/${size}/${imageId}.jpg`;
};

export const getEventFolderPath = (eventId: string): string => {
  return `events/${eventId}`;
};

export const extractYouTubeVideoId = (url: string): string | null => {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[4] : null;
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return YOUTUBE_URL_REGEX.test(url);
};

export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

export const validateEventData = (data: {
  title?: string;
  slug?: string;
  description?: string;
  event_date?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (data.title && data.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (!data.slug || data.slug.trim().length === 0) {
    errors.push('Slug is required');
  }

  if (data.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
    errors.push('Slug must be URL-safe (lowercase letters, numbers, and hyphens only)');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!data.event_date) {
    errors.push('Event date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
