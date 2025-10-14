import { supabase } from '../lib/supabase';
import {
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGES_PER_EVENT,
  STORAGE_BUCKET,
  getEventImagePath,
} from '../constants/events';
import {
  logUploadError,
  logProcessingError,
  logStorageError,
  logValidationError,
} from './eventErrorLogger';

export interface ImageSize {
  width: number;
  quality: number;
  folder: 'small' | 'medium' | 'large';
}

export const IMAGE_SIZES: Record<string, ImageSize> = {
  small: { width: 200, quality: 85, folder: 'small' },
  medium: { width: 600, quality: 85, folder: 'medium' },
  large: { width: 1200, quality: 85, folder: 'large' },
};

export interface ImageUploadResult {
  success: boolean;
  imageId?: string;
  urls?: {
    small: string;
    medium: string;
    large: string;
  };
  error?: string;
}

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export async function validateImageFile(file: File, eventId: string): Promise<{ valid: boolean; error?: string }> {
  if (file.size > MAX_IMAGE_FILE_SIZE) {
    await logValidationError('file_size', file.size, `File size ${file.size} exceeds ${MAX_IMAGE_FILE_SIZE}`, eventId);
    return {
      valid: false,
      error: `File size must be less than ${MAX_IMAGE_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    await logValidationError('file_type', file.type, 'Invalid file type', eventId);
    return {
      valid: false,
      error: 'Only JPEG, PNG, WebP, and GIF images are allowed',
    };
  }

  const { data: existingImages } = await supabase
    .from('event_images')
    .select('id')
    .eq('event_id', eventId);

  if (existingImages && existingImages.length >= MAX_IMAGES_PER_EVENT) {
    await logValidationError('max_images', existingImages.length, `Event already has ${existingImages.length} images`, eventId);
    return {
      valid: false,
      error: `Maximum ${MAX_IMAGES_PER_EVENT} images per event`,
    };
  }

  return { valid: true };
}

export async function resizeImage(
  file: File,
  targetWidth: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      const aspectRatio = img.height / img.width;
      canvas.width = targetWidth;
      canvas.height = targetWidth * aspectRatio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality / 100
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function generateImageFilename(eventSlug: string, sequence: number): Promise<string> {
  const timestamp = Date.now();
  return `${eventSlug}-${timestamp}-${sequence}`;
}

export async function uploadEventImage(
  file: File,
  eventId: string,
  eventSlug: string,
  altText: string = '',
  sequence: number = 0,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResult> {
  try {
    onProgress?.(0);

    const validation = await validateImageFile(file, eventId);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    onProgress?.(10);

    const imageId = crypto.randomUUID();
    const filename = await generateImageFilename(eventSlug, sequence);

    onProgress?.(20);

    const smallBlob = await resizeImage(file, IMAGE_SIZES.small.width, IMAGE_SIZES.small.quality);
    onProgress?.(35);

    const mediumBlob = await resizeImage(file, IMAGE_SIZES.medium.width, IMAGE_SIZES.medium.quality);
    onProgress?.(50);

    const largeBlob = await resizeImage(file, IMAGE_SIZES.large.width, IMAGE_SIZES.large.quality);
    onProgress?.(65);

    const smallPath = getEventImagePath(eventId, imageId, 'small');
    const mediumPath = getEventImagePath(eventId, imageId, 'medium');
    const largePath = getEventImagePath(eventId, imageId, 'large');

    const { error: uploadErrorSmall } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(smallPath, smallBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorSmall) {
      await logUploadError(file.name, new Error(uploadErrorSmall.message), eventId);
      return { success: false, error: `Upload failed (small): ${uploadErrorSmall.message}` };
    }

    onProgress?.(75);

    const { error: uploadErrorMedium } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(mediumPath, mediumBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorMedium) {
      await supabase.storage.from(STORAGE_BUCKET).remove([smallPath]);
      await logUploadError(file.name, new Error(uploadErrorMedium.message), eventId);
      return { success: false, error: `Upload failed (medium): ${uploadErrorMedium.message}` };
    }

    onProgress?.(85);

    const { error: uploadErrorLarge } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(largePath, largeBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErrorLarge) {
      await supabase.storage.from(STORAGE_BUCKET).remove([smallPath, mediumPath]);
      await logUploadError(file.name, new Error(uploadErrorLarge.message), eventId);
      return { success: false, error: `Upload failed (large): ${uploadErrorLarge.message}` };
    }

    onProgress?.(90);

    const { data: { publicUrl: smallUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(smallPath);

    const { data: { publicUrl: mediumUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(mediumPath);

    const { data: { publicUrl: largeUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(largePath);

    const { data: displayOrderData } = await supabase.rpc('get_next_image_order', {
      p_event_id: eventId,
    });
    const displayOrder = displayOrderData || 0;

    const { error: dbError } = await supabase
      .from('event_images')
      .insert({
        id: imageId,
        event_id: eventId,
        image_url_small: smallUrl,
        image_url_medium: mediumUrl,
        image_url_large: largeUrl,
        alt_text: altText,
        display_order: displayOrder,
      });

    if (dbError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([smallPath, mediumPath, largePath]);
      await logStorageError('insert_database', new Error(dbError.message), undefined, eventId);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    onProgress?.(100);

    return {
      success: true,
      imageId,
      urls: {
        small: smallUrl,
        medium: mediumUrl,
        large: largeUrl,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logProcessingError(file.name, error instanceof Error ? error : new Error(errorMessage), eventId);
    return { success: false, error: errorMessage };
  }
}

export async function uploadEventImages(
  files: File[],
  eventId: string,
  eventSlug: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];
  const progressArray: UploadProgress[] = files.map((file, index) => ({
    fileIndex: index,
    fileName: file.name,
    progress: 0,
    status: 'pending',
  }));

  for (let i = 0; i < files.length; i++) {
    progressArray[i].status = 'processing';
    onProgress?.(progressArray);

    const result = await uploadEventImage(
      files[i],
      eventId,
      eventSlug,
      '',
      i,
      (progress) => {
        progressArray[i].progress = progress;
        onProgress?.(progressArray);
      }
    );

    results.push(result);

    if (result.success) {
      progressArray[i].status = 'completed';
      progressArray[i].progress = 100;
    } else {
      progressArray[i].status = 'failed';
      progressArray[i].error = result.error;
    }

    onProgress?.(progressArray);
  }

  return results;
}

export async function deleteEventImage(imageId: string, eventId: string): Promise<boolean> {
  try {
    const { data: imageData, error: fetchError } = await supabase
      .from('event_images')
      .select('image_url_small, image_url_medium, image_url_large')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageData) {
      await logStorageError('fetch_image_data', new Error(fetchError?.message || 'Image not found'), undefined, eventId);
      return false;
    }

    const smallPath = imageData.image_url_small.split(`/${STORAGE_BUCKET}/`)[1];
    const mediumPath = imageData.image_url_medium.split(`/${STORAGE_BUCKET}/`)[1];
    const largePath = imageData.image_url_large.split(`/${STORAGE_BUCKET}/`)[1];

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([smallPath, mediumPath, largePath]);

    if (storageError) {
      await logStorageError('delete_images', new Error(storageError.message), undefined, eventId);
    }

    const { error: dbError } = await supabase
      .from('event_images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      await logStorageError('delete_database_record', new Error(dbError.message), undefined, eventId);
      return false;
    }

    return true;
  } catch (error) {
    await logStorageError('delete_event_image', error instanceof Error ? error : new Error('Unknown error'), undefined, eventId);
    return false;
  }
}

export async function getEventImageUrls(imageId: string): Promise<{
  small: string;
  medium: string;
  large: string;
} | null> {
  const { data, error } = await supabase
    .from('event_images')
    .select('image_url_small, image_url_medium, image_url_large')
    .eq('id', imageId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    small: data.image_url_small,
    medium: data.image_url_medium,
    large: data.image_url_large,
  };
}
