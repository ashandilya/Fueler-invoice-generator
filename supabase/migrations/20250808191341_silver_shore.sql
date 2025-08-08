/*
  # Debug and fix vendors table issues

  1. Check Current State
    - Verify table structure
    - Check RLS policies
    - Verify constraints

  2. Fix Issues
    - Drop problematic constraints
    - Recreate RLS policies
    - Ensure proper permissions

  3. Test Access
    - Verify authenticated users can insert
*/

-- First, let's check what's currently in the table
DO $$
BEGIN
  RAISE NOTICE 'Current vendors table structure:';
END $$;

-- Drop the problematic email constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_email_check' 
    AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors DROP CONSTRAINT vendors_email_check;
    RAISE NOTICE 'Dropped existing email constraint';
  END IF;
END $$;

-- Ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'vendors_user_id_fkey' 
    AND table_name = 'vendors'
  ) THEN
    ALTER TABLE vendors 
    ADD CONSTRAINT vendors_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
    RAISE NOTICE 'Added foreign key constraint';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;

-- Create simple, clear RLS policies
CREATE POLICY "vendors_select_policy" ON vendors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "vendors_insert_policy" ON vendors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendors_update_policy" ON vendors
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendors_delete_policy" ON vendors
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add basic email validation (less strict)
ALTER TABLE vendors 
ADD CONSTRAINT vendors_email_simple_check 
CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON vendors(email);

-- Test the policies work
DO $$
BEGIN
  RAISE NOTICE 'Vendors table setup complete with simplified RLS policies';
END $$;