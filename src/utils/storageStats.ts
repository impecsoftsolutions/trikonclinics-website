import { supabase } from '../lib/supabase';

export interface StorageStats {
  totalBytes: number;
  totalMB: number;
  totalGB: number;
  buckets: {
    name: string;
    sizeBytes: number;
    sizeMB: number;
    fileCount: number;
  }[];
  categories: {
    images: number;
    documents: number;
  };
}

export async function getStorageStats(): Promise<StorageStats> {
  const buckets = ['hospital-profile', 'doctors', 'testimonials', 'services', 'event-images'];

  const bucketStats = await Promise.all(
    buckets.map(async (bucketName) => {
      try {
        const { data, error } = await supabase.storage.from(bucketName).list('', {
          limit: 1000,
          offset: 0,
        });

        if (error) {
          console.error(`Error fetching ${bucketName}:`, error);
          return {
            name: bucketName,
            sizeBytes: 0,
            sizeMB: 0,
            fileCount: 0,
          };
        }

        const files = data || [];
        const totalSize = files.reduce((sum, file) => {
          const fileSize = (file.metadata as any)?.size || 0;
          return sum + fileSize;
        }, 0);

        return {
          name: bucketName,
          sizeBytes: totalSize,
          sizeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
          fileCount: files.length,
        };
      } catch (error) {
        console.error(`Exception fetching ${bucketName}:`, error);
        return {
          name: bucketName,
          sizeBytes: 0,
          sizeMB: 0,
          fileCount: 0,
        };
      }
    })
  );

  const totalBytes = bucketStats.reduce((sum, bucket) => sum + bucket.sizeBytes, 0);
  const totalMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
  const totalGB = parseFloat((totalBytes / (1024 * 1024 * 1024)).toFixed(2));

  const imagesBytes = totalBytes;
  const documentsBytes = 0;

  return {
    totalBytes,
    totalMB,
    totalGB,
    buckets: bucketStats,
    categories: {
      images: parseFloat((imagesBytes / (1024 * 1024)).toFixed(2)),
      documents: parseFloat((documentsBytes / (1024 * 1024)).toFixed(2)),
    },
  };
}

export function formatStorageSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);

  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  } else if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
}
