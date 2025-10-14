import { supabase } from './supabase';
import type {
  ModernTheme,
  ModernSiteSettings,
  ActiveThemeInfo,
  ActivateThemeResponse,
  RollbackThemeResponse,
  DuplicateThemeResponse,
} from '../types/modernTheme';

export async function loadAllThemes(): Promise<{ data: ModernTheme[] | null; error: string | null }> {
  try {
    console.log('[Modern Themes]', 'Loading all themes from database');

    const { data, error } = await supabase
      .from('modern_themes')
      .select('*')
      .order('is_preset', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('[Modern Themes]', 'Error loading themes:', error);
      return { data: null, error: error.message };
    }

    console.log('[Modern Themes]', `Loaded ${data?.length || 0} themes`);
    return { data: data as ModernTheme[], error: null };
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error loading themes:', error);
    return { data: null, error: 'Failed to load themes. Please try again.' };
  }
}

export async function loadActiveTheme(): Promise<{ data: ActiveThemeInfo | null; error: string | null }> {
  try {
    console.log('[Modern Themes]', 'Loading active theme');

    const { data: settings, error: settingsError } = await supabase
      .from('modern_site_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('[Modern Themes]', 'Error loading site settings:', settingsError);
      return { data: null, error: settingsError.message };
    }

    if (!settings || !settings.active_theme_id) {
      console.log('[Modern Themes]', 'No active theme found');
      return { data: null, error: null };
    }

    const { data: theme, error: themeError } = await supabase
      .from('modern_themes')
      .select('*')
      .eq('id', settings.active_theme_id)
      .maybeSingle();

    if (themeError) {
      console.error('[Modern Themes]', 'Error loading active theme:', themeError);
      return { data: null, error: themeError.message };
    }

    if (!theme) {
      console.log('[Modern Themes]', 'Active theme not found in database');
      return { data: null, error: 'Active theme not found' };
    }

    const activeThemeInfo: ActiveThemeInfo = {
      ...theme,
      activated_at: settings.activated_at,
      rollback_deadline: settings.rollback_deadline,
      previous_theme_id: settings.previous_theme_id,
    };

    console.log('[Modern Themes]', 'Active theme loaded:', activeThemeInfo.name);
    return { data: activeThemeInfo, error: null };
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error loading active theme:', error);
    return { data: null, error: 'Failed to load active theme. Please try again.' };
  }
}

