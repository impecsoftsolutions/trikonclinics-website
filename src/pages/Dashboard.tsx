import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  MessageSquare,
  Briefcase,
  Activity,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  totalDoctors: number;
  activeDoctors: number;
  totalTestimonials: number;
  publishedTestimonials: number;
  totalServices: number;
  activeServices: number;
  recentActivities: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalDoctors: 0,
    activeDoctors: 0,
    totalTestimonials: 0,
    publishedTestimonials: 0,
    totalServices: 0,
    activeServices: 0,
    recentActivities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [doctors, testimonials, services, activities] = await Promise.all([
        supabase.from('doctors').select('is_enabled', { count: 'exact' }),
        supabase.from('testimonials').select('is_published', { count: 'exact' }),
        supabase.from('services').select('is_enabled', { count: 'exact' }),
        supabase
          .from('activity_logs')
          .select('*', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        totalDoctors: doctors.count || 0,
        activeDoctors: doctors.data?.filter((d) => d.is_enabled).length || 0,
        totalTestimonials: testimonials.count || 0,
        publishedTestimonials: testimonials.data?.filter((t) => t.is_published).length || 0,
        totalServices: services.count || 0,
        activeServices: services.data?.filter((s) => s.is_enabled).length || 0,
        recentActivities: activities.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Doctors',
      value: stats.totalDoctors,
      subtitle: `${stats.activeDoctors} active`,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Testimonials',
      value: stats.totalTestimonials,
      subtitle: `${stats.publishedTestimonials} published`,
      icon: MessageSquare,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Services',
      value: stats.totalServices,
      subtitle: `${stats.activeServices} active`,
      icon: Briefcase,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Recent Activity',
      value: stats.recentActivities,
      subtitle: 'Last 24 hours',
      icon: Activity,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Trikon Clinics Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Info</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-800">User Role</p>
                <p className="text-sm text-gray-600">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-800">Last Login</p>
                <p className="text-sm text-gray-600">
                  {user?.last_login
                    ? format(new Date(user.last_login), 'MMM dd, yyyy hh:mm a')
                    : 'First login'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">System Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Content Items</span>
              <span className="font-semibold text-gray-800">
                {stats.totalDoctors + stats.totalTestimonials + stats.totalServices}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Published Items</span>
              <span className="font-semibold text-gray-800">
                {stats.activeDoctors + stats.publishedTestimonials + stats.activeServices}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Activity Today</span>
              <span className="font-semibold text-gray-800">{stats.recentActivities}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
