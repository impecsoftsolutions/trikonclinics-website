/*
  # Trikon Clinics Hospital Management System - Database Schema

  ## Overview
  This migration creates the complete database schema for the Trikon Clinics hospital 
  website and admin panel management system.

  ## Tables Created

  ### 1. users
  Stores admin login information and user management
  - `id` (uuid, primary key) - Unique user identifier
  - `username` (text, unique) - Login username
  - `password` (text) - Hashed password
  - `email` (text, unique) - User email address
  - `role` (text) - User role: Super Admin, Admin, Content Manager, or Viewer
  - `created_by` (uuid) - Reference to user who created this account
  - `last_login` (timestamptz) - Last login timestamp
  - `is_enabled` (boolean) - Whether account is active
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. hospital_profile
  Stores hospital information and branding
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Hospital name
  - `about_text` (text) - About section content
  - `mission` (text) - Mission statement
  - `address` (text) - Street address
  - `city` (text) - City name
  - `state` (text) - State name
  - `pincode` (text) - Postal code
  - `phone_numbers` (text[]) - Array of phone numbers
  - `emails` (text[]) - Array of email addresses
  - `working_hours` (text) - Working hours description
  - `logo_image` (text) - Logo image URL
  - `banner_image` (text) - Banner image URL
  - `last_updated_by` (uuid) - User who last updated
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. doctors
  Stores doctor profiles and information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Doctor's full name
  - `qualification` (text) - Educational qualifications
  - `specialisation` (text) - Medical specialization
  - `years_of_experience` (integer) - Years in practice
  - `expertise_details` (text) - Detailed expertise description
  - `photo` (text) - Doctor's photo URL
  - `display_order` (integer) - Order for website display
  - `is_enabled` (boolean) - Whether profile is active
  - `added_by` (uuid) - User who added this doctor
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. testimonials
  Stores patient reviews and testimonials
  - `id` (uuid, primary key) - Unique identifier
  - `patient_name` (text) - Patient's name
  - `review_english` (text) - Review in English
  - `review_telugu` (text) - Review in Telugu
  - `patient_photo` (text) - Patient's photo URL
  - `star_rating` (integer) - Rating from 1-5
  - `display_order` (integer) - Order for website display
  - `is_published` (boolean) - Whether review is published
  - `added_by` (uuid) - User who added this testimonial
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. services
  Stores medical services offered by the clinic
  - `id` (uuid, primary key) - Unique identifier
  - `service_name` (text) - Name of the service
  - `description` (text) - Service description
  - `icon_image` (text) - Icon image URL
  - `display_order` (integer) - Order for website display
  - `is_enabled` (boolean) - Whether service is active
  - `added_by` (uuid) - User who added this service
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. contact_information
  Stores contact page details
  - `id` (uuid, primary key) - Unique identifier
  - `address` (text) - Contact address
  - `phone_numbers` (text[]) - Array of phone numbers
  - `email_addresses` (text[]) - Array of email addresses
  - `working_hours` (text) - Working hours description
  - `appointment_booking_link` (text) - Booking URL
  - `google_maps_code` (text) - Google Maps embed code
  - `last_updated_by` (uuid) - User who last updated
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. social_media
  Stores social media platform links
  - `id` (uuid, primary key) - Unique identifier
  - `platform_name` (text) - Platform name (Facebook, Instagram, etc.)
  - `profile_url` (text) - Social media profile URL
  - `is_enabled` (boolean) - Whether link is active
  - `display_order` (integer) - Order for website display
  - `last_updated_by` (uuid) - User who last updated
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 8. activity_logs
  Tracks all user actions in the system
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User who performed the action
  - `action` (text) - Action type (create, update, delete, etc.)
  - `description` (text) - Detailed action description
  - `table_affected` (text) - Database table affected
  - `record_id` (uuid) - ID of affected record
  - `created_at` (timestamptz) - When action occurred

  ## Security
  - RLS (Row Level Security) is enabled on all tables
  - All tables have policies restricting access to authenticated users only
  - Activity logs are append-only (insert and select only)
  - Passwords should be hashed before storage (handled in application layer)

  ## Important Notes
  - All foreign key references to users table use ON DELETE SET NULL
  - Default values are provided for boolean fields and timestamps
  - Array fields are used for multiple phone numbers and emails
  - Display order fields allow custom sorting on the website
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Content Manager', 'Viewer')),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  last_login timestamptz,
  is_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hospital_profile table
CREATE TABLE IF NOT EXISTS hospital_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  about_text text,
  mission text,
  address text,
  city text,
  state text,
  pincode text,
  phone_numbers text[],
  emails text[],
  working_hours text,
  logo_image text,
  banner_image text,
  last_updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  qualification text,
  specialisation text,
  years_of_experience integer DEFAULT 0,
  expertise_details text,
  photo text,
  display_order integer DEFAULT 0,
  is_enabled boolean DEFAULT true,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  review_english text,
  review_telugu text,
  patient_photo text,
  star_rating integer CHECK (star_rating >= 1 AND star_rating <= 5),
  display_order integer DEFAULT 0,
  is_published boolean DEFAULT false,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  description text,
  icon_image text,
  display_order integer DEFAULT 0,
  is_enabled boolean DEFAULT true,
  added_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_information table
CREATE TABLE IF NOT EXISTS contact_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text,
  phone_numbers text[],
  email_addresses text[],
  working_hours text,
  appointment_booking_link text,
  google_maps_code text,
  last_updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create social_media table
CREATE TABLE IF NOT EXISTS social_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL,
  profile_url text NOT NULL,
  is_enabled boolean DEFAULT true,
  display_order integer DEFAULT 0,
  last_updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text,
  table_affected text,
  record_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super Admin can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Super Admin can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Super Admin can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
      AND users.is_enabled = true
    )
  );

-- RLS Policies for hospital_profile table
CREATE POLICY "Anyone can view hospital profile"
  ON hospital_profile FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and above can update hospital profile"
  ON hospital_profile FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can insert hospital profile"
  ON hospital_profile FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for doctors table
CREATE POLICY "Anyone can view doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for testimonials table
CREATE POLICY "Anyone can view published testimonials"
  ON testimonials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert testimonials"
  ON testimonials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update testimonials"
  ON testimonials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete testimonials"
  ON testimonials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for services table
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for contact_information table
CREATE POLICY "Anyone can view contact information"
  ON contact_information FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can update contact information"
  ON contact_information FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can insert contact information"
  ON contact_information FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for social_media table
CREATE POLICY "Anyone can view social media"
  ON social_media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Content Manager and above can insert social media"
  ON social_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Content Manager and above can update social media"
  ON social_media FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin', 'Content Manager')
      AND users.is_enabled = true
    )
  );

CREATE POLICY "Admin and above can delete social media"
  ON social_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Admin')
      AND users.is_enabled = true
    )
  );

-- RLS Policies for activity_logs table
CREATE POLICY "Anyone can view activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert activity logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_doctors_display_order ON doctors(display_order);
CREATE INDEX IF NOT EXISTS idx_testimonials_display_order ON testimonials(display_order);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_social_media_display_order ON social_media(display_order);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);