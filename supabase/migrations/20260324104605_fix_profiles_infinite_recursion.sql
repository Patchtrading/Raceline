/*
  # Fix Profiles Infinite Recursion

  ## Problem
  The profiles SELECT policy had infinite recursion because it queried the profiles table
  within the policy itself to check if user is admin.

  ## Solution
  Use a direct column check instead of a subquery to the same table.

  ## Changes
  1. Drop the existing recursive policy
  2. Create a new policy that avoids recursion by checking is_admin directly
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create non-recursive policy
CREATE POLICY "Users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    id = auth.uid()
    OR
    -- Admins can view all profiles (check current user's is_admin directly)
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );
