import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCog, Plus, Edit2, Trash2, Save, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';
  is_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

type UserRole = 'Super Admin' | 'Admin' | 'Content Manager' | 'Viewer';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Viewer' as UserRole,
    is_enabled: true,
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const availableRoles: UserRole[] = currentUser?.role === 'Super Admin'
    ? ['Super Admin', 'Admin', 'Content Manager', 'Viewer']
    : ['Content Manager', 'Viewer'];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Viewer',
      is_enabled: true,
    });
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setEditingId(null);
    setShowForm(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleEdit = (user: User) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      is_enabled: user.is_enabled,
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const validateForm = async () => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!editingId) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    if (!editingId) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .maybeSingle();

      if (existingUser) {
        newErrors.username = 'Username already exists';
        isValid = false;
      }

      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingEmail) {
        newErrors.email = 'Email already exists';
        isValid = false;
      }
    } else {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', editingId)
        .maybeSingle();

      if (existingUser) {
        newErrors.username = 'Username already exists';
        isValid = false;
      }

      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email)
        .neq('id', editingId)
        .maybeSingle();

      if (existingEmail) {
        newErrors.email = 'Email already exists';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const isValid = await validateForm();
    if (!isValid) {
      setSaving(false);
      return;
    }

    try {
      if (editingId) {
        const updateData: any = {
          email: formData.email,
          role: formData.role,
          is_enabled: formData.is_enabled,
          updated_at: new Date().toISOString(),
        };

        if (formData.password) {
          const hashedPassword = await bcrypt.hash(formData.password, 10);
          updateData.password = hashedPassword;
        }

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: currentUser?.id,
          action: 'update',
          description: `Updated user: ${formData.username}`,
          table_affected: 'users',
          record_id: editingId,
        });

        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        const hashedPassword = await bcrypt.hash(formData.password, 10);

        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: formData.username,
            email: formData.email,
            password: hashedPassword,
            role: formData.role,
            is_enabled: formData.is_enabled,
            created_by: currentUser?.id,
          }])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('activity_logs').insert({
          user_id: currentUser?.id,
          action: 'create',
          description: `Created new user: ${formData.username} with role ${formData.role}`,
          table_affected: 'users',
          record_id: data.id,
        });

        setMessage({ type: 'success', text: 'User created successfully!' });
      }

      await loadUsers();
      resetForm();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save user' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (id === currentUser?.id) {
      setMessage({ type: 'error', text: 'You cannot delete your own account' });
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: currentUser?.id,
        action: 'delete',
        description: `Deleted user: ${username}`,
        table_affected: 'users',
        record_id: id,
      });

      setMessage({ type: 'success', text: 'User deleted successfully!' });
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const handleToggleEnabled = async (user: User) => {
    if (user.id === currentUser?.id) {
      setMessage({ type: 'error', text: 'You cannot disable your own account' });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_enabled: !user.is_enabled })
        .eq('id', user.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: currentUser?.id,
        action: 'update',
        description: `${!user.is_enabled ? 'Enabled' : 'Disabled'} user: ${user.username}`,
        table_affected: 'users',
        record_id: user.id,
      });

      await loadUsers();
    } catch (error) {
      console.error('Error toggling user:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-700';
      case 'Admin':
        return 'bg-blue-100 text-blue-700';
      case 'Content Manager':
        return 'bg-green-100 text-green-700';
      case 'Viewer':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <UserCog className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          </div>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create User
          </button>
        )}
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? 'Edit User' : 'Create New User'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!!editingId}
                  required
                />
                {errors.username && (
                  <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {!editingId && <span className="text-red-500">*</span>}
                  {editingId && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={!editingId}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password {!editingId && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={!editingId && !!formData.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Account Enabled
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? 'Update' : 'Create'} User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-blue-600">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleEnabled(user)}
                        disabled={user.id === currentUser?.id}
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          user.is_enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {user.is_enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {formatDate(user.last_login)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={user.id === currentUser?.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
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
      </div>
    </div>
  );
};
