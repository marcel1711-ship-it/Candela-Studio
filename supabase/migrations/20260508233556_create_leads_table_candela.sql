/*
  # Create leads table for Candela agency (proyecto correcto)
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
  instagram text DEFAULT '',
  tiktok text DEFAULT '',
  facebook text DEFAULT '',
  booking_slot text DEFAULT '',
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
