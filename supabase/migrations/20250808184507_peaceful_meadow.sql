/*
  # Fix vendors table and RLS policies

  1. Table Updates
    - Ensure all required columns have proper constraints
    - Fix any data type mismatches
    - Add missing indexes

  2. Security Updates
    - Fix RLS policies for vendors table
    - Ensure authenticated users can insert/update their own vendor records
    - Add proper SELECT policies

  3. Data Integrity
    - Ensure foreign key constraints are working
    - Add proper validation constraints
*/

-- First, let's ensure the vendors table structure is correct
DO $$
BEGIN
  -- Check if vendors table exists and has correct structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'vendors' AND table_schema = 'public'
  ) THEN
    CREATE TABLE vendors (
      vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
      vendor_name text NOT NULL,
      business_name text NOT NULL,
      email text NOT NULL,
      phone text,
      gstin text,
      billing_address text NOT NULL,
      city text,
      state text,
      country text DEFAULT 'India',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can read own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;

-- Create comprehensive RLS policies
CREATE POLICY "Users can read own vendors"
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

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- Add constraints to ensure data integrity
DO $$
BEGIN
  -- Add email validation constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_email_check' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_email_check 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;

  -- Add vendor_name length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_vendor_name_check' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_vendor_name_check 
    CHECK (length(trim(vendor_name)) > 0);
  END IF;

  -- Add business_name length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_business_name_check' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_business_name_check 
    CHECK (length(trim(business_name)) > 0);
  END IF;

  -- Add billing_address length constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_billing_address_check' AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors ADD CONSTRAINT vendors_billing_address_check 
    CHECK (length(trim(billing_address)) > 0);
  END IF;
END $$;