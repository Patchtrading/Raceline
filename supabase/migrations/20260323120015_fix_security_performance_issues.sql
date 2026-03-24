/*
  # Fix Security and Performance Issues

  ## Changes Overview
  This migration addresses critical security and performance issues identified by Supabase security audit.

  ## 1. Add Missing Indexes for Foreign Keys
  - admin_codes.created_by
  - app_settings.updated_by
  - chat_messages.room_id, user_id
  - chat_room_members.user_id
  - chat_rooms.created_by
  - memberships.admin_code_used, approved_by
  - notifications.user_id
  - uploaded_files.room_id, uploaded_by

  ## 2. Optimize RLS Policies (Auth Function Initialization)
  Replace `auth.uid()` with `(select auth.uid())` in all policies to prevent re-evaluation per row
  - Affects: profiles, memberships, admin_codes, chat_messages, app_settings, chat_rooms, chat_room_members, notifications, uploaded_files, message_rate_limit

  ## 3. Remove Unused Indexes
  - idx_memberships_status
  - idx_chat_messages_created_at
  - idx_admin_codes_code

  ## 4. Fix Duplicate Permissive Policies
  - Consolidate chat_messages SELECT/INSERT policies
  - Consolidate memberships SELECT policies
  - Remove redundant message_rate_limit policy

  ## 5. Fix Function Search Paths
  - Set search_path for all functions to prevent security vulnerabilities

  ## 6. Remove Insecure RLS Policy
  - Fix message_rate_limit "System can manage rate limits" policy
*/

-- ============================================================================
-- STEP 1: Add Missing Foreign Key Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_codes_created_by ON public.admin_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by ON public.app_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user_id ON public.chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_memberships_admin_code_used ON public.memberships(admin_code_used);
CREATE INDEX IF NOT EXISTS idx_memberships_approved_by ON public.memberships(approved_by);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_room_id ON public.uploaded_files(room_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by ON public.uploaded_files(uploaded_by);

-- ============================================================================
-- STEP 2: Remove Unused Indexes
-- ============================================================================

DROP INDEX IF EXISTS public.idx_memberships_status;
DROP INDEX IF EXISTS public.idx_chat_messages_created_at;
DROP INDEX IF EXISTS public.idx_admin_codes_code;

-- ============================================================================
-- STEP 3: Fix RLS Policies - Drop All Existing Policies
-- ============================================================================

-- profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- memberships
DROP POLICY IF EXISTS "Users can create own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;

-- admin_codes
DROP POLICY IF EXISTS "Only admins can view admin codes" ON public.admin_codes;
DROP POLICY IF EXISTS "Only admins can create admin codes" ON public.admin_codes;
DROP POLICY IF EXISTS "Only admins can update admin codes" ON public.admin_codes;

-- chat_messages (remove duplicates)
DROP POLICY IF EXISTS "Active members can read messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Active members can create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;

-- app_settings
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;
DROP POLICY IF EXISTS "Only admins can update app settings" ON public.app_settings;

-- chat_rooms
DROP POLICY IF EXISTS "Trainers can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Trainers can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view active chat rooms they are members of" ON public.chat_rooms;

-- chat_room_members
DROP POLICY IF EXISTS "Trainers can add members to rooms they created" ON public.chat_room_members;
DROP POLICY IF EXISTS "Trainers can remove members from their rooms" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can view room memberships for their rooms" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can update their own last_read_at" ON public.chat_room_members;

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

-- uploaded_files
DROP POLICY IF EXISTS "Users can view files in their rooms" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can upload files to their rooms" ON public.uploaded_files;

-- message_rate_limit (remove insecure policy)
DROP POLICY IF EXISTS "Users can view their own rate limit" ON public.message_rate_limit;
DROP POLICY IF EXISTS "System can manage rate limits" ON public.message_rate_limit;

-- ============================================================================
-- STEP 4: Create Optimized RLS Policies
-- ============================================================================

-- profiles
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- memberships (consolidated)
CREATE POLICY "Users can create own membership"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can view memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can update memberships"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- admin_codes
CREATE POLICY "Only admins can view admin codes"
  ON public.admin_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can create admin codes"
  ON public.admin_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update admin codes"
  ON public.admin_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- chat_messages (consolidated - single policy per action)
CREATE POLICY "Members can view messages in their rooms"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      JOIN public.memberships m ON m.user_id = crm.user_id
      WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = (select auth.uid())
        AND m.status = 'active'
    )
  );

