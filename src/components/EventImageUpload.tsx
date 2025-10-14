import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import {
  uploadEventImage,
  uploadEventImages,
  deleteEventImage,
  type UploadProgress,
} from '../utils/eventImageUpload';
import { MAX_IMAGES_PER_EVENT } from '../constants/events';

interface EventImageUploadProps {
  eventId: string;
  eventSlug: string;
  currentImages: Array<{
    id: string;
    image_url_small: string;
    image_url_medium: string;
    image_url_large: string;
    alt_text: string | null;
  }>;
  onImagesChange: () => void;
  mode?: 'single' | 'bulk';
}

export const EventImageUpload: React.FC<EventImageUploadProps> = ({
  eventId,
  eventSlug,
  currentImages,
  onImagesChange,
  mode = 'bulk',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = MAX_IMAGES_PER_EVENT - currentImages.length;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setSuccessMessage(null);

    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Maximum ${MAX_IMAGES_PER_EVENT} images per event.`);
      return;
    }

    if (mode === 'single' && files.length > 1) {
      setError('Please select only one image');
      return;
    }

    setUploading(true);

    try {
      if (files.length === 1) {
        const result = await uploadEventImage(
          files[0],
          eventId,
          eventSlug,
          '',
          currentImages.length,
          (progress) => {
            setUploadProgress([{
              fileIndex: 0,
              fileName: files[0].name,
              progress,
              status: 'processing',
            }]);
          }
        );

        if (result.success) {
          setSuccessMessage(`Image uploaded successfully!`);
          onImagesChange();
        } else {
          setError(result.error || 'Upload failed');
        }
      } else {
        const results = await uploadEventImages(
          files,
          eventId,
          eventSlug,
          (progress) => {
            setUploadProgress(progress);
          }
        );

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        if (successCount > 0) {
          setSuccessMessage(`${successCount} image(s) uploaded successfully!${failCount > 0 ? ` ${failCount} failed.` : ''}`);
          onImagesChange();
        }

        if (failCount > 0 && successCount === 0) {
          const errors = results
            .filter(r => !r.success)
            .map(r => r.error)
            .filter((e, i, arr) => arr.indexOf(e) === i);
          setError(errors.join(', '));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    const success = await deleteEventImage(imageId, eventId);
    if (success) {
      setSuccessMessage('Image deleted successfully');
      onImagesChange();
    } else {
      setError('Failed to delete image');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Event Images ({currentImages.length}/{MAX_IMAGES_PER_EVENT})
        </label>
        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
              ${uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
              transition-colors
            `}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : mode === 'single' ? 'Upload Image' : 'Upload Images'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        multiple={mode === 'bulk'}
        max={remainingSlots}
        className="hidden"
      />

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Supported formats: JPEG, PNG, WebP, GIF</p>
        <p>• Maximum file size: 10MB per image</p>
        <p>• Images will be automatically resized to 3 sizes (200px, 600px, 1200px width)</p>
        {mode === 'bulk' && <p>• You can upload up to {Math.min(remainingSlots, 25)} images at once</p>}
      </div>

      {uploading && uploadProgress.length > 0 && (
        <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-900">Uploading...</p>
          {uploadProgress.map((progress) => (
            <div key={progress.fileIndex} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 truncate flex-1">{progress.fileName}</span>
                <span className="text-gray-500 ml-2">
                  {progress.status === 'completed' && <Check className="w-4 h-4 text-green-600" />}
                  {progress.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  {progress.status === 'processing' && `${Math.round(progress.progress)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress.status === 'completed'
                      ? 'bg-green-600'
                      : progress.status === 'failed'
                      ? 'bg-red-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.error && (
                <p className="text-xs text-red-600">{progress.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
          {successMessage}
        </div>
      )}

      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {currentImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={image.image_url_small}
                  alt={image.alt_text || 'Event image'}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="
                  absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:bg-red-700
                "
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate">{image.alt_text || 'No alt text'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentImages.length === 0 && !uploading && (
        <div
          onClick={handleClick}
          className="
            border-2 border-dashed border-gray-300 rounded-lg p-12
            flex flex-col items-center justify-center cursor-pointer
            hover:border-blue-400 hover:bg-blue-50 transition-colors
          "
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center">
            Click to upload {mode === 'single' ? 'an image' : 'images'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            or drag and drop (coming soon)
          </p>
        </div>
      )}
    </div>
  );
};
