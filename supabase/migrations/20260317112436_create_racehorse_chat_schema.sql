/*
  # Racehorse Chat App Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `role` (text) - owner/shareholder/syndicate_partner/trainer
      - `is_admin` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `memberships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `membership_type` (text) - annual or lifetime
      - `status` (text) - pending, active, expired, rejected
      - `amount_paid` (numeric) - 5.00 or 10.00
      - `payment_status` (text) - unpaid, paid, waived
      - `applied_at` (timestamptz)
      - `approved_at` (timestamptz)
      - `approved_by` (uuid, references profiles)
      - `expires_at` (timestamptz) - null for lifetime
      - `admin_code_used` (uuid, references admin_codes)
    
    - `admin_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `max_uses` (integer)
      - `times_used` (integer)
      - `is_active` (boolean)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_deleted` (boolean)
  
  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, update own profile
    - Memberships: Users can read own membership, admins can manage all
    - Admin codes: Only admins can create and view codes
    - Chat messages: Active members can read all and create messages, users can update/delete own messages
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'shareholder', 'syndicate_partner', 'trainer')),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_type text NOT NULL CHECK (membership_type IN ('annual', 'lifetime')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  amount_paid numeric(10, 2) NOT NULL CHECK (amount_paid IN (5.00, 10.00)),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'waived')),
  applied_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  admin_code_used uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
  ON memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can create own membership"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update memberships"
  ON memberships FOR UPDATE
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

-- Create admin codes table
CREATE TABLE IF NOT EXISTS admin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  max_uses integer DEFAULT 1,
  times_used integer DEFAULT 0,
  is_active boolean DEFAULT true
);

ALTER TABLE admin_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view admin codes"
  ON admin_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can create admin codes"
  ON admin_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update admin codes"
  ON admin_codes FOR UPDATE
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

-- Create chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can read messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.user_id = auth.uid()
      AND memberships.status = 'active'
      AND (memberships.expires_at IS NULL OR memberships.expires_at > now())
    )
  );

CREATE POLICY "Active members can create messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.user_id = auth.uid()
      AND memberships.status = 'active'
      AND (memberships.expires_at IS NULL OR memberships.expires_at > now())
    )
  );

CREATE POLICY "Users can update own messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add foreign key for admin_code_used after admin_codes table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'memberships_admin_code_used_fkey'
  ) THEN
    ALTER TABLE memberships
    ADD CONSTRAINT memberships_admin_code_used_fkey
    FOREIGN KEY (admin_code_used) REFERENCES admin_codes(id);
  END IF;
END $$;

-- Create function to validate admin code
CREATE OR REPLACE FUNCTION validate_admin_code(code_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_id uuid;
BEGIN
  SELECT id INTO code_id
  FROM admin_codes
  WHERE code = code_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR times_used < max_uses);
  
  IF code_id IS NOT NULL THEN
    UPDATE admin_codes
    SET times_used = times_used + 1
    WHERE id = code_id;
  END IF;
  
  RETURN code_id;
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_codes_code ON admin_codes(code);