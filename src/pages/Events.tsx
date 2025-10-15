import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Edit2, Trash2, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EventImage {
  id: string;
  event_id: string;
  thumbnail_url: string;
  is_featured: boolean;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  status: 'draft' | 'published';
  created_at: string;
  created_by: string;
  updated_at: string;
  photos_count?: number;
  videos_count?: number;
  featured_image?: EventImage | null;
  first_image?: EventImage | null;
}

interface EventWithUser extends Event {
  created_by_email?: string;
}

export const Events: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_images!event_images_event_id_fkey(count),
          event_videos!event_videos_event_id_fkey(count)
        `)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;

      const eventIds = eventsData?.map(e => e.id) || [];

      const { data: imagesData } = await supabase
        .from('event_images')
        .select('id, event_id, thumbnail_url, is_featured, display_order')
        .in('event_id', eventIds)
        .order('display_order', { ascending: true });

      const imagesByEvent = new Map<string, EventImage[]>();
      imagesData?.forEach(img => {
        if (!imagesByEvent.has(img.event_id)) {
          imagesByEvent.set(img.event_id, []);
        }
        imagesByEvent.get(img.event_id)!.push(img);
      });

      const processedEvents = eventsData?.map(event => {
        const images = imagesByEvent.get(event.id) || [];
        const featuredImage = images.find(img => img.is_featured);
        const firstImage = images[0];

        return {
          ...event,
          photos_count: event.event_images?.[0]?.count || 0,
          videos_count: event.event_videos?.[0]?.count || 0,
          featured_image: featuredImage || null,
          first_image: firstImage || null
        };
      }) || [];

      const userIds = [...new Set(processedEvents.map(e => e.created_by).filter(Boolean))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const userMap = new Map(usersData?.map(u => [u.id, u.email]) || []);

      const eventsWithUsers = processedEvents.map(event => ({
        ...event,
        created_by_email: userMap.get(event.created_by) || 'Unknown'
      }));

      setEvents(eventsWithUsers);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: 'draft' | 'published') => {
    try {
      setPublishingId(id);
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';

      const { error } = await supabase
        .from('events')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setEvents(events.map(event =>
        event.id === id ? { ...event, status: newStatus } : event
      ));
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status. Please try again.');
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(events.filter(event => event.id !== id));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Events</h1>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-600 mb-4">Create your first event to get started!</p>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thumbnail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Photos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Videos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {event.featured_image || event.first_image ? (
                        <img
                          src={(event.featured_image || event.first_image)!.thumbnail_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500">Created by: {event.created_by_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(event.event_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      event.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status === 'published' ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.photos_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.videos_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                        title="Manage event content"
                      >
                        {((event.photos_count || 0) === 0 && (event.videos_count || 0) === 0) ? (
                          <Plus className="w-4 h-4" />
                        ) : (
                          <Edit2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleTogglePublish(event.id, event.status)}
                        disabled={publishingId === event.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors text-xs font-medium ${
                          event.status === 'draft'
                            ? 'text-green-600 hover:text-green-900 hover:bg-green-50'
                            : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'
                        } disabled:opacity-50`}
                        title={event.status === 'draft' ? 'Publish event' : 'Unpublish event'}
                      >
                        {event.status === 'draft' ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Publish
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Unpublish
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteId(event.id)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Event</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
