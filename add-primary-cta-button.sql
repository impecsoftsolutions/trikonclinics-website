-- Add primaryCtaButton to all existing themes in modern_themes table

-- First, show current state
SELECT
  name,
  CASE
    WHEN config->'primaryCtaButton' IS NULL THEN 'NULL'
    ELSE 'EXISTS'
  END as primary_cta_button_status
FROM modern_themes
ORDER BY name;

-- Update all themes to add primaryCtaButton if it doesn't exist
UPDATE modern_themes
SET config = jsonb_set(
  config,
  '{primaryCtaButton}',
  '{"text": "Get Started", "backgroundColor": "#CC0000", "textColor": "#FFFFFF", "hoverOpacity": 0.9}'::jsonb,
  true
)
WHERE config->'primaryCtaButton' IS NULL;

-- Show updated state
SELECT
  name,
  config->'primaryCtaButton' as primary_cta_button
FROM modern_themes
ORDER BY name;
