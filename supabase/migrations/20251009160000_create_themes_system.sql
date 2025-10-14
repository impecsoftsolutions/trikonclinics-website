/*
  # Create Themes and Site Settings Tables

  ## Overview
  This migration creates the database-driven theme system with preset themes
  and site configuration.

  ## Tables Created

  ### 1. themes
  Stores all available themes (preset and custom)
  - `id` (uuid, primary key) - Unique theme identifier
  - `name` (text, unique) - Theme display name
  - `description` (text) - Theme description
  - `is_preset` (boolean) - Whether this is a system preset theme
  - `theme_data` (jsonb) - Complete theme configuration (colors, typography, patterns, etc.)
  - `created_by` (uuid) - User who created the theme (NULL for presets)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. site_settings
  Stores global site configuration (single row table)
  - `id` (uuid, primary key) - Settings record ID
  - `active_theme_id` (uuid) - Currently active theme
  - `updated_by` (uuid) - User who last updated settings
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS disabled on both tables since this application uses custom authentication
  - Authorization is handled at the application level
  - Only admin users can access the theme settings page

  ## Important Notes
  - 6 preset themes are inserted with proper theme_data JSON
  - Modern Medical theme is set as default active theme
  - Themes include colors, typography, visual styles, and pattern support
*/

-- Create themes table
CREATE TABLE IF NOT EXISTS themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_preset boolean DEFAULT false,
  theme_data jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_theme_id uuid REFERENCES themes(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now()
);

-- Disable RLS since this application uses custom authentication (not Supabase Auth)
-- Authorization is handled at the application level
ALTER TABLE themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_themes_is_preset ON themes(is_preset);
CREATE INDEX IF NOT EXISTS idx_themes_name ON themes(name);
CREATE INDEX IF NOT EXISTS idx_site_settings_active_theme ON site_settings(active_theme_id);

-- Insert 6 preset themes
INSERT INTO themes (name, description, is_preset, theme_data) VALUES
(
  'Modern Medical',
  'Clean and professional blue theme with modern aesthetics',
  true,
  '{"colors":{"primary":"#2563eb","secondary":"#1e40af","accent":"#3b82f6","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#f9fafb","backgroundDark":"#111827"},"typography":{"headingFont":"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","bodyFont":"Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"700","bodyWeight":"400","headingLetterSpacing":"-0.02em","bodyLetterSpacing":"normal"},"visualStyle":{"borderRadius":"0.75rem","shadowStyle":"0 4px 6px -1px rgba(0, 0, 0, 0.1)","buttonRadius":"0.75rem","cardRadius":"1rem"},"patterns":{"enabled":false,"type":"none"}}'::jsonb
),
(
  'Trikon Brand',
  'Brand identity theme with purple accents and hexagonal patterns',
  true,
  '{"colors":{"primary":"#7c3aed","secondary":"#6d28d9","accent":"#a78bfa","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#faf5ff","backgroundDark":"#2e1065"},"typography":{"headingFont":"Montserrat, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","bodyFont":"Open Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"700","bodyWeight":"400","headingLetterSpacing":"-0.01em","bodyLetterSpacing":"normal"},"visualStyle":{"borderRadius":"0.5rem","shadowStyle":"0 10px 15px -3px rgba(0, 0, 0, 0.1)","buttonRadius":"0.5rem","cardRadius":"0.75rem"},"patterns":{"enabled":true,"type":"hexagons"}}'::jsonb
),
(
  'Calm & Caring',
  'Soft teal theme promoting tranquility and trust',
  true,
  '{"colors":{"primary":"#14b8a6","secondary":"#0d9488","accent":"#5eead4","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#f0fdfa","backgroundDark":"#134e4a"},"typography":{"headingFont":"Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","bodyFont":"Lato, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"600","bodyWeight":"400","headingLetterSpacing":"normal","bodyLetterSpacing":"normal"},"visualStyle":{"borderRadius":"1rem","shadowStyle":"0 4px 6px -1px rgba(0, 0, 0, 0.08)","buttonRadius":"2rem","cardRadius":"1.5rem"},"patterns":{"enabled":false,"type":"none"}}'::jsonb
),
(
  'Bold & Confident',
  'Vibrant orange theme conveying energy and expertise',
  true,
  '{"colors":{"primary":"#ea580c","secondary":"#c2410c","accent":"#fb923c","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#fff7ed","backgroundDark":"#7c2d12"},"typography":{"headingFont":"Raleway, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","bodyFont":"Source Sans Pro, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"800","bodyWeight":"400","headingLetterSpacing":"-0.02em","bodyLetterSpacing":"0.01em"},"visualStyle":{"borderRadius":"0.5rem","shadowStyle":"0 10px 15px -3px rgba(0, 0, 0, 0.15)","buttonRadius":"0.5rem","cardRadius":"0.75rem"},"patterns":{"enabled":false,"type":"none"}}'::jsonb
),
(
  'Elegant Wellness',
  'Sophisticated sage green theme promoting health and balance',
  true,
  '{"colors":{"primary":"#059669","secondary":"#047857","accent":"#34d399","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#f0fdf4","backgroundDark":"#064e3b"},"typography":{"headingFont":"Playfair Display, Georgia, serif","bodyFont":"Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"700","bodyWeight":"400","headingLetterSpacing":"normal","bodyLetterSpacing":"normal"},"visualStyle":{"borderRadius":"0.75rem","shadowStyle":"0 4px 6px -1px rgba(0, 0, 0, 0.1)","buttonRadius":"0.5rem","cardRadius":"1rem"},"patterns":{"enabled":false,"type":"none"}}'::jsonb
),
(
  'Warm & Welcoming',
  'Friendly amber theme creating a comfortable atmosphere',
  true,
  '{"colors":{"primary":"#d97706","secondary":"#b45309","accent":"#fbbf24","success":"#10b981","warning":"#f59e0b","error":"#ef4444","textPrimary":"#1f2937","textSecondary":"#6b7280","backgroundLight":"#fffbeb","backgroundDark":"#78350f"},"typography":{"headingFont":"Quicksand, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","bodyFont":"Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif","headingWeight":"600","bodyWeight":"400","headingLetterSpacing":"normal","bodyLetterSpacing":"normal"},"visualStyle":{"borderRadius":"1rem","shadowStyle":"0 4px 6px -1px rgba(0, 0, 0, 0.1)","buttonRadius":"1.5rem","cardRadius":"1.25rem"},"patterns":{"enabled":false,"type":"none"}}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Insert default site_settings record with Modern Medical as active theme
INSERT INTO site_settings (active_theme_id)
SELECT id FROM themes WHERE name = 'Modern Medical'
LIMIT 1
ON CONFLICT DO NOTHING;