CREATE POLICY "Members can send messages to their rooms"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      JOIN public.memberships m ON m.user_id = crm.user_id
      WHERE crm.room_id = chat_messages.room_id
        AND crm.user_id = (select auth.uid())
        AND m.status = 'active'
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- app_settings
CREATE POLICY "Anyone can view app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- chat_rooms
CREATE POLICY "Trainers can create chat rooms"
  ON public.chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Trainers can update their own chat rooms"
  ON public.chat_rooms FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can view active chat rooms they are members of"
  ON public.chat_rooms FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.chat_room_members
      WHERE room_id = chat_rooms.id
        AND user_id = (select auth.uid())
    )
  );

-- chat_room_members
CREATE POLICY "Trainers can add members to rooms they created"
  ON public.chat_room_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_room_members.room_id
        AND created_by = (select auth.uid())
    )
  );

CREATE POLICY "Trainers can remove members from their rooms"
  ON public.chat_room_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE id = chat_room_members.room_id
        AND created_by = (select auth.uid())
    )
  );

CREATE POLICY "Users can view room memberships for their rooms"
  ON public.chat_room_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      WHERE crm.room_id = chat_room_members.room_id
        AND crm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own last_read_at"
  ON public.chat_room_members FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- uploaded_files
CREATE POLICY "Users can view files in their rooms"
  ON public.uploaded_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_room_members
      WHERE room_id = uploaded_files.room_id
        AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can upload files to their rooms"
  ON public.uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_room_members crm
      JOIN public.memberships m ON m.user_id = crm.user_id
      WHERE crm.room_id = uploaded_files.room_id
        AND crm.user_id = (select auth.uid())
        AND m.status = 'active'
    )
  );

-- message_rate_limit (fixed - no unrestricted policy)
CREATE POLICY "Users can view their own rate limit"
  ON public.message_rate_limit FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage their own rate limit"
  ON public.message_rate_limit FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- STEP 5: Fix Function Search Paths
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS membership_status_notification ON public.memberships;
DROP TRIGGER IF EXISTS new_message_notification ON public.chat_messages;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.generate_next_admin_code();
DROP FUNCTION IF EXISTS public.validate_admin_code(text);
DROP FUNCTION IF EXISTS public.notify_membership_status();
DROP FUNCTION IF EXISTS public.notify_new_message();

-- Recreate functions with proper search_path

CREATE FUNCTION public.generate_next_admin_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  next_code text;
BEGIN
  SELECT LPAD((COALESCE(MAX(CAST(code AS INTEGER)), 0) + 1)::text, 6, '0')
  INTO next_code
  FROM public.admin_codes
  WHERE code ~ '^\d+$';
  
  RETURN COALESCE(next_code, '000001');
END;
$$;

CREATE FUNCTION public.validate_admin_code(code_to_validate text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_codes
    WHERE code = code_to_validate
      AND is_active = true
      AND (max_uses IS NULL OR current_uses < max_uses)
  ) INTO code_valid;
  
  RETURN code_valid;
END;
$$;

CREATE FUNCTION public.notify_membership_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
      NEW.user_id,
      'membership_status',
      'Membership Status Update',
      'Your membership status has been changed to: ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  SELECT 
    crm.user_id,
    'new_message',
    'New Message',
    'You have a new message in ' || cr.name,
    NEW.id
  FROM public.chat_room_members crm
  JOIN public.chat_rooms cr ON cr.id = crm.room_id
  WHERE crm.room_id = NEW.room_id
    AND crm.user_id != NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER membership_status_notification
  AFTER UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_membership_status();

CREATE TRIGGER new_message_notification
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
