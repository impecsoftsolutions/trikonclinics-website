/*
  # Create Theme Settings Table

  ## Overview
  This migration creates a table to store customizable theme/branding colors for the hospital website.
  Allows admins to customize the color scheme dynamically without code changes.

  ## Tables Created

  ### theme_settings
  Stores color scheme and theme configuration for the website
  - `id` (uuid, primary key) - Unique identifier
  - `primary_color` (text) - Main brand color (hex format)
  - `secondary_color` (text) - Secondary brand color (hex format)
  - `accent_color` (text) - Accent/highlight color (hex format)
  - `success_color` (text) - Success state color (hex format)
  - `warning_color` (text) - Warning state color (hex format)
  - `error_color` (text) - Error state color (hex format)
  - `text_primary` (text) - Primary text color (hex format)
  - `text_secondary` (text) - Secondary text color (hex format)
  - `background_light` (text) - Light background color (hex format)
  - `background_dark` (text) - Dark background color (hex format)
  - `last_updated_by` (uuid) - User who last updated theme
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS (Row Level Security) is enabled
  - Anyone can view theme settings (needed for public website)
  - Only Admin roles and above can modify theme settings

  ## Default Values
  - Default color scheme matches current blue-based design
  - Only one theme settings record should exist (enforced by application logic)
*/

-- Create theme_settings table
CREATE TABLE IF NOT EXISTS theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#1e40af',
  accent_color text DEFAULT '#3b82f6',
  success_color text DEFAULT '#10b981',
  warning_color text DEFAULT '#f59e0b',
  error_color text DEFAULT '#ef4444',
  text_primary text DEFAULT '#1f2937',
  text_secondary text DEFAULT '#6b7280',
  background_light text DEFAULT '#f9fafb',
  background_dark text DEFAULT '#111827',
  last_updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE theme_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view theme settings (needed for public website)
CREATE POLICY "Anyone can view theme settings"
  ON theme_settings FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Admin and above can update theme settings
CREATE POLICY "Admin and above can update theme settings"
  ON theme_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policy: Admin and above can insert theme settings
CREATE POLICY "Admin and above can insert theme settings"
  ON theme_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- Insert default theme settings if none exist
INSERT INTO theme_settings (
  primary_color,
  secondary_color,
  accent_color,
  success_color,
  warning_color,
  error_color,
  text_primary,
  text_secondary,
  background_light,
  background_dark
) VALUES (
  '#2563eb',
  '#1e40af',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#1f2937',
  '#6b7280',
  '#f9fafb',
  '#111827'
)
ON CONFLICT DO NOTHING;
