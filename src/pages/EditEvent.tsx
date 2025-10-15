import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Save, Image as ImageIcon, Video, Upload, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/BackButton';

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  short_description: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

interface EventImage {
  id: string;
  event_id: string;
  original_url: string;
  medium_url: string;
  thumbnail_url: string;
  file_size_bytes: number;
  display_order: number;
  created_at: string;
}

interface SelectedFile {
  file: File;
  preview: string;
  id: string;
}

const MAX_PHOTOS = 20;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');

  const [event, setEvent] = useState<Event | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<EventImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    short_description: ''
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchPhotos();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles]);

  const fetchEvent = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Event not found');
        return;
      }

      setEvent(data);
      setFormData({
        title: data.title,
        event_date: data.event_date,
        short_description: data.short_description || ''
      });
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', id)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setUploadedPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const totalPhotos = uploadedPhotos.length + selectedFiles.length + files.length;
    if (totalPhotos > MAX_PHOTOS) {
      setPhotoError(`Maximum ${MAX_PHOTOS} photos allowed. You can add ${MAX_PHOTOS - uploadedPhotos.length - selectedFiles.length} more.`);
      return;
    }

    const validFiles: SelectedFile[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP allowed.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        return;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(7)
      });
    });

    if (errors.length > 0) {
      setPhotoError(errors.join(' '));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
    setPhotoError('');
  };

  const handleUploadPhotos = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setPhotoError('');
    setUploadProgress(0);

    try {
      const uploadedUrls: { url: string; size: number }[] = [];
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const selectedFile = selectedFiles[i];
        const fileExt = selectedFile.file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, selectedFile.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        uploadedUrls.push({
          url: publicUrl,
          size: selectedFile.file.size
        });

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      const nextOrder = uploadedPhotos.length > 0
        ? Math.max(...uploadedPhotos.map(p => p.display_order)) + 1
        : 0;

      const imagesToInsert = uploadedUrls.map((item, index) => ({
        event_id: id,
        original_url: item.url,
        medium_url: item.url,
        thumbnail_url: item.url,
        file_size_bytes: item.size,
        display_order: nextOrder + index
      }));

      const { data: insertedImages, error: insertError } = await supabase
        .from('event_images')
        .insert(imagesToInsert)
        .select();

      if (insertError) throw insertError;

      setUploadedPhotos(prev => [...prev, ...(insertedImages || [])]);

      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      setSelectedFiles([]);

      setSuccess(`Successfully uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}!`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error uploading photos:', err);
      setPhotoError('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getTotalDiskSpace = (): string => {
    const totalBytes = uploadedPhotos.reduce((sum, photo) => sum + photo.file_size_bytes, 0);
    return formatFileSize(totalBytes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.event_date) {
      setError('Event date is required');
      return;
    }

    if (formData.short_description.length > 200) {
      setError('Description must be 200 characters or less');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: formData.title.trim(),
          event_date: formData.event_date,
          short_description: formData.short_description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess('Event updated successfully!');

      setTimeout(() => {
        navigate('/admin/events');
      }, 1500);

    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading event...</div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="space-y-6">
        <BackButton to="/admin/events" />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton to="/admin/events" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Manage Event</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter event title"
            required
            disabled={saving}
          />
        </div>

        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
            Event Date *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              id="event_date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
            Short Description
            <span className="text-gray-500 text-xs ml-2">
              ({formData.short_description.length}/200 characters)
            </span>
          </label>
          <textarea
            id="short_description"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Brief description of the event"
            rows={3}
            maxLength={200}
            disabled={saving}
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
            <span className="text-sm text-gray-500">
              ({uploadedPhotos.length}/{MAX_PHOTOS} photos, {getTotalDiskSpace()} used)
            </span>
          </div>
        </div>

        {photoError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{photoError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading || uploadedPhotos.length >= MAX_PHOTOS}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || uploadedPhotos.length >= MAX_PHOTOS}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ImageIcon className="w-5 h-5" />
              Select Photos
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Max {MAX_PHOTOS} photos, 10MB each. Formats: JPEG, PNG, WebP
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedFiles.map((selectedFile) => (
                  <div key={selectedFile.id} className="relative group">
                    <img
                      src={selectedFile.preview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(selectedFile.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {selectedFile.file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.file.size)}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleUploadPhotos}
                disabled={uploading || selectedFiles.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-5 h-5" />
                {uploading ? `Uploading... ${uploadProgress}%` : `Upload ${selectedFiles.length} Photo${selectedFiles.length > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {uploadedPhotos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="group">
                    <img
                      src={photo.original_url}
                      alt="Event"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formatFileSize(photo.file_size_bytes)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadedPhotos.length === 0 && selectedFiles.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No photos uploaded yet</p>
              <p className="text-sm text-gray-500 mt-1">Click "Select Photos" to get started</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Video management coming in Phase 5</p>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
