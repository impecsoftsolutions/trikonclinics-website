/*
  # Add Back Button Configuration to Modern Themes

  1. Changes
    - Add backButton configuration to all existing themes in modern_themes table
    - BackButton includes: text, backgroundColor, textColor, borderColor, hoverBackgroundColor, hoverTextColor
    - Default back button uses theme primary color with proper contrast

  2. Notes
    - Update all modern_themes to include backButton in config (if missing)
    - Provides sensible defaults for back button styling
    - Allows full customization in theme editor
*/

-- Add backButton to themes that don't have it
UPDATE modern_themes
SET config = jsonb_set(
  config,
  '{backButton}',
  '{"text": "Back", "backgroundColor": "transparent", "textColor": "", "borderColor": "", "hoverBackgroundColor": "", "hoverTextColor": ""}'::jsonb,
  true
)
WHERE config->'backButton' IS NULL;
