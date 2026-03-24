/*
  # Create App Settings Table

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - single row with fixed id
      - `app_name` (text) - application name
      - `app_tagline` (text) - tagline/subtitle
      - `primary_color` (text) - hex color for primary branding
      - `secondary_color` (text) - hex color for secondary elements
      - `logo_url` (text) - URL to logo image
      - `hero_image_url` (text) - URL to hero/banner image
      - `welcome_message` (text) - welcome message for new members
      - `annual_price` (numeric) - annual membership price
      - `lifetime_price` (numeric) - lifetime membership price
      - `footer_text` (text) - footer copyright text
      - `updated_at` (timestamptz)
      - `updated_by` (uuid, references profiles)

  2. Security
    - Enable RLS on app_settings table
    - Anyone can read settings (public)
    - Only admins can update settings

  3. Notes
    - Uses a single row pattern (id = '00000000-0000-0000-0000-000000000000')
    - Initial default values set for immediate use
*/

-- Create app settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  app_name text NOT NULL DEFAULT 'Racehorse Chat',
  app_tagline text DEFAULT 'Connect with owners, shareholders, and trainers',
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#3b82f6',
  logo_url text,
  hero_image_url text,
  welcome_message text DEFAULT 'Welcome to our exclusive racehorse community!',
  annual_price numeric(10, 2) DEFAULT 5.00,
  lifetime_price numeric(10, 2) DEFAULT 10.00,
  footer_text text DEFAULT 'Racehorse Chat',
  contact_email text,
  enable_public_registration boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update app settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert default settings row
INSERT INTO app_settings (id, app_name, app_tagline, primary_color, secondary_color, welcome_message, annual_price, lifetime_price, footer_text)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Racehorse Chat',
  'Connect with owners, shareholders, and trainers',
  '#2563eb',
  '#3b82f6',
  'Welcome to our exclusive racehorse community!',
  5.00,
  10.00,
  'Racehorse Chat'
)
ON CONFLICT (id) DO NOTHING;