import { supabase } from '../lib/supabase';

export type StorageBucket = 'hospital-profile' | 'doctors' | 'testimonials' | 'services';

interface UploadResult {
  url: string | null;
  error: string | null;
}

export async function uploadImage(
  file: File,
  bucket: StorageBucket,
  path?: string
): Promise<UploadResult> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
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
  const maxSize = 5 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, WebP, and GIF images are allowed' };
  }

  return { valid: true };
}
