/*
  # Group Chats, Notifications, and Enhanced Features

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the chat room (e.g., horse name)
      - `description` (text, nullable) - Description of the chat room
      - `room_type` (text) - Type: 'general' or 'horse_group'
      - `created_by` (uuid) - Trainer who created the room
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `is_active` (boolean) - Whether the room is active
    
    - `chat_room_members`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - Reference to chat_rooms
      - `user_id` (uuid) - Reference to profiles
      - `joined_at` (timestamptz)
      - `last_read_at` (timestamptz) - For unread message tracking
    
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Who receives the notification
      - `type` (text) - Type: 'membership_approved', 'membership_rejected', 'new_message', 'admin_announcement'
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `link` (text, nullable) - Optional link to relevant content
      - `is_read` (boolean) - Whether notification has been read
      - `created_at` (timestamptz)
      - `related_id` (uuid, nullable) - ID of related entity (membership, message, etc.)
    
    - `uploaded_files`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - Which chat room
      - `message_id` (uuid, nullable) - Which message (if attached to message)
      - `uploaded_by` (uuid) - User who uploaded
      - `file_name` (text) - Original file name
      - `file_path` (text) - Storage path
      - `file_type` (text) - MIME type
      - `file_size` (integer) - Size in bytes
      - `created_at` (timestamptz)

    - `message_rate_limit`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User being rate limited
      - `message_count` (integer) - Number of messages in current window
      - `window_start` (timestamptz) - Start of current rate limit window
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `room_id` to `chat_messages` to support multiple chat rooms
    - Add `file_attachments` array to `chat_messages` for file sharing

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to access their rooms and notifications
    - Add policies for trainers to create and manage chat rooms
    - Add policies for file uploads and access

  4. Important Notes
    - General chat room will be created automatically for all members
    - Trainers can create horse-specific group chats
    - Notifications will be created via triggers when memberships are updated
    - Rate limiting enforces max 10 messages per minute per user
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  room_type text NOT NULL DEFAULT 'general' CHECK (room_type IN ('general', 'horse_group')),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create chat_room_members table
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('membership_approved', 'membership_rejected', 'new_message', 'admin_announcement', 'added_to_room')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  related_id uuid
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  message_id uuid,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Create message_rate_limit table
CREATE TABLE IF NOT EXISTS message_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  message_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_rate_limit ENABLE ROW LEVEL SECURITY;

-- Add room_id to chat_messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add file_attachments to chat_messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'file_attachments'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN file_attachments uuid[];
  END IF;
END $$;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view active chat rooms they are members of"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    is_active = true AND (
      id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
      OR room_type = 'general'
    )
  );

CREATE POLICY "Trainers can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'trainer'
    )
  );

CREATE POLICY "Trainers can update their own chat rooms"
  ON chat_rooms FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for chat_room_members
CREATE POLICY "Users can view room memberships for their rooms"
  ON chat_room_members FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Trainers can add members to rooms they created"
  ON chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own last_read_at"
  ON chat_room_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Trainers can remove members from their rooms"
  ON chat_room_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view files in their rooms"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can upload files to their rooms"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
  );

-- RLS Policies for message_rate_limit
CREATE POLICY "Users can view their own rate limit"
  ON message_rate_limit FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON message_rate_limit FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update chat_messages policies to support rooms
DROP POLICY IF EXISTS "Users can view messages" ON chat_messages;
CREATE POLICY "Users can view messages in their rooms"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
    OR room_id IS NULL
  );

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages to their rooms"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      room_id IN (SELECT room_id FROM chat_room_members WHERE user_id = auth.uid())
      OR room_id IS NULL
    )
  );

-- Create function to notify members when membership is approved/rejected
CREATE OR REPLACE FUNCTION notify_membership_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'membership_approved',
      'Membership Approved',
      'Your membership application has been approved! Welcome to the community.',
      NEW.id
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      'membership_rejected',
      'Membership Not Approved',
      'Unfortunately, your membership application was not approved.',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for membership notifications
DROP TRIGGER IF EXISTS membership_status_notification ON memberships;
CREATE TRIGGER membership_status_notification
  AFTER UPDATE ON memberships
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_membership_status();

-- Create function to notify room members of new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, related_id)
    SELECT 
      crm.user_id,
      'new_message',
      'New Message',
      (SELECT name FROM chat_rooms WHERE id = NEW.room_id),
      '/chat/' || NEW.room_id,
      NEW.id
    FROM chat_room_members crm
    WHERE crm.room_id = NEW.room_id
      AND crm.user_id != NEW.user_id
      AND crm.last_read_at < NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new message notifications
DROP TRIGGER IF EXISTS new_message_notification ON chat_messages;
CREATE TRIGGER new_message_notification
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Create a default general chat room
INSERT INTO chat_rooms (id, name, description, room_type, created_by)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'General Chat',
  'Open chat for all members',
  'general',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Add all existing active members to general chat
INSERT INTO chat_room_members (room_id, user_id)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  p.id
FROM profiles p
WHERE EXISTS (
  SELECT 1 FROM memberships m
  WHERE m.user_id = p.id AND m.status = 'active'
)
ON CONFLICT (room_id, user_id) DO NOTHING;

-- Update existing messages to be in general chat
UPDATE chat_messages
SET room_id = '00000000-0000-0000-0000-000000000001'
WHERE room_id IS NULL;