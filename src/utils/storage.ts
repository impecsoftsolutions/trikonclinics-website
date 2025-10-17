import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export type StorageBucket = 'hospital-profile' | 'doctors' | 'testimonials' | 'services';

interface UploadResult {
  url: string | null;
  error: string | null;
}

const TARGET_SIZE_KB = 500;
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  useWebWorker: true,
  maxIteration: 10,
  fileType: 'image/jpeg',
};

async function compressImageIfNeeded(file: File): Promise<File> {
  if (file.size <= TARGET_SIZE_KB * 1024) {
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed, using original file:', error);
    return file;
  }
}

export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  path?: string
): Promise<UploadResult> {
  try {
    const compressedFile = await compressImageIfNeeded(file);

    const fileExt = compressedFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { url: null, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Upload exception:', error);
    return { url: null, error: 'Failed to upload image' };
  }
}

export async function deleteImage(url: string, bucket: StorageBucket): Promise<boolean> {
  try {
    const urlParts = url.split(`${bucket}/`);
    if (urlParts.length < 2) {
      console.error('Invalid URL format');
      return false;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  return { valid: true };
}
