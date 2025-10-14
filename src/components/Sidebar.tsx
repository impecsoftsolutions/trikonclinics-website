import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  Briefcase,
  Phone,
  Share2,
  ClipboardList,
  UserCog,
  Sparkles,
  BookOpen,
  Folder,
  Calendar,
} from 'lucide-react';
import { canViewUsers, canManageContent, canViewLogs } from '../utils/permissions';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      visible: true,
    },
    {
      name: 'Hospital Profile',
      icon: Building2,
      path: '/admin/hospital-profile',
      visible: canManageContent(user.role),
    },
    {
      name: 'Modern Themes',
      icon: Sparkles,
      path: '/admin/modern-themes',
      visible: true,
    },
    {
      name: 'Doctors',
      icon: Users,
      path: '/admin/doctors',
      visible: canManageContent(user.role),
    },
    {
      name: 'Testimonials',
      icon: MessageSquare,
      path: '/admin/testimonials',
      visible: canManageContent(user.role),
    },
    {
      name: 'Services',
      icon: Briefcase,
      path: '/admin/services',
      visible: canManageContent(user.role),
    },
    {
      name: 'Contact Info',
      icon: Phone,
      path: '/admin/contact',
      visible: canManageContent(user.role),
    },
    {
      name: 'Social Media',
      icon: Share2,
      path: '/admin/social-media',
      visible: canManageContent(user.role),
    },
    {
      name: 'Health Library',
      icon: BookOpen,
      path: '/admin/health-library/illnesses',
      visible: canManageContent(user.role),
    },
    {
      name: 'Library Categories',
      icon: Folder,
      path: '/admin/health-library/categories',
      visible: canManageContent(user.role),
    },
    {
      name: 'Events',
      icon: Calendar,
      path: '/admin/events/dashboard',
      visible: canManageContent(user.role),
      submenu: [
        {
          name: 'Dashboard',
          path: '/admin/events/dashboard',
        },
        {
          name: 'All Events',
          path: '/admin/events/list',
        },
        {
          name: 'Add New Event',
          path: '/admin/events/add',
        },
      ],
    },
    {
      name: 'Activity Logs',
      icon: ClipboardList,
      path: '/admin/activity-logs',
      visible: canViewLogs(user.role),
    },
    {
      name: 'User Management',
      icon: UserCog,
      path: '/admin/users',
      visible: canViewUsers(user.role),
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Building2 className="w-10 h-10 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Trikon Clinics</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        {menuItems
          .filter((item) => item.visible)
          .map((item) => (
            <div key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
              {'submenu' in item && item.submenu && (
                <div className="ml-8 space-y-1 mb-2">
                  {item.submenu.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`
                      }
                    >
                      {subItem.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
      </nav>
    </aside>
  );
};
