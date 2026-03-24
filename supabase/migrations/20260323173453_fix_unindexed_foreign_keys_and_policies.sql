/*
  # Fix Unindexed Foreign Keys and Duplicate Policies

  ## Changes
  1. Add indexes for foreign key columns to improve query performance
  2. Fix duplicate SELECT policies on profiles by combining into one policy
  3. Remove unused indexes that are not needed based on actual usage patterns

  ## Foreign Key Indexes
  - admin_codes.created_by
  - app_settings.updated_by
  - memberships.admin_code_used
  - memberships.approved_by

  ## Policy Changes
  - Combine admin and user profile view policies into a single policy

  ## Notes
  - Foreign key indexes improve JOIN performance and constraint checking
  - Single policy uses OR logic: users can view own profile OR admins can view all
*/

-- ============================================================================
-- Add indexes for foreign key columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_codes_created_by 
  ON public.admin_codes(created_by);

CREATE INDEX IF NOT EXISTS idx_app_settings_updated_by 
  ON public.app_settings(updated_by);

CREATE INDEX IF NOT EXISTS idx_memberships_admin_code_used 
  ON public.memberships(admin_code_used);

CREATE INDEX IF NOT EXISTS idx_memberships_approved_by 
  ON public.memberships(approved_by);

-- ============================================================================
-- Fix duplicate SELECT policies on profiles
-- ============================================================================

-- Drop both existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create single combined policy
CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    (select auth.uid()) = id
    OR
    -- Admins can view all profiles
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );

-- ============================================================================
-- Remove genuinely unused indexes
-- ============================================================================

-- These indexes show zero usage and are for features not yet implemented
DROP INDEX IF EXISTS idx_chat_messages_room_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_room_members_user_id;
DROP INDEX IF EXISTS idx_chat_rooms_created_by;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_uploaded_files_room_id;
DROP INDEX IF EXISTS idx_uploaded_files_uploaded_by;
