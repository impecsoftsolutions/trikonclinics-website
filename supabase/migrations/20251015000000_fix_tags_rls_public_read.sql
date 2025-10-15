/*
  # Fix Tags Table RLS for Public Read Access

  1. Changes
    - Enable RLS on tags table
    - Drop any existing restrictive policies
    - Create policy to allow public read access to all tags/categories
    - Allow content managers to insert/update/delete tags

  2. Security
    - Public can read all tags (needed for event categorization)
    - Only authenticated users with content management roles can modify tags
*/

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
DROP POLICY IF EXISTS "Allow public read access to tags" ON tags;
DROP POLICY IF EXISTS "Allow authenticated users to read tags" ON tags;
DROP POLICY IF EXISTS "Content managers can manage tags" ON tags;

-- Allow anyone (including anonymous users) to read tags
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users with content management role to manage tags
CREATE POLICY "Content managers can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'content_manager')
    )
  );
