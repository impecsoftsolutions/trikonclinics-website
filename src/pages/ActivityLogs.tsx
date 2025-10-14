import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, Filter, X } from 'lucide-react';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  description: string | null;
  table_affected: string | null;
  record_id: string | null;
  created_at: string;
  username?: string;
}

interface User {
  id: string;
  username: string;
}

export const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    action: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 50;

  useEffect(() => {
    loadUsers();
    loadLogs();
  }, [filters, currentPage]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .order('username');

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('created_at', new Date(filters.startDate).toISOString());
      }

      if (filters.endDate) {
        const endOfDay = new Date(filters.endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      const from = (currentPage - 1) * logsPerPage;
      const to = from + logsPerPage - 1;
      query = query.range(from, to);

      const { data: logsData, error } = await query;

      if (error) throw error;

      if (logsData) {
        const logsWithUsernames = await Promise.all(
          logsData.map(async (log) => {
            if (log.user_id) {
              const user = users.find(u => u.id === log.user_id);
              if (user) {
                return { ...log, username: user.username };
              } else {
                const { data: userData } = await supabase
                  .from('users')
                  .select('username')
                  .eq('id', log.user_id)
                  .maybeSingle();

                return { ...log, username: userData?.username || 'Unknown User' };
              }
            }
            return { ...log, username: 'System' };
          })
        );
        setLogs(logsWithUsernames);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      action: '',
    });
    setCurrentPage(1);
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      case 'login':
        return 'bg-purple-100 text-purple-700';
      case 'logout':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Activity Logs</h1>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        <p className="text-gray-600">View all user actions and system activities</p>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters({ ...filters, startDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters({ ...filters, endDate: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User
              </label>
              <select
                value={filters.userId}
                onChange={(e) => {
                  setFilters({ ...filters, userId: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                {uniqueActions
                  .filter(action => !['login', 'logout', 'create', 'update', 'delete'].includes(action))
                  .map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No activity logs found</p>
            {(filters.startDate || filters.endDate || filters.userId || filters.action) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Clear filters to see all logs
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(log.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.username || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md">
                        {log.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {log.table_affected || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {currentPage}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={logs.length < logsPerPage}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
