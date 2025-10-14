import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import type { ModernTheme, ThemeConfig } from '../../types/modernTheme';
import { ThemePreviewPanel } from './ThemePreviewPanel';
import { ColorPickerInput } from './ColorPickerInput';
import { generateChangeDescription } from '../../utils/changeDescriptionGenerator';
import { activateTheme } from '../../lib/modernThemeService';

interface ThemeEditModalProps {
  isOpen: boolean;
  theme: ModernTheme | null;
  onClose: () => void;
  onSave: (config: ThemeConfig, changeDescription: string) => Promise<void>;
  isSaving: boolean;
  isActive?: boolean;
  userId?: string;
  onActivationSuccess?: () => void;
}

type TabType = 'overview' | 'colors' | 'typography' | 'tokens' | 'layouts' | 'animations' | 'accessibility';

export const ThemeEditModal: React.FC<ThemeEditModalProps> = ({
  isOpen,
  theme,
  onClose,
  onSave,
  isSaving,
  isActive = false,
  userId,
  onActivationSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<ThemeConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [changeDescription, setChangeDescription] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedButNotActivated, setSavedButNotActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activationMessage, setActivationMessage] = useState<string | null>(null);
  const [modalJustOpened, setModalJustOpened] = useState(false);

  // Track when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setModalJustOpened(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (theme && isOpen) {
      setConfig(JSON.parse(JSON.stringify(theme.config)));
      setOriginalConfig(JSON.parse(JSON.stringify(theme.config)));
      setHasChanges(false);
      setChangeDescription('');
      setValidationErrors([]);
      // Only reset tab when modal first opens, not on theme updates
      if (modalJustOpened) {
        setActiveTab('overview');
        setModalJustOpened(false);
      }
      setSavedButNotActivated(false);
      setActivationSuccess(false);
      setActivationMessage(null);
    }
  }, [theme, isOpen, modalJustOpened]);

  // Sync state when theme prop is updated after a save
  useEffect(() => {
    if (theme && config && originalConfig && isOpen) {
      // Check if the theme version has changed (indicating a save occurred)
      const currentThemeConfig = JSON.stringify(theme.config);
      const currentOriginalConfig = JSON.stringify(originalConfig);

      // If theme config has changed but we haven't modified it locally, update both states
      if (currentThemeConfig !== currentOriginalConfig && !hasChanges) {
        console.log('[ThemeEditModal]', 'Detected theme update, syncing state');
        setConfig(JSON.parse(JSON.stringify(theme.config)));
        setOriginalConfig(JSON.parse(JSON.stringify(theme.config)));
      }
    }
  }, [theme]);

  useEffect(() => {
    if (config && originalConfig) {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);

      if (changed) {
        const autoDescription = generateChangeDescription(originalConfig, config);
        setChangeDescription(autoDescription);

        // When user makes changes after saving, reset the activation state
        // This allows them to save again and re-activate
        if (savedButNotActivated || activationSuccess) {
          setSavedButNotActivated(false);
          setActivationSuccess(false);
          setActivationMessage(null);
        }
      }
    }
  }, [config, originalConfig]);

  if (!isOpen || !theme || !config) return null;

  const handleClose = () => {
    if (hasChanges && !showCloseConfirm) {
      setShowCloseConfirm(true);
    } else {
      setShowCloseConfirm(false);
      onClose();
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(JSON.parse(JSON.stringify(originalConfig)));
      setChangeDescription('');
      setValidationErrors([]);
    }
  };

  const handleSave = async () => {
    const errors = validateConfig(config);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const finalDescription = changeDescription.trim() || 'Theme configuration updated';
    await onSave(config, finalDescription);

    // After successful save:
    // 1. Update originalConfig to match current config (so hasChanges becomes false)
    // 2. Mark that activation is needed if this is the active theme
    setOriginalConfig(JSON.parse(JSON.stringify(config)));
    setHasChanges(false);
    setChangeDescription('');

    if (isActive) {
      setSavedButNotActivated(true);
      setActivationSuccess(false);
      setActivationMessage(null);
    }
  };

  const handleActivate = async () => {
    if (!theme || !userId) {
      setActivationMessage('Unable to activate: missing required information');
      return;
    }

    setIsActivating(true);
    setActivationMessage(null);

    try {
      const response = await activateTheme(theme.id, userId);

      if (response.success) {
        setActivationSuccess(true);
        setSavedButNotActivated(false);
        setActivationMessage('Theme activated successfully! Changes are now live on the website.');

        // Notify parent component to refresh data (but don't close modal)
        if (onActivationSuccess) {
          onActivationSuccess();
        }

        // Modal stays open - user can continue editing or close manually
      } else {
        setActivationMessage(response.error || 'Failed to activate theme');
      }
    } catch (error) {
      console.error('Error activating theme:', error);
      setActivationMessage('An unexpected error occurred while activating the theme');
    } finally {
      setIsActivating(false);
    }
  };

  const validateConfig = (cfg: ThemeConfig): string[] => {
    const errors: string[] = [];

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (!cfg.colors?.light?.primary) {
      errors.push('Light mode primary color is required');
    } else if (!hexRegex.test(cfg.colors.light.primary)) {
      errors.push('Light mode primary color must be a valid hex color');
    }

    if (!cfg.colors?.dark?.primary) {
      errors.push('Dark mode primary color is required');
    } else if (!hexRegex.test(cfg.colors.dark.primary)) {
      errors.push('Dark mode primary color must be a valid hex color');
    }

    if (!cfg.typography?.fontFamilies?.heading) {
      errors.push('Heading font family is required');
    }

    if (!cfg.typography?.fontFamilies?.body) {
      errors.push('Body font family is required');
    }

    return errors;
  };

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const newConfig = JSON.parse(JSON.stringify(prev));
      let current: any = newConfig;

      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }

      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'colors' as TabType, label: 'Colors' },
    { id: 'typography' as TabType, label: 'Typography' },
    { id: 'tokens' as TabType, label: 'Design Tokens' },
    { id: 'layouts' as TabType, label: 'Layouts' },
    { id: 'animations' as TabType, label: 'Animations' },
    { id: 'accessibility' as TabType, label: 'Accessibility' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Theme: {theme.name}</h2>
            {hasChanges && (
              <p className="text-sm text-orange-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" />
                You have unsaved changes
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {validationErrors.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Please fix the following errors:</p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 px-6 bg-white">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <OverviewTab
                  theme={theme}
                  changeDescription={changeDescription}
                  onChangeDescriptionUpdate={setChangeDescription}
                />
              )}
              {activeTab === 'colors' && (
                <ColorsTab config={config} updateConfig={updateConfig} />
              )}
              {activeTab === 'typography' && (
                <TypographyTab config={config} updateConfig={updateConfig} />
              )}
              {activeTab === 'tokens' && (
                <DesignTokensTab config={config} updateConfig={updateConfig} />
              )}
              {activeTab === 'layouts' && (
                <LayoutsTab config={config} updateConfig={updateConfig} />
              )}
              {activeTab === 'animations' && (
                <AnimationsTab config={config} updateConfig={updateConfig} />
              )}
              {activeTab === 'accessibility' && (
                <AccessibilityTab config={config} updateConfig={updateConfig} />
              )}
            </div>
          </div>

          <div className="w-96 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            <ThemePreviewPanel
              config={config}
              mode={previewMode}
              onModeToggle={() => setPreviewMode(previewMode === 'light' ? 'dark' : 'light')}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {/* Activation message */}
          {activationMessage && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                activationSuccess
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {activationSuccess ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{activationMessage}</p>
            </div>
          )}

          {/* Info message when changes are saved but not activated */}
          {savedButNotActivated && !activationSuccess && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Changes saved successfully! Click <strong>Activate</strong> to apply them to the live website.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              disabled={!hasChanges || isSaving || isActivating}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Changes
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSaving || isActivating}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Close
              </button>
              {isActive && (
                <button
                  onClick={handleActivate}
                  disabled={!savedButNotActivated || isActivating || isSaving || activationSuccess}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    activationSuccess
                      ? 'bg-green-600 text-white'
                      : 'bg-orange-600 hover:bg-orange-700 text-white'
                  }`}
                  title={activationSuccess ? 'Theme is already activated' : savedButNotActivated ? 'Apply saved changes to the live website' : 'Save changes first before activating'}
                >
                  {isActivating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Activating...
                    </>
                  ) : activationSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Activated
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || isActivating}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCloseConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unsaved Changes</h3>
            <p className="text-gray-600 mb-4">
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowCloseConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TabProps {
  config: ThemeConfig;
  updateConfig: (path: string[], value: any) => void;
}

interface OverviewTabProps {
  theme: ModernTheme;
  changeDescription: string;
  onChangeDescriptionUpdate: (value: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ theme, changeDescription, onChangeDescriptionUpdate }) => (
  <div className="max-w-2xl space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Information</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name</label>
          <input
            type="text"
            value={theme.name}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Theme name cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-sm text-gray-600 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            {theme.description}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change Summary
          </label>
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              {changeDescription || 'No changes detected yet'}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This summary is auto-generated based on your changes and will be saved in the version history
          </p>
        </div>
      </div>
    </div>
  </div>
);

const ColorsTab: React.FC<TabProps> = ({ config, updateConfig }) => {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const colors = colorMode === 'light' ? config.colors.light : config.colors.dark;
  const basePath = ['colors', colorMode];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Color Configuration</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setColorMode('light')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              colorMode === 'light'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Light Mode
          </button>
          <button
            onClick={() => setColorMode('dark')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              colorMode === 'dark'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dark Mode
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <h4 className="font-semibold text-gray-800 mb-3">Brand Colors</h4>
          <div className="space-y-4">
            <ColorPickerInput
              label="Primary"
              value={colors.primary}
              onChange={(val) => updateConfig([...basePath, 'primary'], val)}
              showContrastChecker
              contrastBackground={colors.background.page}
            />
            <ColorPickerInput
              label="Secondary"
              value={colors.secondary}
              onChange={(val) => updateConfig([...basePath, 'secondary'], val)}
            />
            <ColorPickerInput
              label="Accent"
              value={colors.accent}
              onChange={(val) => updateConfig([...basePath, 'accent'], val)}
            />
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-gray-800 mb-3">Background Colors</h4>
          <div className="space-y-4">
            <ColorPickerInput
              label="Page Background"
              value={colors.background.page}
              onChange={(val) => updateConfig([...basePath, 'background', 'page'], val)}
            />
            <ColorPickerInput
              label="Surface Background"
              value={colors.background.surface}
              onChange={(val) => updateConfig([...basePath, 'background', 'surface'], val)}
            />
            <ColorPickerInput
              label="Elevated Background"
              value={colors.background.elevated}
              onChange={(val) => updateConfig([...basePath, 'background', 'elevated'], val)}
            />
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-gray-800 mb-3">Text Colors</h4>
          <div className="space-y-4">
            <ColorPickerInput
              label="Primary Text"
              value={colors.text.primary}
              onChange={(val) => updateConfig([...basePath, 'text', 'primary'], val)}
              showContrastChecker
              contrastBackground={colors.background.page}
            />
            <ColorPickerInput
              label="Secondary Text"
              value={colors.text.secondary}
              onChange={(val) => updateConfig([...basePath, 'text', 'secondary'], val)}
              showContrastChecker
              contrastBackground={colors.background.page}
            />
            <ColorPickerInput
              label="Muted Text"
              value={colors.text.muted}
              onChange={(val) => updateConfig([...basePath, 'text', 'muted'], val)}
            />
            <ColorPickerInput
              label="Inverse Text"
              value={colors.text.inverse}
              onChange={(val) => updateConfig([...basePath, 'text', 'inverse'], val)}
            />
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-gray-800 mb-3">Semantic Colors</h4>
          <div className="space-y-4">
            <ColorPickerInput
              label="Success"
              value={colors.semantic.success}
              onChange={(val) => updateConfig([...basePath, 'semantic', 'success'], val)}
            />
            <ColorPickerInput
              label="Warning"
              value={colors.semantic.warning}
              onChange={(val) => updateConfig([...basePath, 'semantic', 'warning'], val)}
            />
            <ColorPickerInput
              label="Error"
              value={colors.semantic.error}
              onChange={(val) => updateConfig([...basePath, 'semantic', 'error'], val)}
            />
            <ColorPickerInput
              label="Info"
              value={colors.semantic.info}
              onChange={(val) => updateConfig([...basePath, 'semantic', 'info'], val)}
            />
          </div>
        </section>

        <section>
          <h4 className="font-semibold text-gray-800 mb-3">Border Colors</h4>
          <div className="space-y-4">
            <ColorPickerInput
              label="Default Border"
              value={colors.border.default}
              onChange={(val) => updateConfig([...basePath, 'border', 'default'], val)}
            />
            <ColorPickerInput
              label="Hover Border"
              value={colors.border.hover}
              onChange={(val) => updateConfig([...basePath, 'border', 'hover'], val)}
            />
            <ColorPickerInput
              label="Focus Border"
              value={colors.border.focus}
              onChange={(val) => updateConfig([...basePath, 'border', 'focus'], val)}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const TypographyTab: React.FC<TabProps> = ({ config, updateConfig }) => (
  <div className="max-w-2xl space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">Typography Settings</h3>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Font Families</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
          <input
            type="text"
            value={config.typography.fontFamilies.heading}
            onChange={(e) => updateConfig(['typography', 'fontFamilies', 'heading'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Inter, sans-serif"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
          <input
            type="text"
            value={config.typography.fontFamilies.body}
            onChange={(e) => updateConfig(['typography', 'fontFamilies', 'body'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Inter, sans-serif"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monospace Font</label>
          <input
            type="text"
            value={config.typography.fontFamilies.mono}
            onChange={(e) => updateConfig(['typography', 'fontFamilies', 'mono'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 'Courier New', monospace"
          />
        </div>
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Preview</h4>
      <div
        className="p-6 bg-gray-50 rounded-lg border border-gray-200"
        style={{ fontFamily: config.typography.fontFamilies.body }}
      >
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: config.typography.fontFamilies.heading }}
        >
          Heading Sample
        </h1>
        <p className="text-base text-gray-700 mb-2">
          This is body text using the selected font family. It demonstrates how the typography will look in your theme.
        </p>
        <code
          className="text-sm bg-white px-2 py-1 rounded border"
          style={{ fontFamily: config.typography.fontFamilies.mono }}
        >
          Monospace code sample
        </code>
      </div>
    </section>
  </div>
);

const DesignTokensTab: React.FC<TabProps> = ({ config, updateConfig }) => (
  <div className="max-w-2xl space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">Design Tokens</h3>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Border Radius</h4>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(config.designTokens.borderRadius).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => updateConfig(['designTokens', 'borderRadius', key], e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>
    </section>
  </div>
);

const LayoutsTab: React.FC<TabProps> = ({ config, updateConfig }) => (
  <div className="max-w-2xl space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">Layout Configuration</h3>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Navigation</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
          <select
            value={config.layouts.navigation.style}
            onChange={(e) => updateConfig(['layouts', 'navigation', 'style'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="floating">Floating</option>
            <option value="sticky">Sticky</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.layouts.navigation.transparent}
              onChange={(e) => updateConfig(['layouts', 'navigation', 'transparent'], e.target.checked)}
              className="rounded border-gray-300"
            />
            Transparent Background
          </label>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <input
              type="checkbox"
              checked={!!config.layouts.navigation.activeBackground}
              onChange={(e) => {
                if (e.target.checked) {
                  updateConfig(['layouts', 'navigation', 'activeBackground'], '#0066CC');
                } else {
                  updateConfig(['layouts', 'navigation', 'activeBackground'], null);
                }
              }}
              className="rounded border-gray-300"
            />
            Show Navigation Active Background
          </label>
          {config.layouts.navigation.activeBackground && (
            <div className="ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Active Background Color</label>
              <input
                type="color"
                value={config.layouts.navigation.activeBackground}
                onChange={(e) => updateConfig(['layouts', 'navigation', 'activeBackground'], e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={config.layouts.navigation.enableThemeModeToggle !== false}
              onChange={(e) => updateConfig(['layouts', 'navigation', 'enableThemeModeToggle'], e.target.checked)}
              className="rounded border-gray-300"
            />
            Enable Light/Dark Mode Toggle
          </label>
          <p className="text-xs text-gray-600 mt-1 ml-6">
            Show the light/dark mode switcher icon in the navigation bar
          </p>
        </div>
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Emergency Button</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
          <input
            type="text"
            value={config.emergencyButton?.text || 'Emergency Call'}
            onChange={(e) => updateConfig(['emergencyButton', 'text'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency Call"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <input
            type="color"
            value={config.emergencyButton?.backgroundColor || '#EF4444'}
            onChange={(e) => updateConfig(['emergencyButton', 'backgroundColor'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <input
            type="color"
            value={config.emergencyButton?.textColor || '#FFFFFF'}
            onChange={(e) => updateConfig(['emergencyButton', 'textColor'], e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
          />
        </div>
        <p className="text-xs text-gray-600">
          Customize the emergency call button in hero sections
        </p>
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Back Button</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
          <input
            type="text"
            value={config.backButton?.text || 'Back'}
            onChange={(e) => updateConfig(['backButton', 'text'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Back"
          />
        </div>
        <ColorPickerInput
          label="Background Color"
          value={config.backButton?.backgroundColor || 'transparent'}
          onChange={(val) => updateConfig(['backButton', 'backgroundColor'], val)}
        />
        <p className="text-xs text-gray-500 -mt-2">Leave empty to use theme primary color</p>

        <ColorPickerInput
          label="Text Color"
          value={config.backButton?.textColor || ''}
          onChange={(val) => updateConfig(['backButton', 'textColor'], val)}
        />
        <p className="text-xs text-gray-500 -mt-2">Leave empty to use theme primary color</p>

        <ColorPickerInput
          label="Border Color"
          value={config.backButton?.borderColor || ''}
          onChange={(val) => updateConfig(['backButton', 'borderColor'], val)}
        />
        <p className="text-xs text-gray-500 -mt-2">Leave empty to use default border</p>

        <ColorPickerInput
          label="Hover Background Color"
          value={config.backButton?.hoverBackgroundColor || ''}
          onChange={(val) => updateConfig(['backButton', 'hoverBackgroundColor'], val)}
        />
        <p className="text-xs text-gray-500 -mt-2">Leave empty for default hover effect</p>

        <ColorPickerInput
          label="Hover Text Color"
          value={config.backButton?.hoverTextColor || ''}
          onChange={(val) => updateConfig(['backButton', 'hoverTextColor'], val)}
        />
        <p className="text-xs text-gray-500 -mt-2">Leave empty for default hover color</p>
        <p className="text-xs text-gray-600">
          Customize the back button used in detail pages like Health Library
        </p>
      </div>
    </section>
  </div>
);

const AnimationsTab: React.FC<TabProps> = ({ config, updateConfig }) => (
  <div className="max-w-2xl space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">Animation Settings</h3>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Animation Features</h4>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.animations.features.scrollReveal}
            onChange={(e) => updateConfig(['animations', 'features', 'scrollReveal'], e.target.checked)}
            className="rounded border-gray-300"
          />
          Scroll Reveal Animations
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.animations.features.hoverEffects}
            onChange={(e) => updateConfig(['animations', 'features', 'hoverEffects'], e.target.checked)}
            className="rounded border-gray-300"
          />
          Hover Effects
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.animations.features.pageTransitions}
            onChange={(e) => updateConfig(['animations', 'features', 'pageTransitions'], e.target.checked)}
            className="rounded border-gray-300"
          />
          Page Transitions
        </label>
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Cards</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hover Effect</label>
          <select
            value={config.layouts.cards.hoverEffect}
            onChange={(e) => updateConfig(['layouts', 'cards', 'hoverEffect'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="subtle">Subtle</option>
            <option value="lift">Lift</option>
            <option value="bounce">Bounce</option>
          </select>
          <p className="text-xs text-gray-600 mt-2">
            Choose the hover animation effect for cards throughout the site
          </p>
        </div>
      </div>
    </section>
  </div>
);

const AccessibilityTab: React.FC<TabProps> = ({ config, updateConfig }) => (
  <div className="max-w-2xl space-y-6">
    <h3 className="text-lg font-semibold text-gray-900">Accessibility Settings</h3>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Focus Indicators</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
          <select
            value={config.accessibility.focusIndicators.style}
            onChange={(e) => updateConfig(['accessibility', 'focusIndicators', 'style'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="outline">Outline</option>
            <option value="shadow">Shadow</option>
            <option value="border">Border</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
          <input
            type="text"
            value={config.accessibility.focusIndicators.width}
            onChange={(e) => updateConfig(['accessibility', 'focusIndicators', 'width'], e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </section>

    <section>
      <h4 className="font-semibold text-gray-800 mb-3">Keyboard Navigation</h4>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.accessibility.keyboardNavigation.skipLinks}
            onChange={(e) => updateConfig(['accessibility', 'keyboardNavigation', 'skipLinks'], e.target.checked)}
            className="rounded border-gray-300"
          />
          Skip Links Enabled
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.accessibility.keyboardNavigation.focusVisible}
            onChange={(e) => updateConfig(['accessibility', 'keyboardNavigation', 'focusVisible'], e.target.checked)}
            className="rounded border-gray-300"
          />
          Focus Visible Indicators
        </label>
      </div>
    </section>
  </div>
);
