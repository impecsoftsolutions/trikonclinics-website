import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Save, Image as ImageIcon, Video, Upload, X, AlertCircle, Trash2, Star, GripVertical, Play } from 'lucide-react';
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
  is_featured: boolean;
  created_at: string;
}

interface EventVideo {
  id: string;
  event_id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string | null;
  display_order: number;
  created_at: string;
}

interface SelectedFile {
  file: File;
  preview: string;
  id: string;
}

const MAX_PHOTOS = 20;
const MAX_VIDEOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
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
  const [videoError, setVideoError] = useState('');

  const [event, setEvent] = useState<Event | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<EventImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);

  const [videos, setVideos] = useState<EventVideo[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [showDeleteVideoConfirm, setShowDeleteVideoConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<EventVideo | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<EventImage | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    short_description: ''
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
      fetchPhotos();
      fetchVideos();
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

  const fetchVideos = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_videos')
        .select('*')
        .eq('event_id', id)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;

      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching videos:', err);
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const fetchYouTubeMetadata = async (videoId: string): Promise<{ title: string } | null> => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );

      if (!response.ok) return null;

      const data = await response.json();
      return { title: data.title || 'Untitled Video' };
    } catch (err) {
      console.error('Error fetching YouTube metadata:', err);
      return null;
    }
  };

  const handleAddVideo = async () => {
    setVideoError('');

    if (!videoUrl.trim()) {
      setVideoError('Please enter a YouTube URL');
      return;
    }

    if (videos.length >= MAX_VIDEOS) {
      setVideoError(`Maximum ${MAX_VIDEOS} videos allowed per event`);
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrl.trim());
    if (!videoId) {
      setVideoError('Invalid YouTube URL. Please use a valid YouTube link.');
      return;
    }

    const isDuplicate = videos.some(v => v.youtube_video_id === videoId);
    if (isDuplicate) {
      setVideoError('This video has already been added');
      return;
    }

    setAddingVideo(true);

    try {
      const metadata = await fetchYouTubeMetadata(videoId);
      const nextOrder = videos.length > 0
        ? Math.max(...videos.map(v => v.display_order)) + 1
        : 0;

      const { data, error: insertError } = await supabase
        .from('event_videos')
        .insert({
          event_id: id,
          youtube_url: videoUrl.trim(),
          youtube_video_id: videoId,
          title: metadata?.title || null,
          display_order: nextOrder
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setVideos(prev => [...prev, data]);
      setVideoUrl('');
      setSuccess('Video added successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error adding video:', err);
      setVideoError('Failed to add video. Please try again.');
    } finally {
      setAddingVideo(false);
    }
  };

  const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const handleVideoClick = (videoId: string) => {
    setCurrentVideoId(videoId);
    setShowVideoPlayer(true);
  };

  const handleVideoDragStart = (videoId: string) => {
    setDraggedVideoId(videoId);
  };

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleVideoDrop = async (e: React.DragEvent, targetVideoId: string) => {
    e.preventDefault();
    if (!draggedVideoId || draggedVideoId === targetVideoId) {
      setDraggedVideoId(null);
      return;
    }

    const draggedIndex = videos.findIndex(v => v.id === draggedVideoId);
    const targetIndex = videos.findIndex(v => v.id === targetVideoId);

    const newVideos = [...videos];
    const [removed] = newVideos.splice(draggedIndex, 1);
    newVideos.splice(targetIndex, 0, removed);

    const updatedVideos = newVideos.map((video, index) => ({
      ...video,
      display_order: index
    }));

    setVideos(updatedVideos);

    try {
      const updates = updatedVideos.map(video =>
        supabase
          .from('event_videos')
          .update({ display_order: video.display_order })
          .eq('id', video.id)
      );

      await Promise.all(updates);

      setSuccess('Videos reordered!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error reordering videos:', err);
      setVideoError('Failed to reorder videos.');
      fetchVideos();
    } finally {
      setDraggedVideoId(null);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      const { error: dbError } = await supabase
        .from('event_videos')
        .delete()
        .eq('id', videoToDelete.id);

      if (dbError) throw dbError;

      setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));

      setSuccess('Video deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error deleting video:', err);
      setVideoError('Failed to delete video.');
    } finally {
      setShowDeleteVideoConfirm(false);
      setVideoToDelete(null);
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
        const fileToUpload = selectedFile.file;
        const fileExt = selectedFile.file.name.split('.').pop();
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        uploadedUrls.push({
          url: publicUrl,
          size: fileToUpload.size
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
        display_order: nextOrder + index,
        is_featured: uploadedPhotos.length === 0 && index === 0
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

  const handleSetFeatured = async (photoId: string) => {
    try {
      await supabase
        .from('event_images')
        .update({ is_featured: false })
        .eq('event_id', id);

      const { error: updateError } = await supabase
        .from('event_images')
        .update({ is_featured: true })
        .eq('id', photoId);

      if (updateError) throw updateError;

      setUploadedPhotos(prev =>
        prev.map(p => ({ ...p, is_featured: p.id === photoId }))
      );

      setSuccess('Featured image updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error setting featured image:', err);
      setPhotoError('Failed to set featured image.');
    }
  };

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      const urlParts = photoToDelete.original_url.split('/');
      const fileName = urlParts.slice(-2).join('/');

      const { error: storageError } = await supabase.storage
        .from('event-images')
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('event_images')
        .delete()
        .eq('id', photoToDelete.id);

      if (dbError) throw dbError;

      setUploadedPhotos(prev => prev.filter(p => p.id !== photoToDelete.id));

      setSuccess('Photo deleted successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error deleting photo:', err);
      setPhotoError('Failed to delete photo.');
    } finally {
      setShowDeleteConfirm(false);
      setPhotoToDelete(null);
    }
  };

  const handleDragStart = (photoId: string) => {
    setDraggedPhotoId(photoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetPhotoId: string) => {
    e.preventDefault();
    if (!draggedPhotoId || draggedPhotoId === targetPhotoId) {
      setDraggedPhotoId(null);
      return;
    }

    const draggedIndex = uploadedPhotos.findIndex(p => p.id === draggedPhotoId);
    const targetIndex = uploadedPhotos.findIndex(p => p.id === targetPhotoId);

    const newPhotos = [...uploadedPhotos];
    const [removed] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(targetIndex, 0, removed);

    const updatedPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      display_order: index
    }));

    setUploadedPhotos(updatedPhotos);

    try {
      const updates = updatedPhotos.map(photo =>
        supabase
          .from('event_images')
          .update({ display_order: photo.display_order })
          .eq('id', photo.id)
      );

      await Promise.all(updates);

      setSuccess('Photos reordered!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error reordering photos:', err);
      setPhotoError('Failed to reorder photos.');
      fetchPhotos();
    } finally {
      setDraggedPhotoId(null);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleCancel = () => {
    navigate('/admin/events');
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
    <div className="space-y-6 pb-24">
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
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Photos (drag to reorder)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => handleDragStart(photo.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, photo.id)}
                    className={`relative group cursor-move ${
                      draggedPhotoId === photo.id ? 'opacity-50' : ''
                    }`}
                  >
                    <img
                      src={photo.original_url}
                      alt="Event"
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />

                    <div className="absolute top-2 left-2">
                      <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>

                    {photo.is_featured && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Featured
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg p-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSetFeatured(photo.id)}
                        disabled={photo.is_featured}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                      >
                        <Star className="w-3 h-3" />
                        {photo.is_featured ? 'Featured' : 'Set Featured'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPhotoToDelete(photo);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Videos</h2>
            <span className="text-sm text-gray-500">
              ({videos.length}/{MAX_VIDEOS} videos)
            </span>
          </div>
        </div>

        {videoError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{videoError}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={addingVideo || videos.length >= MAX_VIDEOS}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVideo();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddVideo}
              disabled={addingVideo || videos.length >= MAX_VIDEOS}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Video className="w-5 h-5" />
              {addingVideo ? 'Adding...' : 'Add Video'}
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Supported formats: YouTube video links (watch, youtu.be, embed). Max {MAX_VIDEOS} videos.
          </p>

          {videos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Added Videos (drag to reorder)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    draggable
                    onDragStart={() => handleVideoDragStart(video.id)}
                    onDragOver={handleVideoDragOver}
                    onDrop={(e) => handleVideoDrop(e, video.id)}
                    className={`relative group cursor-move transition-opacity ${
                      draggedVideoId === video.id ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>

                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoToDelete(video);
                          setShowDeleteVideoConfirm(true);
                        }}
                        className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                        title="Delete video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => handleVideoClick(video.youtube_video_id)}
                    >
                      <img
                        src={getYouTubeThumbnail(video.youtube_video_id)}
                        alt={video.title || 'Video'}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {video.title || 'Untitled Video'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {videos.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No videos added yet</p>
              <p className="text-sm text-gray-500 mt-1">Paste a YouTube URL above to add videos</p>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Photo?</h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this photo? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPhotoToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteVideoConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Delete Video?</h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this video? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteVideoConfirm(false);
                    setVideoToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVideoPlayer && currentVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl">
            <button
              onClick={() => {
                setShowVideoPlayer(false);
                setCurrentVideoId(null);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-black rounded-lg overflow-hidden" style={{ paddingTop: '56.25%', position: 'relative' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
