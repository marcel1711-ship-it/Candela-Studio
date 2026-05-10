/*
  # Add social media and booking slot fields to leads

  1. Changes to `leads` table
    - `instagram` (text) — Instagram username
    - `tiktok` (text) — TikTok username
    - `facebook` (text) — Facebook page/profile name
    - `booking_slot` (text) — Selected date+time slot (e.g. "Lunes 10:00")
    - Drop old `preferred_date` column is NOT done to preserve existing data
      Instead we keep it and add the new slot column alongside
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'instagram'
  ) THEN
    ALTER TABLE leads ADD COLUMN instagram text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'tiktok'
  ) THEN
    ALTER TABLE leads ADD COLUMN tiktok text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'facebook'
  ) THEN
    ALTER TABLE leads ADD COLUMN facebook text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'booking_slot'
  ) THEN
    ALTER TABLE leads ADD COLUMN booking_slot text DEFAULT '';
  END IF;
END $$;
