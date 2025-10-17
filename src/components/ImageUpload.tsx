import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, deleteImage, validateImageFile, type StorageBucket } from '../utils/storage';

interface ImageUploadProps {
  currentImage: string | null;
  onImageChange: (url: string | null) => void;
  bucket: StorageBucket;
  label: string;
  required?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  bucket,
  label,
  required = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    const result = await uploadImage(file, bucket);
    setUploading(false);

    if (result.error) {
      setError(result.error);
      setPreview(currentImage);
    } else if (result.url) {
      onImageChange(result.url);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (currentImage) {
      await deleteImage(currentImage, bucket);
    }
    setPreview(null);
    onImageChange(null);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex items-start gap-4">
        <div
          onClick={handleClick}
          className={`
            relative w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer
            transition-colors flex items-center justify-center
            ${uploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          {uploading ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-blue-600">Uploading...</p>
            </div>
          ) : preview ? (
            <>
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity rounded-lg flex items-center justify-center">
                <Upload className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Click to upload</p>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-xs text-gray-500 space-y-1">
            <p>Supported formats: JPEG, PNG, WebP</p>
            <p>Maximum file size: 10MB (auto-compressed)</p>
          </div>

          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
              Remove Image
            </button>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
