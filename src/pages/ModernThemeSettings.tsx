import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { ModernTheme, ActiveThemeInfo, ThemeConfig } from '../types/modernTheme';
import {
  loadAllThemes,
  loadActiveTheme,
  activateTheme,
  rollbackTheme,
  duplicateTheme,
  deleteTheme,
  updateTheme,
} from '../lib/modernThemeService';
import { supabase } from '../lib/supabase';
import { ThemeCard } from '../components/modern-themes/ThemeCard';
import { ActiveThemeHeader } from '../components/modern-themes/ActiveThemeHeader';
import { LoadingSkeleton } from '../components/modern-themes/LoadingSkeleton';
import { ThemePreviewModal } from '../components/modern-themes/ThemePreviewModal';
import { DuplicateThemeModal } from '../components/modern-themes/DuplicateThemeModal';
import { ConfirmDialog } from '../components/modern-themes/ConfirmDialog';
import { ThemeEditModal } from '../components/modern-themes/ThemeEditModal';

interface Message {
  type: 'success' | 'error';
  text: string;
}

export const ModernThemeSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<ModernTheme[]>([]);
  const [activeTheme, setActiveTheme] = useState<ActiveThemeInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<Message | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ModernTheme | null>(null);

  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [themeToDuplicate, setThemeToDuplicate] = useState<ModernTheme | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<ModernTheme | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [themeToActivate, setThemeToActivate] = useState<ModernTheme | null>(null);
  const [activating, setActivating] = useState(false);

  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<ModernTheme | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'Super Admin' || user?.role === 'Admin';
  const isSuperAdmin = user?.role === 'Super Admin';

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadData = async () => {
    console.log('[Modern Themes]', 'Loading themes and active theme data');
    setLoading(true);

    try {
      const [themesResult, activeResult] = await Promise.all([
        loadAllThemes(),
        loadActiveTheme(),
      ]);

      if (themesResult.error) {
        setMessage({ type: 'error', text: themesResult.error });
        console.error('[Modern Themes]', 'Error loading themes:', themesResult.error);
      } else {
        setThemes(themesResult.data || []);
        console.log('[Modern Themes]', `Loaded ${themesResult.data?.length || 0} themes`);
      }

      if (activeResult.error) {
        console.error('[Modern Themes]', 'Error loading active theme:', activeResult.error);
      } else {
        setActiveTheme(activeResult.data);
        console.log('[Modern Themes]', 'Active theme:', activeResult.data?.name || 'None');
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error loading data:', error);
      setMessage({ type: 'error', text: 'Failed to load themes. Please refresh the page.' });
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setThemeToActivate(theme);
      setActivateDialogOpen(true);
    }
  };

  const confirmActivate = async () => {
    if (!themeToActivate || !user) return;

    console.log('[Modern Themes]', 'Activating theme:', themeToActivate.name);
    setActivating(true);

    try {
      const response = await activateTheme(themeToActivate.id, user.id);

      if (response.success) {
        console.log('[Modern Themes]', 'Theme activated successfully');
        setMessage({
          type: 'success',
          text: `Theme activated successfully! You can rollback within 24 hours if needed.`,
        });

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'theme_activated',
          description: `Activated modern theme: ${themeToActivate.name}`,
          table_affected: 'modern_themes',
          record_id: themeToActivate.id,
        });

        await loadData();
      } else {
        console.error('[Modern Themes]', 'Activation failed:', response.error);
        setMessage({ type: 'error', text: response.error || 'Failed to activate theme' });
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error activating theme:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setActivating(false);
      setActivateDialogOpen(false);
      setThemeToActivate(null);
    }
  };

  const handleRollback = () => {
    setRollbackDialogOpen(true);
  };

  const confirmRollback = async () => {
    if (!user) return;

    console.log('[Modern Themes]', 'Rolling back to previous theme');
    setRollingBack(true);

    try {
      const response = await rollbackTheme(user.id);

      if (response.success) {
        console.log('[Modern Themes]', 'Rollback successful');
        setMessage({ type: 'success', text: response.message || 'Theme rolled back successfully!' });

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'theme_rolled_back',
          description: 'Rolled back to previous modern theme',
          table_affected: 'modern_themes',
          record_id: null,
        });

        await loadData();
      } else {
        console.error('[Modern Themes]', 'Rollback failed:', response.error);
        setMessage({ type: 'error', text: response.error || 'Failed to rollback theme' });
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error rolling back:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setRollingBack(false);
      setRollbackDialogOpen(false);
    }
  };

  const handleViewDetails = (theme: ModernTheme) => {
    setSelectedTheme(theme);
    setPreviewModalOpen(true);
  };

  const handleDuplicate = (theme: ModernTheme) => {
    setThemeToDuplicate(theme);
    setDuplicateModalOpen(true);
  };

  const confirmDuplicate = async (newName: string, newSlug: string) => {
    if (!themeToDuplicate || !user) return;

    console.log('[Modern Themes]', 'Duplicating theme:', themeToDuplicate.name, 'as:', newName);
    setDuplicating(true);

    try {
      const response = await duplicateTheme(themeToDuplicate.id, newName, newSlug, user.id);

      if (response.success) {
        console.log('[Modern Themes]', 'Theme duplicated successfully');
        setMessage({ type: 'success', text: `Theme duplicated successfully as "${newName}"` });

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'theme_duplicated',
          description: `Duplicated modern theme: ${themeToDuplicate.name} as ${newName}`,
          table_affected: 'modern_themes',
          record_id: response.theme_id,
        });

        await loadData();
      } else {
        console.error('[Modern Themes]', 'Duplication failed:', response.error);
        setMessage({ type: 'error', text: response.error || 'Failed to duplicate theme' });
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error duplicating theme:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setDuplicating(false);
      setDuplicateModalOpen(false);
      setThemeToDuplicate(null);
    }
  };

  const handleEdit = (theme: ModernTheme) => {
    if (!isSuperAdmin) {
      setMessage({
        type: 'error',
        text: 'Only Super Admins can edit themes.',
      });
      return;
    }

    if (theme.is_preset) {
      setMessage({
        type: 'error',
        text: 'Preset themes cannot be edited. Please duplicate this theme to create an editable version.',
      });
      return;
    }

    console.log('[Modern Themes]', 'Opening edit modal for theme:', theme.name);
    setThemeToEdit(theme);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (config: ThemeConfig, changeDescription: string) => {
    if (!themeToEdit || !user) return;

    console.log('[Modern Themes]', 'Saving theme edits:', themeToEdit.name);
    setSaving(true);

    try {
      const response = await updateTheme(themeToEdit.id, config, changeDescription, user.id);

      if (response.success) {
        console.log('[Modern Themes]', 'Theme updated successfully, version:', response.version_number);
        setMessage({
          type: 'success',
          text: `Theme "${themeToEdit.name}" updated successfully! Version ${response.version_number} created.`,
        });

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'theme_edited',
          description: `Updated modern theme: ${themeToEdit.name} - ${changeDescription}`,
          table_affected: 'modern_themes',
          record_id: themeToEdit.id,
        });

        // Fetch the updated theme data from the database
        const { data: updatedTheme, error: fetchError } = await supabase
          .from('modern_themes')
          .select('*')
          .eq('id', themeToEdit.id)
          .maybeSingle();

        if (!fetchError && updatedTheme) {
          // Update the themeToEdit state with fresh data
          setThemeToEdit(updatedTheme as ModernTheme);
          console.log('[Modern Themes]', 'Theme data refreshed with version:', updatedTheme.version_number);
        }

        // Refresh the theme list in the background
        await loadData();

        // DO NOT close the modal - keep it open for activation
      } else {
        console.error('[Modern Themes]', 'Update failed:', response.error);
        setMessage({ type: 'error', text: response.error || 'Failed to update theme' });
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error updating theme:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (theme: ModernTheme) => {
    if (theme.id === activeTheme?.id) {
      setMessage({
        type: 'error',
        text: 'Cannot delete the currently active theme. Please activate another theme first.',
      });
      return;
    }

    setThemeToDelete(theme);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!themeToDelete || !user) return;

    console.log('[Modern Themes]', 'Deleting theme:', themeToDelete.name);
    setDeleting(true);

    try {
      const response = await deleteTheme(themeToDelete.id);

      if (response.success) {
        console.log('[Modern Themes]', 'Theme deleted successfully');
        setMessage({ type: 'success', text: 'Theme deleted successfully' });

        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'theme_deleted',
          description: `Deleted modern theme: ${themeToDelete.name}`,
          table_affected: 'modern_themes',
          record_id: themeToDelete.id,
        });

        await loadData();
      } else {
        console.error('[Modern Themes]', 'Deletion failed:', response.error);
        setMessage({ type: 'error', text: response.error || 'Failed to delete theme' });
      }
    } catch (error) {
      console.error('[Modern Themes]', 'Unexpected error deleting theme:', error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setThemeToDelete(null);
    }
  };

  const filteredThemes = themes.filter((theme) =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedThemes = [...filteredThemes].sort((a, b) => {
    if (a.id === activeTheme?.id) return -1;
    if (b.id === activeTheme?.id) return 1;
    if (a.is_preset && !b.is_preset) return -1;
    if (!a.is_preset && b.is_preset) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Modern Themes</h1>
          </div>
          <p className="text-gray-600">
            Browse, preview, and activate modern themes for your hospital website.
          </p>
          {!canManage && (
            <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You have view-only access. Contact an administrator to manage themes.
              </p>
            </div>
          )}
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <ActiveThemeHeader
          activeTheme={activeTheme}
          canManage={canManage}
          onRollback={handleRollback}
        />

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              disabled
              className="w-full md:w-auto px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center gap-2 justify-center"
              title="Coming in Phase 4"
            >
              <Plus className="w-4 h-4" />
              Create New Theme
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : sortedThemes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No themes found' : 'No themes available'}
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'No themes found matching your criteria. Try adjusting your search.'
                : 'Contact administrator to set up themes.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === activeTheme?.id}
                canManage={canManage}
                isSuperAdmin={isSuperAdmin}
                onActivate={handleActivate}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <ThemePreviewModal
          isOpen={previewModalOpen}
          theme={selectedTheme}
          canManage={canManage}
          isActive={selectedTheme?.id === activeTheme?.id}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedTheme(null);
          }}
          onActivate={handleActivate}
        />

        <DuplicateThemeModal
          isOpen={duplicateModalOpen}
          originalName={themeToDuplicate?.name || ''}
          onConfirm={confirmDuplicate}
          onCancel={() => {
            setDuplicateModalOpen(false);
            setThemeToDuplicate(null);
          }}
          isLoading={duplicating}
        />

        <ConfirmDialog
          isOpen={activateDialogOpen}
          title="Activate Theme"
          message={`Are you sure you want to activate "${themeToActivate?.name}"?\n\nThis will change the appearance of the entire website. You can rollback within 24 hours if needed.`}
          confirmText="Activate"
          cancelText="Cancel"
          confirmVariant="primary"
          onConfirm={confirmActivate}
          onCancel={() => {
            setActivateDialogOpen(false);
            setThemeToActivate(null);
          }}
          isLoading={activating}
        />

        <ConfirmDialog
          isOpen={deleteDialogOpen}
          title="Delete Theme"
          message={`Are you sure you want to delete "${themeToDelete?.name}"?\n\nThis action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteDialogOpen(false);
            setThemeToDelete(null);
          }}
          isLoading={deleting}
        />

        <ConfirmDialog
          isOpen={rollbackDialogOpen}
          title="Rollback to Previous Theme"
          message="Rollback to the theme that was active before the current one?\n\nThis will restore the previous theme's appearance immediately."
          confirmText="Rollback"
          cancelText="Cancel"
          confirmVariant="primary"
          onConfirm={confirmRollback}
          onCancel={() => setRollbackDialogOpen(false)}
          isLoading={rollingBack}
        />

        <ThemeEditModal
          isOpen={editModalOpen}
          theme={themeToEdit}
          onClose={() => {
            setEditModalOpen(false);
            setThemeToEdit(null);
          }}
          onSave={handleSaveEdit}
          isSaving={saving}
          isActive={themeToEdit?.id === activeTheme?.id}
          userId={user?.id}
          onActivationSuccess={loadData}
        />
      </div>
    </div>
  );
};
