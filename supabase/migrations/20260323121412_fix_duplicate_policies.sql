/*
  # Fix Duplicate Permissive Policies

  ## Changes
  1. Remove duplicate SELECT policies on app_settings
  2. Remove duplicate SELECT policies on message_rate_limit  
  3. Remove duplicate SELECT policies on profiles

  ## Notes
  - Keeps the most permissive/appropriate policy for each table
  - Unused indexes are expected - they were just created and will be used as data grows
*/

-- ============================================================================
-- Fix app_settings duplicate SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
-- Keep: "Anyone can view app settings"

-- ============================================================================
-- Fix message_rate_limit duplicate SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their own rate limit" ON public.message_rate_limit;
-- Keep: "Users can view their own rate limit"

-- Recreate the ALL policy correctly (it should cover INSERT/UPDATE/DELETE, not SELECT)
CREATE POLICY "Users can modify their own rate limit"
  ON public.message_rate_limit
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- Fix profiles duplicate SELECT policies
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
-- Keep: "Users can view own profile" and "Admins can view all profiles"
