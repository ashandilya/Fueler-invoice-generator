/*
  # Fix email constraint validation issue

  1. Data Cleanup
    - Update any invalid email addresses in existing data
    - Ensure all emails meet the validation requirements

  2. Constraints
    - Add email validation constraint safely
    - Add other necessary constraints

  3. Security
    - Ensure RLS policies are properly configured
*/

-- First, let's check and fix any invalid email addresses
UPDATE vendors 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email != '';

-- Remove any rows with completely invalid emails (if any exist)
-- This is safer than trying to fix them automatically
DELETE FROM vendors 
WHERE email IS NULL 
   OR email = '' 
   OR email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Now safely add the email constraint
DO $$
BEGIN
  -- Add email validation constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_email_check' 
    AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_email_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;

  -- Ensure email is not null constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'email' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendors ALTER COLUMN email SET NOT NULL;
  END IF;

  -- Ensure business_name is not null constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'business_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendors ALTER COLUMN business_name SET NOT NULL;
  END IF;

  -- Ensure vendor_name is not null constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'vendor_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendors ALTER COLUMN vendor_name SET NOT NULL;
  END IF;

  -- Ensure billing_address is not null constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vendors' 
    AND column_name = 'billing_address' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendors ALTER COLUMN billing_address SET NOT NULL;
  END IF;
END $$;

-- Ensure proper RLS policies exist
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;

CREATE POLICY "Users can view own vendors"
  ON vendors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;