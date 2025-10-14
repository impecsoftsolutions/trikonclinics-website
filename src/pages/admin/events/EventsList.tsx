import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { canManageContent, canDeleteContent } from '../../../utils/permissions';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Send,
  FileX,
  Calendar,
} from 'lucide-react';
import { EVENTS_PAGE_SIZE } from '../../../constants/events';
import { EventThumbnail } from '../../../components/events/EventThumbnail';
import { TagBadges } from '../../../components/events/TagBadges';
import { EventStatusBadge } from '../../../components/events/EventStatusBadge';
import { TableSkeleton } from '../../../components/events/SkeletonLoader';
import { ToastContainer } from '../../../components/events/Toast';
import { ConfirmModal } from '../../../components/events/ConfirmModal';
import { useToast } from '../../../hooks/useToast';

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  tags: Array<{ id: string; tag_name: string; slug: string }>;
  created_by_username?: string;
}

interface Tag {
  id: string;
  tag_name: string;
  slug: string;
}

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

type SortField = 'date' | 'title' | 'status';
type SortOrder = 'asc' | 'desc';

export const EventsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>(
    (searchParams.get('status') as any) || 'all'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sortField, setSortField] = useState<SortField>(
    (searchParams.get('sortField') as SortField) || 'date'
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (searchParams.get('sortOrder') as SortOrder) || 'desc'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    page_size: EVENTS_PAGE_SIZE,
    total_pages: 1,
  });

  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!canManageContent(user.role)) {
      navigate('/admin/dashboard');
      error('You do not have permission to access Events');
      return;
    }

    loadTags();
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    updateURLParams();
    loadEvents();
  }, [searchTerm, statusFilter, selectedTags, dateFrom, dateTo, sortField, sortOrder, currentPage]);

  const updateURLParams = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sortField !== 'date') params.set('sortField', sortField);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  };

  const loadTags = async () => {
    try {
      const { data, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('tag_name');

      if (tagsError) throw tagsError;
      if (data) setAllTags(data);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('events')
        .select(
          `
          id,
          title,
          slug,
          event_date,
          status,
          created_at,
          updated_at,
          event_images!event_images_event_id_fkey (
            image_url_small
          ),
          event_tags!event_tags_event_id_fkey (
            tags!event_tags_tag_id_fkey (
              id,
              tag_name,
              slug
            )
          ),
          users!events_created_by_fkey (
            username
          )
        `,
          { count: 'exact' }
        );

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (dateFrom) {
        query = query.gte('event_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('event_date', dateTo);
      }

      if (sortField === 'date') {
        query = query.order('event_date', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'title') {
        query = query.order('title', { ascending: sortOrder === 'asc' });
      } else if (sortField === 'status') {
        query = query.order('status', { ascending: sortOrder === 'asc' });
      }

      query = query.order('created_at', { ascending: false });

      const from = (currentPage - 1) * EVENTS_PAGE_SIZE;
      const to = from + EVENTS_PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      let filteredData = data || [];

      if (selectedTags.length > 0) {
        filteredData = filteredData.filter((event: any) => {
          const eventTags = event.event_tags?.map((et: any) => et.tags?.slug).filter(Boolean) || [];
          return selectedTags.some((tag) => eventTags.includes(tag));
        });
      }

      const formattedData = filteredData.map((event: any) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_date: event.event_date,
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at,
        thumbnail_url: event.event_images?.[0]?.image_url_small || null,
        tags: event.event_tags?.map((et: any) => et.tags).filter(Boolean) || [],
        created_by_username: event.users?.username || 'Unknown',
      }));

      setEvents(formattedData);
      setPagination({
        total: count || 0,
        page: currentPage,
        page_size: EVENTS_PAGE_SIZE,
        total_pages: Math.ceil((count || 0) / EVENTS_PAGE_SIZE),
      });
    } catch (err) {
      console.error('Error loading events:', err);
      error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedTags([]);
    setDateFrom('');
    setDateTo('');
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const activeFilterCount =
    (searchTerm ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    selectedTags.length +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const handleSelectAll = () => {
    if (selectedEvents.size === events.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(events.map((e) => e.id)));
    }
  };

  const handleSelectEvent = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleDelete = async (eventId: string) => {
    try {
      setDeleting(true);
      const { error: deleteError } = await supabase.rpc('delete_event_cascade', {
        p_event_id: eventId,
      });

      if (deleteError) throw deleteError;

      success('Event deleted successfully');
      setShowDeleteModal(false);
      setEventToDelete(null);
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkPublish = async () => {
    try {
      const eventIds = Array.from(selectedEvents);
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .in('id', eventIds)
        .eq('status', 'draft');

      if (updateError) throw updateError;

      success(`${eventIds.length} events published successfully`);
      setSelectedEvents(new Set());
      loadEvents();
    } catch (err) {
      console.error('Error bulk publishing:', err);
      error('Failed to publish events');
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const eventIds = Array.from(selectedEvents);
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'draft', updated_at: new Date().toISOString() })
        .in('id', eventIds)
        .eq('status', 'published');

      if (updateError) throw updateError;

      success(`${eventIds.length} events unpublished successfully`);
      setSelectedEvents(new Set());
      loadEvents();
    } catch (err) {
      console.error('Error bulk unpublishing:', err);
      error('Failed to unpublish events');
    }
  };

  const handleBulkDelete = async () => {
    try {
      setDeleting(true);
      const eventIds = Array.from(selectedEvents);

      for (const eventId of eventIds) {
        const { error: deleteError } = await supabase.rpc('delete_event_cascade', {
          p_event_id: eventId,
        });
        if (deleteError) throw deleteError;
      }

      success(`${eventIds.length} events deleted successfully`);
      setShowBulkDeleteModal(false);
      setSelectedEvents(new Set());
      loadEvents();
    } catch (err) {
      console.error('Error bulk deleting:', err);
      error('Failed to delete events');
    } finally {
      setDeleting(false);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  if (!user || !canManageContent(user.role)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
        onConfirm={() => eventToDelete && handleDelete(eventToDelete)}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action will permanently delete the event and all associated images, videos, and tags. This cannot be undone."
        confirmText="Delete"
        isLoading={deleting}
      />

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Events"
        message={`Are you sure you want to delete ${selectedEvents.size} events? This action will permanently delete all selected events and their associated images, videos, and tags. This cannot be undone.`}
        confirmText={`Delete ${selectedEvents.size} Events`}
        isLoading={deleting}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">All Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {events.length > 0 ? (currentPage - 1) * EVENTS_PAGE_SIZE + 1 : 0}-
            {Math.min(currentPage * EVENTS_PAGE_SIZE, pagination.total)} of {pagination.total} events
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/events/add')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Event
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </label>
            <select
              multiple
              value={selectedTags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setSelectedTags(selected);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              size={3}
            >
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.slug}>
                  {tag.tag_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
              </span>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {selectedEvents.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-800">
              {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPublish}
                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                Bulk Publish
              </button>
              <button
                onClick={handleBulkUnpublish}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              >
                <FileX className="w-4 h-4" />
                Bulk Unpublish
              </button>
              {canDeleteContent(user.role) && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Bulk Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={events.length > 0 && selectedEvents.size === events.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Thumbnail
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Event Title
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Event Date
                    {renderSortIcon('date')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tags</th>
                <th
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 hidden lg:table-cell">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <TableSkeleton rows={5} />
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    {searchTerm || activeFilterCount > 0 ? (
                      <>
                        <p className="text-gray-600 font-medium mb-2">
                          No events found for "{searchTerm}"
                        </p>
                        <button
                          onClick={handleClearFilters}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600 font-medium mb-4">No events yet</p>
                        <button
                          onClick={() => navigate('/admin/events/add')}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                          Create your first event
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={() => handleSelectEvent(event.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <EventThumbnail imageUrl={event.thumbnail_url} alt={event.title} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                        className="text-left hover:text-blue-600 transition-colors"
                      >
                        <p className="font-medium text-gray-800">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.slug}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700">
                        {format(new Date(event.event_date), 'EEE, dd MMM yyyy')}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <TagBadges tags={event.tags} maxVisible={3} />
                    </td>
                    <td className="px-4 py-3">
                      <EventStatusBadge status={event.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-700">{event.created_by_username}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(event.updated_at), { addSuffix: true })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {canDeleteContent(user.role) && (
                          <button
                            onClick={() => {
                              setEventToDelete(event.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && pagination.total_pages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={currentPage === pagination.total_pages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
