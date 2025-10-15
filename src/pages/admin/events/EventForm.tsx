import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { canManageContent } from '../../../utils/permissions';
import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from '../../../components/events/Toast';
import {
  generateSlugFromTitle,
  validateSlug,
  createSlugRedirect,
  type SlugValidationResult,
} from '../../../utils/eventSlugUtils';
import { logValidationError, logDatabaseError } from '../../../utils/eventErrorLogger';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader,
  Calendar,
  Clock,
  MapPin,
  Tag,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Film,
  GripVertical,
  Upload,
} from 'lucide-react';

interface Category {
  id: string;
  tag_name: string;
  slug: string;
}

interface EventImage {
  id: string;
  image_url_small: string;
  image_url_medium: string;
  image_url_large: string;
  alt_text: string | null;
  display_order: number;
  is_featured?: boolean;
}

interface EventVideo {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  display_order: number;
}

interface EventFormData {
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  venue: string;
  tags: string[];
  status: 'draft' | 'published';
  is_featured: boolean;
  short_description: string;
  full_description: string;
  highlights: string[];
}

interface ValidationErrors {
  [key: string]: string;
}

interface LoadedEvent {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  highlights: string[] | null;
  status: 'draft' | 'published';
  is_featured: boolean;
  event_tags: Array<{ tags: { id: string; tag_name: string; slug: string } }>;
}

