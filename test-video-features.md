# Phase 5A Video Features Test Plan

## Test Case 1: Add YouTube Video (Standard URL)
1. Navigate to Edit Event page
2. Paste URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Add Video"
4. ✓ Video should appear in grid with thumbnail
5. ✓ Title should be fetched from YouTube
6. ✓ Counter shows (1/10 videos)

## Test Case 2: Add YouTube Video (Short URL)
1. Paste URL: `https://youtu.be/dQw4w9WgXcQ`
2. Click "Add Video"
3. ✓ Video should be added successfully

## Test Case 3: Add YouTube Video (Embed URL)
1. Paste URL: `https://www.youtube.com/embed/dQw4w9WgXcQ`
2. Click "Add Video"
3. ✓ Should show duplicate error

## Test Case 4: Watch Video in Modal
1. Click on any video thumbnail
2. ✓ Modal opens with YouTube player
3. ✓ Video starts playing automatically
4. ✓ Close button (X) closes modal
5. ✓ Click outside modal closes it

## Test Case 5: Validation Tests
1. Try to add empty URL → ✓ Error: "Please enter a YouTube URL"
2. Try to add invalid URL: `https://vimeo.com/123` → ✓ Error: "Invalid YouTube URL"
3. Try to add same video twice → ✓ Error: "This video has already been added"
4. Add 10 videos → ✓ Input becomes disabled
5. Try to add 11th video → ✓ Error: "Maximum 10 videos allowed"

## Features Implemented
- ✓ YouTube URL input with Enter key support
- ✓ Extracts video ID from multiple URL formats
- ✓ Fetches video title from YouTube oEmbed API
- ✓ Displays videos in responsive grid (1-4 columns)
- ✓ Shows YouTube thumbnail with hover play icon
- ✓ Opens video in modal player with autoplay
- ✓ Validates max 10 videos per event
- ✓ Prevents duplicate videos
- ✓ Empty state when no videos added
- ✓ Error messages for all validation cases

## Database Schema
Table: event_videos
- id (uuid, primary key)
- event_id (uuid, foreign key)
- youtube_url (text)
- youtube_video_id (text)
- title (text, nullable)
- display_order (integer)
- created_at (timestamp)
