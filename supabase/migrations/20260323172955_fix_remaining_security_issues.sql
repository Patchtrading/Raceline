/*
  # Fix Remaining Security Issues

  ## Changes
  1. Fix duplicate SELECT policies on message_rate_limit
  2. Fix duplicate SELECT policies on profiles (keep both as they serve different purposes)
  3. Remove unused indexes that don't improve query performance

  ## Notes
  - The profiles table intentionally has two SELECT policies:
    - One for users to view their own profile
    - One for admins to view all profiles
    These are NOT duplicates - they have different purposes and conditions
*/

-- ============================================================================
-- Fix message_rate_limit policies
-- ============================================================================

-- Drop the ALL policy that's causing conflict
DROP POLICY IF EXISTS "Users can modify their own rate limit" ON public.message_rate_limit;

-- Keep only the SELECT policy
-- "Users can view their own rate limit" already exists

-- Add separate policies for INSERT, UPDATE, DELETE
CREATE POLICY "Users can insert their own rate limit"
  ON public.message_rate_limit
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own rate limit"
  ON public.message_rate_limit
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own rate limit"
  ON public.message_rate_limit
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================================================
-- Remove unused indexes that don't provide value
-- ============================================================================

-- These indexes are flagged as unused and may not be necessary
-- based on actual query patterns

DROP INDEX IF EXISTS public.idx_app_settings_updated_by;
DROP INDEX IF EXISTS public.idx_memberships_admin_code_used;
DROP INDEX IF EXISTS public.idx_memberships_approved_by;
DROP INDEX IF EXISTS public.idx_admin_codes_created_by;

-- Keep indexes that are likely to be used for common queries:
-- - idx_chat_messages_room_id (queries by room)
-- - idx_chat_messages_user_id (queries by user)
-- - idx_chat_room_members_user_id (finding user's rooms)
-- - idx_chat_rooms_created_by (finding user's created rooms)
-- - idx_notifications_user_id (finding user's notifications)
-- - idx_uploaded_files_room_id (finding room files)
-- - idx_uploaded_files_uploaded_by (finding user's uploads)
