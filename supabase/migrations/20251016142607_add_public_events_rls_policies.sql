/*
  # Add Public RLS Policies for Events System

  1. New Policies
    - `events` table
      - Allow public read access to published events only
    - `event_images` table  
      - Allow public read access to images of published events
    - `event_videos` table
      - Allow public read access to videos of published events

  2. Security
    - Public users can only view published events and their related content
    - Draft events remain hidden from public
    - Authenticated admin users retain full access via existing policies
*/

-- Allow public read access to published events
CREATE POLICY "Allow public read access to published events"
ON events FOR SELECT
TO public
USING (status = 'published');

-- Allow public read access to images of published events
CREATE POLICY "Allow public read access to event images"
ON event_images FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_images.event_id
    AND events.status = 'published'
  )
);

-- Allow public read access to videos of published events
CREATE POLICY "Allow public read access to event videos"
ON event_videos FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_videos.event_id
    AND events.status = 'published'
  )
);