export async function activateTheme(
  themeId: string,
  userId: string
): Promise<ActivateThemeResponse> {
  try {
    console.log('[Modern Themes]', 'Activating theme:', themeId, 'by user:', userId);

    const { data, error } = await supabase.rpc('activate_theme_atomic', {
      p_theme_id: themeId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[Modern Themes]', 'Error activating theme:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('[Modern Themes]', 'No response from activate_theme_atomic');
      return { success: false, error: 'No response from database function' };
    }

    const response = data as ActivateThemeResponse;

    if (response.success) {
      console.log('[Modern Themes]', 'Theme activated successfully:', response.theme_name);
    } else {
      console.error('[Modern Themes]', 'Theme activation failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error activating theme:', error);
    return { success: false, error: 'Failed to activate theme. Please try again.' };
  }
}

export async function rollbackTheme(userId: string): Promise<RollbackThemeResponse> {
  try {
    console.log('[Modern Themes]', 'Rolling back to previous theme by user:', userId);

    const { data, error } = await supabase.rpc('rollback_theme', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[Modern Themes]', 'Error rolling back theme:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('[Modern Themes]', 'No response from rollback_theme');
      return { success: false, error: 'No response from database function' };
    }

    const response = data as RollbackThemeResponse;

    if (response.success) {
      console.log('[Modern Themes]', 'Theme rolled back successfully:', response.message);
    } else {
      console.error('[Modern Themes]', 'Theme rollback failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error rolling back theme:', error);
    return { success: false, error: 'Failed to rollback theme. Please try again.' };
  }
}

export async function duplicateTheme(
  themeId: string,
  newName: string,
  newSlug: string,
  userId: string
): Promise<DuplicateThemeResponse> {
  try {
    console.log('[Modern Themes]', 'Duplicating theme:', themeId, 'as:', newName, 'by user:', userId);

    const { data, error } = await supabase.rpc('duplicate_theme', {
      p_theme_id: themeId,
      p_new_name: newName,
      p_new_slug: newSlug,
      p_user_id: userId,
    });

    if (error) {
      console.error('[Modern Themes]', 'Error duplicating theme:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('[Modern Themes]', 'No response from duplicate_theme');
      return { success: false, error: 'No response from database function' };
    }

    const response = data as DuplicateThemeResponse;

    if (response.success) {
      console.log('[Modern Themes]', 'Theme duplicated successfully:', response.name);
    } else {
      console.error('[Modern Themes]', 'Theme duplication failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error duplicating theme:', error);
    return { success: false, error: 'Failed to duplicate theme. Please try again.' };
  }
}

export async function deleteTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Modern Themes]', 'Deleting theme:', themeId);

    const { data: theme, error: fetchError } = await supabase
      .from('modern_themes')
      .select('is_preset, name')
      .eq('id', themeId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Modern Themes]', 'Error fetching theme:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!theme) {
      return { success: false, error: 'Theme not found' };
    }

    if (theme.is_preset) {
      console.error('[Modern Themes]', 'Cannot delete preset theme');
      return { success: false, error: 'Cannot delete preset themes' };
    }

    const { error: deleteError } = await supabase
      .from('modern_themes')
      .delete()
      .eq('id', themeId);

    if (deleteError) {
      console.error('[Modern Themes]', 'Error deleting theme:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log('[Modern Themes]', 'Theme deleted successfully:', theme.name);
    return { success: true };
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error deleting theme:', error);
    return { success: false, error: 'Failed to delete theme. Please try again.' };
  }
}

export async function updateTheme(
  themeId: string,
  config: any,
  changeDescription: string,
  userId: string
): Promise<{ success: boolean; error?: string; theme_id?: string; version_number?: number }> {
  try {
    console.log('[Modern Themes]', 'Updating theme:', themeId, 'by user:', userId);

    const { data, error } = await supabase.rpc('update_theme', {
      p_theme_id: themeId,
      p_config: config,
      p_change_description: changeDescription,
      p_user_id: userId,
    });

    if (error) {
      console.error('[Modern Themes]', 'Error updating theme:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.error('[Modern Themes]', 'No response from update_theme');
      return { success: false, error: 'No response from database function' };
    }

    const response = data as { success: boolean; error?: string; theme_id?: string; version_number?: number };

    if (response.success) {
      console.log('[Modern Themes]', 'Theme updated successfully, version:', response.version_number);
    } else {
      console.error('[Modern Themes]', 'Theme update failed:', response.error);
    }

    return response;
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error updating theme:', error);
    return { success: false, error: 'Failed to update theme. Please try again.' };
  }
}

export async function loadThemeById(themeId: string): Promise<{ data: ModernTheme | null; error: string | null }> {
  try {
    console.log('[Modern Themes]', 'Loading theme by ID:', themeId);

    const { data, error } = await supabase
      .from('modern_themes')
      .select('*')
      .eq('id', themeId)
      .maybeSingle();

    if (error) {
      console.error('[Modern Themes]', 'Error loading theme:', error);
      return { data: null, error: error.message };
    }

    if (!data) {
      console.log('[Modern Themes]', 'Theme not found');
      return { data: null, error: 'Theme not found' };
    }

    console.log('[Modern Themes]', 'Theme loaded:', data.name);
    return { data: data as ModernTheme, error: null };
  } catch (error) {
    console.error('[Modern Themes]', 'Unexpected error loading theme:', error);
    return { data: null, error: 'Failed to load theme. Please try again.' };
  }
}
