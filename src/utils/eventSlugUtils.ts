import { supabase } from '../lib/supabase';
import { slugify } from './slugify';

export interface SlugValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
  suggestion?: string;
}

export const generateSlugFromTitle = (title: string): string => {
  return slugify(title);
};

export const isValidSlugFormat = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
};

export const checkSlugAvailability = async (
  slug: string,
  currentEventId?: string
): Promise<{ available: boolean; error?: string }> => {
  try {
    if (!slug || slug.trim().length === 0) {
      return { available: false, error: 'Slug is required' };
    }

    if (!isValidSlugFormat(slug)) {
      return {
        available: false,
        error: 'Slug must contain only lowercase letters, numbers, and hyphens',
      };
    }

    let query = supabase.from('events').select('id, slug').eq('slug', slug);

    if (currentEventId) {
      query = query.neq('id', currentEventId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error checking slug availability:', error);
      return { available: false, error: 'Failed to check slug availability' };
    }

    return { available: !data };
  } catch (err) {
    console.error('Exception checking slug:', err);
    return { available: false, error: 'Failed to check slug availability' };
  }
};

export const generateUniqueSlug = async (
  baseSlug: string,
  currentEventId?: string
): Promise<string> => {
  const { available } = await checkSlugAvailability(baseSlug, currentEventId);

  if (available) {
    return baseSlug;
  }

  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;

  while (true) {
    const { available: isAvailable } = await checkSlugAvailability(newSlug, currentEventId);

    if (isAvailable) {
      return newSlug;
    }

    counter++;
    newSlug = `${baseSlug}-${counter}`;

    if (counter > 100) {
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      return `${baseSlug}-${randomSuffix}`;
    }
  }
};

export const suggestAlternativeSlug = async (
  slug: string,
  currentEventId?: string
): Promise<string> => {
  return await generateUniqueSlug(slug, currentEventId);
};

export const validateSlug = async (
  slug: string,
  currentEventId?: string
): Promise<SlugValidationResult> => {
  if (!slug || slug.trim().length === 0) {
    return {
      isValid: false,
      isAvailable: false,
      error: 'Slug is required',
    };
  }

  if (slug.length > 100) {
    return {
      isValid: false,
      isAvailable: false,
      error: 'Slug must be less than 100 characters',
    };
  }

  if (!isValidSlugFormat(slug)) {
    return {
      isValid: false,
      isAvailable: false,
      error: 'Slug must contain only lowercase letters, numbers, and hyphens',
    };
  }

  const { available, error } = await checkSlugAvailability(slug, currentEventId);

  if (error) {
    return {
      isValid: true,
      isAvailable: false,
      error,
    };
  }

  if (!available) {
    const suggestion = await suggestAlternativeSlug(slug, currentEventId);
    return {
      isValid: true,
      isAvailable: false,
      error: 'This slug is already in use',
      suggestion,
    };
  }

  return {
    isValid: true,
    isAvailable: true,
  };
};

export const createSlugRedirect = async (
  oldSlug: string,
  newSlug: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (oldSlug === newSlug) {
      return { success: true };
    }

    const { error } = await supabase.from('url_redirects').insert({
      old_slug: oldSlug,
      new_slug: newSlug,
      event_id: eventId,
    });

    if (error) {
      console.error('Error creating slug redirect:', error);
      return { success: false, error: 'Failed to create URL redirect' };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception creating redirect:', err);
    return { success: false, error: 'Failed to create URL redirect' };
  }
};
