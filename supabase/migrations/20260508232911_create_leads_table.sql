/*
  # Create leads table for Candela agency
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  company text DEFAULT '',
  business_type text DEFAULT '',
  service_needed text NOT NULL DEFAULT '',
  preferred_date text DEFAULT '',
  message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Anyone can submit a lead'
  ) THEN
    CREATE POLICY "Anyone can submit a lead"
      ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Authenticated users can view leads'
  ) THEN
    CREATE POLICY "Authenticated users can view leads"
      ON leads FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'instagram') THEN
    ALTER TABLE leads ADD COLUMN instagram text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'tiktok') THEN
    ALTER TABLE leads ADD COLUMN tiktok text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'facebook') THEN
    ALTER TABLE leads ADD COLUMN facebook text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'booking_slot') THEN
    ALTER TABLE leads ADD COLUMN booking_slot text DEFAULT '';
  END IF;
END $$;
