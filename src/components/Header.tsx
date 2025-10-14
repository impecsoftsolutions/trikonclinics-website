import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user.username}
          </h2>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
