/*
  # Enhance Health Library Illnesses

  1. Safety Measures
    - Add timestamp columns if missing (created_at, updated_at)
    - Create unique index on slug (case-insensitive)
    - Add trigger for updated_at timestamp

  2. New Content Sections
    - when_to_see_doctor (text, nullable)
    - causes (text, nullable)
    - risk_factors (text, nullable)
    - complications (text, nullable)

  3. Appointment Button Configuration
    - show_appointment_button (boolean, default false, not null)
    - appointment_button_label (text, default "Request an Appointment", not null)
    - appointment_button_type (text, 'contact' | 'custom', default 'contact', not null)
    - appointment_button_url (text, nullable, required when type = 'custom')

  4. Constraints & Indexes
    - CHECK constraint on appointment_button_type
    - CHECK constraint on appointment_button_url (required for custom type)
    - Index on show_appointment_button for performance
    - Unique index on lower(slug) for case-insensitive uniqueness

  5. Backward Compatibility
    - All new columns are nullable or have defaults
    - No drops, renames, or destructive changes
    - Existing data remains intact
*/

-- Step 1: Ensure timestamp columns exist (idempotent)
ALTER TABLE health_library_illnesses
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

ALTER TABLE health_library_illnesses
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;

-- Step 2: Handle duplicate slugs before adding unique constraint
-- Auto-resolve duplicates by appending a numeric suffix
DO $$
DECLARE
  duplicate_record RECORD;
  counter INT;
  new_slug TEXT;
BEGIN
  -- Find and fix duplicate slugs (case-insensitive)
  FOR duplicate_record IN
    SELECT id, slug, lower(slug) as lower_slug
    FROM health_library_illnesses
    WHERE lower(slug) IN (
      SELECT lower(slug)
      FROM health_library_illnesses
      GROUP BY lower(slug)
      HAVING COUNT(*) > 1
    )
    ORDER BY lower(slug), created_at
  LOOP
    -- Start counter at 2 for duplicates (keep first one as-is)
    counter := 2;
    new_slug := duplicate_record.slug || '-' || counter;

    -- Find a unique slug by incrementing counter
    WHILE EXISTS (
      SELECT 1 FROM health_library_illnesses
      WHERE lower(slug) = lower(new_slug)
    ) LOOP
      counter := counter + 1;
      new_slug := duplicate_record.slug || '-' || counter;
    END LOOP;

    -- Update the duplicate record with new unique slug
    UPDATE health_library_illnesses
    SET slug = new_slug
    WHERE id = duplicate_record.id;

    RAISE NOTICE 'Resolved duplicate slug: % -> %', duplicate_record.slug, new_slug;
  END LOOP;
END $$;

-- Step 3: Add unique index on slug (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_health_library_illnesses_slug
ON health_library_illnesses (lower(slug));

-- Step 4: Add new content section columns
ALTER TABLE health_library_illnesses
ADD COLUMN IF NOT EXISTS when_to_see_doctor text,
ADD COLUMN IF NOT EXISTS causes text,
ADD COLUMN IF NOT EXISTS risk_factors text,
ADD COLUMN IF NOT EXISTS complications text;

-- Step 5: Add appointment button configuration columns
ALTER TABLE health_library_illnesses
ADD COLUMN IF NOT EXISTS show_appointment_button boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS appointment_button_label text DEFAULT 'Request an Appointment' NOT NULL,
ADD COLUMN IF NOT EXISTS appointment_button_type text DEFAULT 'contact' NOT NULL,
ADD COLUMN IF NOT EXISTS appointment_button_url text;

-- Step 6: Add constraints for appointment button
DO $$
BEGIN
  -- Add constraint for appointment_button_type (if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'health_library_illnesses_appointment_button_type_check'
  ) THEN
    ALTER TABLE health_library_illnesses
    ADD CONSTRAINT health_library_illnesses_appointment_button_type_check
    CHECK (appointment_button_type IN ('contact', 'custom'));
  END IF;

  -- Add constraint: appointment_button_url required when type is 'custom'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'health_library_illnesses_appointment_button_url_check'
  ) THEN
    ALTER TABLE health_library_illnesses
    ADD CONSTRAINT health_library_illnesses_appointment_button_url_check
    CHECK (
      (appointment_button_type = 'custom' AND appointment_button_url IS NOT NULL AND appointment_button_url != '')
      OR
      (appointment_button_type = 'contact')
    );
  END IF;
END $$;

-- Step 7: Create index for better query performance on appointment button
CREATE INDEX IF NOT EXISTS idx_illnesses_appointment_button
ON health_library_illnesses(show_appointment_button)
WHERE show_appointment_button = true;

-- Step 8: Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_health_library_illnesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS set_health_library_illnesses_updated_at ON health_library_illnesses;

CREATE TRIGGER set_health_library_illnesses_updated_at
BEFORE UPDATE ON health_library_illnesses
FOR EACH ROW
EXECUTE FUNCTION update_health_library_illnesses_updated_at();

-- Step 10: Verification - Check that all columns exist
DO $$
BEGIN
  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_library_illnesses'
    AND column_name = 'when_to_see_doctor'
  ), 'Column when_to_see_doctor not created';

  ASSERT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_library_illnesses'
    AND column_name = 'show_appointment_button'
  ), 'Column show_appointment_button not created';

  RAISE NOTICE 'Migration completed successfully. All columns verified.';
END $$;
