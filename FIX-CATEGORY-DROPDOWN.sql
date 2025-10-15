-- ============================================================================
-- FIX CATEGORY DROPDOWN - APPLY THIS SQL IN SUPABASE DASHBOARD
-- ============================================================================
--
-- PROBLEM: Category dropdown shows "No categories available"
-- CAUSE: RLS policy only allows 'authenticated' users, not 'anon' users
-- SOLUTION: Update policy to allow both 'anon' and 'authenticated' users
--
-- HOW TO APPLY:
--   1. Go to: https://supabase.com/dashboard
--   2. Open your project
--   3. Click "SQL Editor" in left sidebar
--   4. Click "New Query"
--   5. Copy and paste this entire SQL script
--   6. Click "Run"
--   7. You should see "Success. No rows returned"
--   8. Refresh your application - categories will now load!
--
-- ============================================================================

-- Enable RLS on tags table (if not already enabled)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;

-- Create new policy allowing BOTH anonymous and authenticated users to read
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
--
-- After running this SQL, your category dropdown should immediately work!
--
-- To verify the 5 categories exist, run this query:
--   SELECT * FROM tags ORDER BY tag_name;
--
-- You should see:
--   1. Announcements
--   2. Awareness Programs
--   3. Community Outreach
--   4. Health Camps
--   5. Seminars & Workshops
--
-- ============================================================================
