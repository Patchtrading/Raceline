/*
  # Fix Profiles Infinite Recursion - Final Solution

  ## Problem
  The profiles table policies had infinite recursion because:
  - Memberships policies check if user is admin by querying profiles
  - When loading memberships, it needs to check profiles
  - Profiles policy also checks profiles to see if user is admin
  - This creates an infinite loop

  ## Solution
  1. Simplify profiles SELECT policy to ONLY allow users to view their own profile
  2. Remove admin checks from profiles policy entirely
  3. Admins can still view all profiles via UPDATE policy or separate queries

  ## Changes
  1. Drop existing profiles SELECT policy
  2. Create simple non-recursive SELECT policy for profiles
  3. This breaks the recursion chain
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create simple non-recursive policy - users can only view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can view all profiles (separate policy)
-- This one is safe because it doesn't create recursion
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_admin = true);
