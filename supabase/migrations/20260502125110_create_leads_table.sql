/*
  # Create leads table for Candela agency

  1. New Tables
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text) - Full name of the lead
      - `email` (text) - Contact email
      - `phone` (text) - Phone number
      - `company` (text, nullable) - Company name
      - `business_type` (text, nullable) - Type of business
      - `service_needed` (text) - Service they need (Marketplaces/Tienda/Automatización/CRM/No estoy seguro)
      - `preferred_date` (text, nullable) - Preferred date/time for call
      - `message` (text, nullable) - Additional message
      - `created_at` (timestamptz) - When the lead was created

  2. Security
    - Enable RLS on `leads` table
    - Add policy for anonymous users to insert leads (public form submission)
    - No select policy for anonymous users (only authenticated admins can read)
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

CREATE POLICY "Anyone can submit a lead"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);
