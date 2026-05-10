/*
  # Add social media and booking slot fields to leads
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
