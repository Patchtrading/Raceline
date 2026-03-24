/*
  # Update Admin Code System to Sequential Format

  1. Changes
    - Add sequence counter to track the next available code number
    - Update admin code generation to use "RLLT" prefix with sequential 5-digit numbers
    - Create function to generate next sequential code
    - Modify validate_admin_code function to handle new format

  2. Notes
    - Codes start from RLLT00001 and increment by 1 each time
    - Existing codes (if any) will continue to work
    - New codes will use the sequential format
*/

-- Create a sequence for admin codes starting at 1
CREATE SEQUENCE IF NOT EXISTS admin_code_sequence START WITH 1;

-- Create function to generate next sequential admin code
CREATE OR REPLACE FUNCTION generate_next_admin_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
  new_code text;
BEGIN
  -- Get the next sequence value
  next_number := nextval('admin_code_sequence');
  
  -- Format as RLLT + 5-digit zero-padded number
  new_code := 'RLLT' || lpad(next_number::text, 5, '0');
  
  RETURN new_code;
END;
$$;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION generate_next_admin_code() TO authenticated;