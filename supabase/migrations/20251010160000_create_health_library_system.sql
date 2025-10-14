/*
  # Create Health Library System

  1. New Tables
    - `health_library_categories`
      - `id` (uuid, primary key)
      - `category_name` (text, unique)
      - `slug` (text, unique, URL-friendly)
      - `display_order` (integer, for sorting)
      - `is_enabled` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `health_library_illnesses`
      - `id` (uuid, primary key)
      - `illness_name` (text, unique)
      - `slug` (text, unique, URL-friendly)
      - `short_summary` (text)
      - `meaning` (text, detailed description)
      - `symptoms` (jsonb array of symptom items)
      - `management_treatment` (jsonb array of treatment steps)
      - `category_id` (uuid, foreign key to categories)
      - `tags` (text array)
      - `visibility` (text, enum: 'draft' or 'published')
      - `display_order` (integer, for sorting)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `health_library_images`
      - `id` (uuid, primary key)
      - `illness_id` (uuid, foreign key to illnesses)
      - `image_url` (text)
      - `alt_text` (text)
      - `display_order` (integer, for sorting)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all three tables
    - Public can read published illnesses and enabled categories
    - Only Super Admin can create, update, delete

  3. Seed Data
    - Add "Heart & Circulation" category
    - Add "Hypertension (High Blood Pressure)" illness with complete data
*/

CREATE TABLE IF NOT EXISTS health_library_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  display_order integer DEFAULT 0,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_library_illnesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  illness_name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  short_summary text NOT NULL,
  meaning text,
  symptoms jsonb DEFAULT '[]'::jsonb,
  management_treatment jsonb DEFAULT '[]'::jsonb,
  category_id uuid REFERENCES health_library_categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  visibility text DEFAULT 'draft' CHECK (visibility IN ('draft', 'published')),
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_library_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  illness_id uuid REFERENCES health_library_illnesses(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE health_library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_library_illnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_library_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view enabled categories"
  ON health_library_categories FOR SELECT
  TO anon, authenticated
  USING (is_enabled = true);

CREATE POLICY "Super Admin can manage categories"
  ON health_library_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Public can view published illnesses"
  ON health_library_illnesses FOR SELECT
  TO anon, authenticated
  USING (visibility = 'published');

CREATE POLICY "Super Admin can manage illnesses"
  ON health_library_illnesses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Public can view images of published illnesses"
  ON health_library_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM health_library_illnesses
      WHERE health_library_illnesses.id = health_library_images.illness_id
      AND health_library_illnesses.visibility = 'published'
    )
  );

CREATE POLICY "Super Admin can manage images"
  ON health_library_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_illnesses_category ON health_library_illnesses(category_id);
CREATE INDEX IF NOT EXISTS idx_illnesses_visibility ON health_library_illnesses(visibility);
CREATE INDEX IF NOT EXISTS idx_illnesses_slug ON health_library_illnesses(slug);
CREATE INDEX IF NOT EXISTS idx_images_illness ON health_library_images(illness_id);

INSERT INTO health_library_categories (category_name, slug, display_order, is_enabled)
VALUES ('Heart & Circulation', 'heart-circulation', 1, true)
ON CONFLICT (category_name) DO NOTHING;

DO $$
DECLARE
  v_category_id uuid;
  v_illness_id uuid;
BEGIN
  SELECT id INTO v_category_id FROM health_library_categories WHERE slug = 'heart-circulation';

  INSERT INTO health_library_illnesses (
    illness_name,
    slug,
    short_summary,
    meaning,
    symptoms,
    management_treatment,
    category_id,
    tags,
    visibility,
    display_order
  )
  VALUES (
    'Hypertension (High Blood Pressure)',
    'hypertension-high-blood-pressure',
    'Long-term high blood pressure that increases risks for heart, brain, kidney, and eye problems.',
    'Blood pressure remains higher than normal over time, putting extra strain on arteries and organs.',
    jsonb_build_array(
      'Often no symptoms',
      'Headaches',
      'Dizziness',
      'Breathlessness',
      'Chest discomfort',
      'Nosebleeds'
    ),
    jsonb_build_array(
      'Regular BP checks',
      'Salt control',
      'Balanced diet',
      'Exercise',
      'Weight management',
      'Good sleep',
      'Limit alcohol/tobacco',
      'Medicines as advised by a doctor',
      'Scheduled follow-ups and labs'
    ),
    v_category_id,
    ARRAY['blood pressure', 'heart health'],
    'published',
    1
  )
  ON CONFLICT (illness_name) DO NOTHING
  RETURNING id INTO v_illness_id;

  IF v_illness_id IS NOT NULL THEN
    INSERT INTO health_library_images (illness_id, image_url, alt_text, display_order)
    VALUES
      (v_illness_id, 'https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?auto=compress&cs=tinysrgb&w=800', 'Blood pressure measurement', 1),
      (v_illness_id, 'https://images.pexels.com/photos/7659671/pexels-photo-7659671.jpeg?auto=compress&cs=tinysrgb&w=800', 'Healthcare professional checking blood pressure', 2)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
