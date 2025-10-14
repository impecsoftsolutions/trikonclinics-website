# Supabase Storage Setup Instructions

## What Was Implemented

Your hospital management system now has complete image upload functionality! The following features have been added:

### New Admin Pages
1. **Hospital Profile** (`/admin/hospital-profile`) - Upload logo and banner images
2. **Manage Doctors** (`/admin/doctors`) - Upload doctor photos
3. **Manage Services** (`/admin/services`) - Upload service icons
4. **Manage Testimonials** (`/admin/testimonials`) - Upload patient photos

### Features
- Drag-and-drop image upload
- Image preview before saving
- File validation (max 5MB, JPEG/PNG/WebP/GIF only)
- Automatic public URL generation
- Delete old images when updating
- Secure storage with RLS policies

## Required SQL Setup

To enable image uploads, you need to run the storage setup SQL in your Supabase dashboard.

### Step-by-Step Instructions

#### 1. Access Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **ztfrjlmkemqjbclaeqfw**
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

#### 2. Run the Storage Setup Migration

Copy the **ENTIRE contents** of the file below and paste it into the SQL Editor:

**File:** `supabase/migrations/20251008163000_setup_storage.sql`

Then click **"Run"** to execute the SQL.

#### 3. What This SQL Does

The migration will:
- Create 4 storage buckets (hospital-profile, doctors, testimonials, services)
- Set file size limit to 5MB per file
- Allow only image file types (JPEG, PNG, WebP, GIF)
- Configure public read access for website visitors
- Restrict write access to authenticated admin users
- Set up Row Level Security policies for all buckets

#### 4. Verify Setup

After running the SQL, you can verify the setup in Supabase:

1. Go to **Storage** section in Supabase dashboard
2. You should see 4 new buckets:
   - `hospital-profile`
   - `doctors`
   - `testimonials`
   - `services`

## Using the Image Upload Feature

### In the Admin Panel

1. Login to your admin panel
2. Navigate to any of the management pages
3. Look for the image upload section
4. Click the upload area or drag an image onto it
5. Wait for the upload to complete
6. The image URL will be automatically saved when you submit the form

### Image Requirements

- **File Size:** Maximum 5MB
- **File Types:** JPEG, PNG, WebP, GIF
- **Recommended Sizes:**
  - Hospital Logo: 200x200px or larger (square)
  - Banner: 1920x500px or larger (wide)
  - Doctor Photos: 400x400px or larger (square)
  - Testimonial Photos: 200x200px or larger (square)
  - Service Icons: 100x100px or larger (square)

## Security Features

### Public Access (Read)
- Anyone can view uploaded images via public URLs
- Perfect for displaying images on your public website
- No authentication required for viewing

### Admin Access (Write)
- Only authenticated admin users can upload images
- Only authenticated users can delete images
- Upload requires active session from login

### Storage Policies
- Each bucket has separate RLS policies
- Policies check for authenticated users before allowing uploads
- All policies follow the principle of least privilege

## Troubleshooting

### "Upload failed" Error
**Cause:** Storage buckets not created or RLS policies missing
**Solution:** Run the storage setup SQL migration

### "File too large" Error
**Cause:** File exceeds 5MB limit
**Solution:** Resize or compress the image before uploading

### "Invalid file type" Error
**Cause:** File is not JPEG, PNG, WebP, or GIF
**Solution:** Convert the image to a supported format

### Images Not Displaying
**Cause:** Public access policy not configured
**Solution:** Verify RLS policies were created correctly

### Cannot Upload
**Cause:** Not logged in or session expired
**Solution:** Log out and log back in to refresh your session

## File Organization

### Project Structure
```
src/
├── components/
│   └── ImageUpload.tsx          # Reusable upload component
├── pages/
│   ├── HospitalProfile.tsx      # Hospital settings with logo/banner upload
│   ├── ManageDoctors.tsx        # Doctor management with photo upload
│   ├── ManageServices.tsx       # Service management with icon upload
│   └── ManageTestimonials.tsx   # Testimonial management with photo upload
└── utils/
    └── storage.ts               # Upload/delete helper functions

supabase/
└── migrations/
    └── 20251008163000_setup_storage.sql  # Storage setup migration
```

## Next Steps

After running the SQL migration:

1. Log into your admin panel
2. Go to Hospital Profile and upload your logo and banner
3. Add doctors with their photos
4. Add services with icons
5. Add testimonials with patient photos
6. Visit your public website to see the uploaded images

All uploaded images will be automatically served from Supabase Storage with fast CDN delivery!

## Notes

- Images are stored permanently in Supabase Storage
- Old images are NOT automatically deleted when updating (feature can be added later)
- Each bucket is isolated for better organization
- Public URLs are generated automatically and stored in the database
- Storage costs are included in your Supabase plan (check limits)

---

**Need Help?** Check the Supabase Storage documentation: https://supabase.com/docs/guides/storage
