import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { canManageContent } from '../../../utils/permissions';
import { format, formatDistanceToNow, startOfMonth, endOfMonth } from 'date-fns';
import {
  Calendar,
  FileText,
  CheckCircle,
  TrendingUp,
  Plus,
  Edit2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { EventThumbnail } from '../../../components/events/EventThumbnail';
import { CategoryBadges } from '../../../components/events/CategoryBadges';
import { StatCardSkeleton, EventCardSkeleton } from '../../../components/events/SkeletonLoader';
import { ToastContainer } from '../../../components/events/Toast';
import { useToast } from '../../../hooks/useToast';

interface EventStatistics {
  total_events: number;
  published_events: number;
  draft_events: number;
  events_this_month: number;
}

interface RecentEvent {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  thumbnail_url?: string;
  categories: Array<{ id: string; tag_name: string; slug: string }>;
  created_by_username?: string;
}

export const EventsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [statistics, setStatistics] = useState<EventStatistics>({
    total_events: 0,
    published_events: 0,
    draft_events: 0,
    events_this_month: 0,
  });
  const [recentPublished, setRecentPublished] = useState<RecentEvent[]>([]);
  const [recentDrafts, setRecentDrafts] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

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

    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStatistics(), loadRecentPublished(), loadRecentDrafts()]);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const { data, error: statsError } = await supabase.rpc('get_event_statistics');

      if (statsError) throw statsError;

      if (data) {
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());

        const { count } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('event_date', monthStart.toISOString())
          .lte('event_date', monthEnd.toISOString());

        setStatistics({
          total_events: data.total_events || 0,
          published_events: data.published_events || 0,
          draft_events: data.draft_events || 0,
          events_this_month: count || 0,
        });
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
      throw err;
    }
  };

  const loadRecentPublished = async () => {
    try {
      const { data, error: queryError } = await supabase
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
        `
        )
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (queryError) throw queryError;

      const formattedData = data?.map((event: any) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_date: event.event_date,
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at,
        thumbnail_url: event.event_images?.[0]?.image_url_small || null,
        categories: event.event_tags?.map((et: any) => et.tags).filter(Boolean) || [],
        created_by_username: event.users?.username || 'Unknown',
      })) || [];

      setRecentPublished(formattedData);
    } catch (err) {
      console.error('Error loading recent published:', err);
      throw err;
    }
  };

  const loadRecentDrafts = async () => {
    try {
      const { data, error: queryError } = await supabase
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
        `
        )
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (queryError) throw queryError;

      const formattedData = data?.map((event: any) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        event_date: event.event_date,
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at,
        thumbnail_url: event.event_images?.[0]?.image_url_small || null,
        categories: event.event_tags?.map((et: any) => et.tags).filter(Boolean) || [],
        created_by_username: event.users?.username || 'Unknown',
      })) || [];

      setRecentDrafts(formattedData);
    } catch (err) {
      console.error('Error loading recent drafts:', err);
      throw err;
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (updateError) throw updateError;

      success('Event published successfully');
      loadDashboardData();
    } catch (err) {
      console.error('Error publishing event:', err);
      error('Failed to publish event');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const statCards = [
    {
      title: 'Total Events',
      value: statistics.total_events,
      subtitle: 'All events',
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Published Events',
      value: statistics.published_events,
      subtitle: 'Live on site',
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Draft Events',
      value: statistics.draft_events,
      subtitle: 'Not published yet',
      icon: FileText,
      color: 'bg-gray-500',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Events This Month',
      value: statistics.events_this_month,
      subtitle: format(new Date(), 'MMMM yyyy'),
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  if (!user || !canManageContent(user.role)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Events Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {format(lastUpdated, 'MMM dd, yyyy hh:mm a')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/events/add')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </>
        ) : (
          statCards.map((card) => (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800 mb-1">{card.value}</p>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Published Events</h2>
            <button
              onClick={() => navigate('/admin/events/list?status=published')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : recentPublished.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No published events yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPublished.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <EventThumbnail imageUrl={event.thumbnail_url} alt={event.title} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{event.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {format(new Date(event.event_date), 'EEE, dd MMM yyyy')}
                    </p>
                    <CategoryBadges tags={event.categories} maxVisible={2} />
                  </div>
                  <button
                    onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Draft Events</h2>
            <button
              onClick={() => navigate('/admin/events/list?status=draft')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : recentDrafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">All events are published</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDrafts.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <EventThumbnail imageUrl={event.thumbnail_url} alt={event.title} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-800 truncate">{event.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">
                      By {event.created_by_username} •{' '}
                      {formatDistanceToNow(new Date(event.updated_at), { addSuffix: true })}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {format(new Date(event.event_date), 'EEE, dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/admin/events/edit/${event.id}`)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handlePublish(event.id)}
                      className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      Publish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