export const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const isEditMode = Boolean(id);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slugCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [originalSlug, setOriginalSlug] = useState('');
  const [slugValidation, setSlugValidation] = useState<SlugValidationResult>({
    isValid: true,
    isAvailable: true,
  });
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    slug: '',
    event_date: new Date().toISOString().split('T')[0],
    event_time: '',
    venue: '',
    tags: [],
    status: 'draft',
    is_featured: false,
    short_description: '',
    full_description: '',
    highlights: [''],
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const [featuredImage, setFeaturedImage] = useState<EventImage | null>(null);
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [galleryImages, setGalleryImages] = useState<EventImage[]>([]);
  const [videos, setVideos] = useState<EventVideo[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [draggedVideoIndex, setDraggedVideoIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canManageContent(user.role)) {
      navigate('/admin/events/dashboard');
      error('You do not have permission to manage events');
      return;
    }

    loadCategories();

    if (isEditMode && id) {
      loadEvent(id);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      if (slugCheckTimerRef.current) {
        clearTimeout(slugCheckTimerRef.current);
      }
    };
  }, [user, navigate, isEditMode, id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (isDirty && !autoSaveTimerRef.current && isEditMode) {
      autoSaveTimerRef.current = setInterval(() => {
        handleAutoSave();
      }, 120000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [isDirty, isEditMode]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('🔍 [EventForm] Starting to load categories from database...');

      const { data, error: categoriesError } = await supabase
        .from('tags')
        .select('*')
        .order('tag_name');

      console.log('📦 [EventForm] Categories query result:', { data, error: categoriesError });
      console.log('📊 [EventForm] Number of categories found:', data?.length || 0);

      if (categoriesError) {
        console.error('❌ [EventForm] Error loading categories:', categoriesError);
        throw categoriesError;
      }

      if (data) {
        console.log('✅ [EventForm] Categories loaded successfully:', data);
        setAllCategories(data);
      } else {
        console.warn('⚠️ [EventForm] No categories data returned from database');
      }
    } catch (err) {
      console.error('❌ [EventForm] Exception loading categories:', err);
      error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
      console.log('🏁 [EventForm] Categories loading complete');
    }
  };

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('events')
        .select(
          `
          *,
          event_tags!event_tags_event_id_fkey (
            tags!event_tags_tag_id_fkey (
              id,
              tag_name,
              slug
            )
          )
        `
        )
        .eq('id', eventId)
        .maybeSingle();

      if (loadError) throw loadError;

      if (!data) {
        error('Event not found');
        navigate('/admin/events/list');
        return;
      }

      const event = data as unknown as LoadedEvent;
      const loadedTags = event.event_tags?.map((et) => et.tags.id).filter(Boolean) || [];

      setFormData({
        title: event.title,
        slug: event.slug,
        event_date: event.event_date.split('T')[0],
        event_time: event.event_time || '',
        venue: event.venue || '',
        tags: loadedTags,
        status: event.status,
        is_featured: event.is_featured,
        short_description: event.short_description,
        full_description: event.full_description,
        highlights: event.highlights && event.highlights.length > 0 ? event.highlights : [''],
      });

      setOriginalSlug(event.slug);
      setIsDirty(false);

      if (id) {
        await loadMedia(id);
      }
    } catch (err) {
      console.error('Error loading event:', err);
      error('Failed to load event');
      navigate('/admin/events/list');
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async (eventId: string) => {
    try {
      const { data: images, error: imagesError } = await supabase
        .from('event_images')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order');

      if (imagesError) throw imagesError;

      if (images && images.length > 0) {
        const featured = images.find(img => img.display_order === 0);
        if (featured) {
          setFeaturedImage(featured);
          setFeaturedImageAlt(featured.alt_text || '');
        }
        const gallery = images.filter(img => img.display_order > 0);
        setGalleryImages(gallery);
      }

      const { data: vids, error: videosError } = await supabase
        .from('event_videos')
        .select('*')
        .eq('event_id', eventId)
        .order('display_order');

      if (videosError) throw videosError;

      if (vids) {
        setVideos(vids);
      }
    } catch (err) {
      console.error('Error loading media:', err);
      error('Failed to load media');
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);

    if (touchedFields.has(field)) {
      validateField(field, value);
    }
  };

  const handleTitleChange = (value: string) => {
    handleInputChange('title', value);

    if (!isEditMode || (isEditMode && !touchedFields.has('slug'))) {
      const generatedSlug = generateSlugFromTitle(value);
      handleInputChange('slug', generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    const cleanedSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, slug: cleanedSlug }));
    setIsDirty(true);
    setTouchedFields((prev) => new Set(prev).add('slug'));

    if (slugCheckTimerRef.current) {
      clearTimeout(slugCheckTimerRef.current);
    }

    slugCheckTimerRef.current = setTimeout(() => {
      checkSlugAvailability(cleanedSlug);
    }, 300);
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug) return;

    setCheckingSlug(true);
    const result = await validateSlug(slug, id);
    setSlugValidation(result);
    setCheckingSlug(false);

    if (!result.isAvailable) {
      setValidationErrors((prev) => ({
        ...prev,
        slug: result.error || 'Slug is not available',
      }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.slug;
        return newErrors;
      });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => {
      const newCategories = prev.tags.includes(categoryId)
        ? prev.tags.filter((t) => t !== categoryId)
        : [...prev.tags, categoryId];
      return { ...prev, tags: newCategories };
    });
    setIsDirty(true);
  };

  const handleAddHighlight = () => {
    if (formData.highlights.length < 10) {
      setFormData((prev) => ({
        ...prev,
        highlights: [...prev.highlights, ''],
      }));
      setIsDirty(true);
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleHighlightChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) => (i === index ? value : h)),
    }));
    setIsDirty(true);
  };

  const handleFieldBlur = (field: keyof EventFormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof EventFormData, value: any): string | null => {
    let errorMsg: string | null = null;

    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) {
          errorMsg = 'Title is required';
        } else if (value.length > 75) {
          errorMsg = 'Title must be 75 characters or less';
        }
        break;

      case 'slug':
        if (!slugValidation.isAvailable) {
          errorMsg = slugValidation.error || 'Slug is not available';
        }
        break;

      case 'short_description':
        if (value && value.length > 500) {
          errorMsg = 'Short description must be 500 characters or less';
        }
        break;

      case 'venue':
        if (value && value.length > 200) {
          errorMsg = 'Venue must be 200 characters or less';
        }
        break;
    }

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (errorMsg) {
        newErrors[field] = errorMsg;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });

    return errorMsg;
  };

  const validateForm = (forPublish: boolean = false): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.title || formData.title.trim().length === 0) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 75) {
      errors.title = 'Title must be 75 characters or less';
    }

    if (!slugValidation.isAvailable) {
      errors.slug = slugValidation.error || 'Slug is not available';
    }

    if (formData.short_description && formData.short_description.length > 500) {
      errors.short_description = 'Short description must be 500 characters or less';
    }

    if (formData.venue && formData.venue.length > 200) {
      errors.venue = 'Venue must be 200 characters or less';
    }

    if (forPublish) {
      if (!featuredImage) {
        errors.featured_image = 'Featured image is required to publish';
      } else if (!featuredImageAlt || featuredImageAlt.trim().length === 0) {
        errors.featured_image_alt = 'Featured image ALT text is required to publish';
      }

      const imagesWithoutAlt = galleryImages.filter(img => !img.alt_text || img.alt_text.trim().length === 0);
      if (imagesWithoutAlt.length > 0) {
        errors.gallery_alt = `${imagesWithoutAlt.length} gallery image(s) missing ALT text`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAutoSave = async () => {
    if (!isEditMode || !id || saving || autoSaving || Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setAutoSaving(true);
      await saveEvent('draft', true);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setAutoSaving(false);
    }
  };

  const saveEvent = async (status: 'draft' | 'published', isAutoSave = false) => {
    if (!user) return;

    try {
      if (!isAutoSave) {
        setSaving(true);
      }

      const cleanedHighlights = formData.highlights.filter((h) => h.trim().length > 0);

      const eventData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        short_description: formData.short_description.trim(),
        full_description: formData.full_description.trim(),
        event_date: formData.event_date,
        event_time: formData.event_time || null,
        venue: formData.venue.trim() || null,
        highlights: cleanedHighlights.length > 0 ? cleanedHighlights : null,
        status,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      let eventId = id;

      if (isEditMode && id) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', id);

        if (updateError) throw updateError;

        if (originalSlug !== formData.slug) {
          await createSlugRedirect(originalSlug, formData.slug, id);
          setOriginalSlug(formData.slug);
        }
      } else {
        const { data: newEvent, error: insertError } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        if (!newEvent) throw new Error('Failed to create event');

        eventId = newEvent.id;
      }

      if (eventId) {
        const { error: deleteTagsError } = await supabase
          .from('event_tags')
          .delete()
          .eq('event_id', eventId);

        if (deleteTagsError) throw deleteTagsError;

        if (formData.tags.length > 0) {
          const tagInserts = formData.tags.map((tagId) => ({
            event_id: eventId,
            tag_id: tagId,
          }));

          const { error: insertTagsError } = await supabase
            .from('event_tags')
            .insert(tagInserts);

          if (insertTagsError) throw insertTagsError;
        }
      }

      if (eventId) {
        if (featuredImage && featuredImageAlt !== (featuredImage.alt_text || '')) {
          await supabase
            .from('event_images')
            .update({ alt_text: featuredImageAlt })
            .eq('id', featuredImage.id);
        }

        for (const galleryImage of galleryImages) {
          await supabase
            .from('event_images')
            .update({ alt_text: galleryImage.alt_text })
            .eq('id', galleryImage.id);
        }
      }

      setIsDirty(false);
      setLastSaved(new Date());

      if (!isAutoSave) {
        if (status === 'published') {
          success('Event published successfully');
        } else {
          success('Draft saved successfully');
        }

        if (!isEditMode && eventId) {
          navigate(`/admin/events/edit/${eventId}`, { replace: true });
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      await logDatabaseError('save_event', err as Error, { event_id: id, is_auto_save: isAutoSave });

      if (!isAutoSave) {
        error('Failed to save event');
      }
    } finally {
      if (!isAutoSave) {
        setSaving(false);
      }
    }
  };

  const handleFeaturedImageUpload = async (file: File) => {
    if (!id) {
      error('Please save the event first before uploading images');
      return;
    }

    setUploadingMedia(true);
    try {
      const { uploadEventImage } = await import('../../../utils/eventImageUpload');
      const result = await uploadEventImage(file, id, formData.slug, featuredImageAlt, 0);

      if (result.success && result.imageId && result.urls) {
        setFeaturedImage({
          id: result.imageId,
          image_url_small: result.urls.small,
          image_url_medium: result.urls.medium,
          image_url_large: result.urls.large,
          alt_text: featuredImageAlt,
          display_order: 0,
        });
        setIsDirty(true);
        success('Featured image uploaded successfully');
      } else {
        error(result.error || 'Failed to upload featured image');
      }
    } catch (err) {
      console.error('Featured image upload error:', err);
      error('Failed to upload featured image');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveFeaturedImage = async () => {
    if (!featuredImage || !id) return;

    if (!confirm('Remove featured image?')) return;

    setUploadingMedia(true);
    try {
      const { deleteEventImage } = await import('../../../utils/eventImageUpload');
      const deleted = await deleteEventImage(featuredImage.id, id);

      if (deleted) {
        setFeaturedImage(null);
        setFeaturedImageAlt('');
        setIsDirty(true);
        success('Featured image removed');
      } else {
        error('Failed to remove featured image');
      }
    } catch (err) {
      console.error('Error removing featured image:', err);
      error('Failed to remove featured image');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleGalleryImagesUpload = async (files: File[]) => {
    if (!id) {
      error('Please save the event first before uploading images');
      return;
    }

    if (galleryImages.length + files.length > 25) {
      error(`Can only upload ${25 - galleryImages.length} more image(s). Maximum 25 gallery images.`);
      return;
    }

    setUploadingMedia(true);
    try {
      const { uploadEventImages } = await import('../../../utils/eventImageUpload');
      const results = await uploadEventImages(files, id, formData.slug);

      const successfulUploads = results.filter(r => r.success);
      if (successfulUploads.length > 0) {
        await loadMedia(id);
        setIsDirty(true);
        success(`${successfulUploads.length} image(s) uploaded successfully`);
      }

      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        error(`${failures.length} image(s) failed to upload`);
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      error('Failed to upload gallery images');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveGalleryImage = async (imageId: string) => {
    if (!id) return;

    if (!confirm('Remove this image?')) return;

    setUploadingMedia(true);
    try {
      const { deleteEventImage } = await import('../../../utils/eventImageUpload');
      const deleted = await deleteEventImage(imageId, id);

      if (deleted) {
        setGalleryImages(prev => prev.filter(img => img.id !== imageId));
        setIsDirty(true);
        success('Image removed');
      } else {
        error('Failed to remove image');
      }
    } catch (err) {
      console.error('Error removing image:', err);
      error('Failed to remove image');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleGalleryImageAltChange = (imageId: string, altText: string) => {
    setGalleryImages(prev =>
      prev.map(img => (img.id === imageId ? { ...img, alt_text: altText } : img))
    );
    setIsDirty(true);
  };

  const handleAddVideo = async () => {
    if (!id) {
      error('Please save the event first before adding videos');
      return;
    }

    if (videos.length >= 10) {
      error('Maximum 10 videos per event');
      return;
    }

    if (!newVideoUrl.trim()) {
      setVideoUrlError('Please enter a YouTube URL');
      return;
    }

    const { extractYouTubeVideoId, isValidYouTubeUrl } = await import('../../../constants/events');

    if (!isValidYouTubeUrl(newVideoUrl)) {
      setVideoUrlError('Please enter a valid YouTube URL');
      return;
    }

    const videoId = extractYouTubeVideoId(newVideoUrl);
    if (!videoId) {
      setVideoUrlError('Could not extract video ID from URL');
      return;
    }

    setUploadingMedia(true);
    try {
      const { data, error: insertError } = await supabase
        .from('event_videos')
        .insert({
          event_id: id,
          youtube_url: newVideoUrl,
          youtube_video_id: videoId,
          display_order: videos.length,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setVideos(prev => [...prev, data]);
        setNewVideoUrl('');
        setVideoUrlError('');
        setIsDirty(true);
        success('Video added successfully');
      }
    } catch (err) {
      console.error('Error adding video:', err);
      error('Failed to add video');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!id) return;

    if (!confirm('Remove this video?')) return;

    setUploadingMedia(true);
    try {
      const { error: deleteError } = await supabase
        .from('event_videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) throw deleteError;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      setIsDirty(true);
      success('Video removed');
    } catch (err) {
      console.error('Error removing video:', err);
      error('Failed to remove video');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm(false)) {
      error('Please fix validation errors before saving');
      const firstError = Object.keys(validationErrors)[0];
      document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    await saveEvent('draft');
  };

  const handlePublish = async () => {
    if (!validateForm(true)) {
      error('Please fix validation errors before publishing');
      const firstError = Object.keys(validationErrors)[0];
      document.getElementById(firstError)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    await saveEvent('published');
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      navigate('/admin/events/list');
    }
  };

  const handleConfirmLeave = () => {
    setShowUnsavedWarning(false);
    navigate('/admin/events/list');
  };

  const handlePreview = () => {
    if (id) {
      window.open(`/events/${formData.slug}`, '_blank');
    }
  };

  if (!user || !canManageContent(user.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
                <p className="text-gray-600 text-sm">
                  You have unsaved changes. Are you sure you want to leave? All unsaved changes will be lost.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowUnsavedWarning(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Events List</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isEditMode ? 'Edit Event' : 'Add New Event'}
            </h1>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Last saved: {lastSaved.toLocaleTimeString()}
              </p>
            )}
            {autoSaving && (
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <Loader className="w-3 h-3 animate-spin" />
                Saving...
              </p>
            )}
          </div>
        </div>
      </div>

      <form className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              <p className="text-sm text-gray-500">Event details and metadata</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={() => handleFieldBlur('title')}
                placeholder="Enter event title (max 75 characters)"
                maxLength={75}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {validationErrors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.title}
                  </p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.title.length} / 75 characters
                </p>
              </div>
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                readOnly
                disabled
                placeholder="auto-generated-from-title"
                className="w-full px-4 py-2.5 border rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <div className="mt-1">
                {checkingSlug && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" />
                    Checking availability...
                  </p>
                )}
                {!checkingSlug && validationErrors.slug && (
                  <div>
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.slug}
                    </p>
                    {slugValidation.suggestion && (
                      <p className="text-sm text-gray-600 mt-1">
                        Suggestion:{' '}
                        <button
                          type="button"
                          onClick={() => handleSlugChange(slugValidation.suggestion!)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {slugValidation.suggestion}
                        </button>
                      </p>
                    )}
                  </div>
                )}
                {!checkingSlug && slugValidation.isAvailable && formData.slug && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Slug is available
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  This will be the event's web address
                </p>
              </div>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Date */}
              <div>
                <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date (optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    onBlur={() => handleFieldBlur('event_date')}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      validationErrors.event_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.event_date && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.event_date}
                  </p>
                )}
              </div>

              {/* Event Time */}
              <div>
                <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Time (optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => handleInputChange('event_time', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue / Location (optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  id="venue"
                  type="text"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  onBlur={() => handleFieldBlur('venue')}
                  placeholder="Enter event location or venue"
                  maxLength={200}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.venue ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                {validationErrors.venue && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.venue}
                  </p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.venue.length} / 200 characters
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category (optional)
              </label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading categories...</span>
                </div>
              ) : (
                <>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {allCategories.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories available</p>
                    ) : (
                      <div className="space-y-2">
                        {allCategories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.tags.includes(category.id)}
                              onChange={() => handleCategoryToggle(category.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{category.tag_name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.tags.map((categoryId) => {
                        const category = allCategories.find((c) => c.id === categoryId);
                        return category ? (
                          <span
                            key={categoryId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {category.tag_name}
                            <button
                              type="button"
                              onClick={() => handleCategoryToggle(categoryId)}
                              className="hover:text-blue-900 transition-colors"
                              title="Remove category"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  {validationErrors.tags && (
                    <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.tags}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Status and Featured */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'draft' | 'published')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Featured */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Event
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Mark this event as featured</p>
                    <p className="text-xs text-gray-500">Featured events appear in hero section</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Content</h2>
              <p className="text-sm text-gray-500">Event descriptions and highlights</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Short Description */}
            <div>
              <label htmlFor="short_description" className="block text-sm font-medium text-gray-700 mb-2">
                Short Description (optional)
              </label>
              <textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => handleInputChange('short_description', e.target.value)}
                onBlur={() => handleFieldBlur('short_description')}
                placeholder="Brief description (160-200 characters recommended)"
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  validationErrors.short_description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <div>
                  {validationErrors.short_description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.short_description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This appears on event cards in listings
                  </p>
                </div>
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.short_description.length} / 500 characters
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div>
              <label htmlFor="full_description" className="block text-sm font-medium text-gray-700 mb-2">
                Full Description (optional)
              </label>
              <textarea
                id="full_description"
                value={formData.full_description}
                onChange={(e) => handleInputChange('full_description', e.target.value)}
                onBlur={() => handleFieldBlur('full_description')}
                placeholder="Tell the complete story of the event"
                rows={8}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                  validationErrors.full_description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                <div>
                  {validationErrors.full_description && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {validationErrors.full_description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Provide complete details about the event (minimum 50 characters)
                  </p>
                </div>
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.full_description.length} characters
                </p>
              </div>
            </div>

            {/* Highlights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Key Highlights (optional)
                </label>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  disabled={formData.highlights.length >= 10}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Highlight
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Add 3-5 key highlights (max 10 items, 150 characters each)
              </p>
              <div className="space-y-3">
                {formData.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => handleHighlightChange(index, e.target.value)}
                        placeholder={`Highlight ${index + 1}`}
                        maxLength={150}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {highlight.length} / 150 characters
                      </p>
                    </div>
                    {formData.highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                        title="Remove highlight"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Media */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Media</h2>
              <p className="text-sm text-gray-500">Featured image, gallery photos, and videos</p>
            </div>
          </div>

          {!id ? (
            <div className="text-center py-12 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Save Event to Upload Media
              </h3>
              <p className="text-gray-600">
                Please save this event first, then you can add photos and videos
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {validationErrors.featured_image && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.featured_image}
                  </p>
                </div>
              )}

              {validationErrors.featured_image_alt && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.featured_image_alt}
                  </p>
                </div>
              )}

              {validationErrors.gallery_alt && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {validationErrors.gallery_alt}
                  </p>
                </div>
              )}

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image <span className="text-red-500">*</span> (required to publish)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  This image appears on event cards and at the top of the event page
                </p>

                {!featuredImage ? (
                  <div>
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFeaturedImageUpload(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={uploadingMedia}
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600 font-medium mb-1">
                            Click to upload featured image
                          </p>
                          <p className="text-xs text-gray-500">
                            JPG, PNG, or WebP • Max 10MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={featuredImage.image_url_medium}
                        alt={featuredImageAlt || 'Featured image'}
                        className="w-full max-w-md rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFeaturedImage}
                        disabled={uploadingMedia}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ALT Text <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={featuredImageAlt}
                        onChange={(e) => {
                          setFeaturedImageAlt(e.target.value);
                          setIsDirty(true);
                        }}
                        placeholder="Describe this image (recommended 125 characters)"
                        maxLength={200}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {featuredImageAlt.length} / 200 characters
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Gallery */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Photo Gallery (Optional)
                  </label>
                  <span className="text-sm text-gray-500">
                    {galleryImages.length} / 25 images
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Add up to 25 images for this event
                </p>

                {galleryImages.length < 25 && (
                  <div className="mb-4">
                    <label className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) handleGalleryImagesUpload(files);
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={uploadingMedia}
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <div className="text-center">
                          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Click to upload gallery images
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Select multiple files • JPG, PNG, or WebP • Max 10MB each
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <img
                            src={image.image_url_small}
                            alt={image.alt_text || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(image.id)}
                          disabled={uploadingMedia}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={image.alt_text || ''}
                            onChange={(e) => handleGalleryImageAltChange(image.id, e.target.value)}
                            placeholder="ALT text (required to publish)"
                            maxLength={200}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {(image.alt_text || '').length} / 200
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* YouTube Videos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    YouTube Videos (Optional)
                  </label>
                  <span className="text-sm text-gray-500">
                    {videos.length} / 10 videos
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Add up to 10 YouTube video links
                </p>

                {videos.length < 10 && (
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="url"
                          value={newVideoUrl}
                          onChange={(e) => {
                            setNewVideoUrl(e.target.value);
                            setVideoUrlError('');
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            videoUrlError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {videoUrlError && (
                          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {videoUrlError}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        disabled={uploadingMedia || !newVideoUrl.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Accepts: youtube.com/watch?v=, youtu.be/, or youtube.com/embed/ URLs
                    </p>
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="space-y-3">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex-shrink-0">
                          <img
                            src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                            alt="Video thumbnail"
                            className="w-32 h-20 object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 font-mono truncate">
                            {video.youtube_url}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Video ID: {video.youtube_video_id}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(video.id)}
                          disabled={uploadingMedia}
                          className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Sticky Footer with Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {isEditMode && id && (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving || autoSaving}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={saving || autoSaving}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
