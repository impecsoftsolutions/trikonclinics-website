import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, LogIn } from 'lucide-react';
import { createSuperAdmin } from '../scripts/createSuperAdmin';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await createSuperAdmin();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeDatabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-12">
          <div className="flex flex-col items-center justify-center">
            <Building2 className="w-16 h-16 text-blue-600 mb-4" />
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-center">Initializing application...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Trikon Clinics</h1>
          <p className="text-blue-100 text-center">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="px-8 pb-8 text-center text-sm text-gray-600">
          <p>Trikon Clinics Management System</p>
          <p className="text-gray-500">Guntur, Andhra Pradesh</p>
        </div>
      </div>
    </div>
  );
};
