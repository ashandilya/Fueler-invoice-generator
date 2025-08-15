/*
  # Create vendors table with RLS policies

  1. New Tables
    - `vendors`
      - `vendor_id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `vendor_name` (text, not null)
      - `business_name` (text, not null)
      - `email` (text, not null)
      - `phone` (text)
      - `gstin` (text)
      - `billing_address` (text, not null)
      - `city` (text)
      - `state` (text)
      - `country` (text, default 'India')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `vendors` table
    - Add policies for authenticated users to manage their own vendors
  3. Constraints
    - Email validation
    - Non-empty required fields
*/

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Users can read own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON public.vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select_policy" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert_policy" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update_policy" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete_policy" ON public.vendors;

-- Create vendors table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendors (
  vendor_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  vendor_name text NOT NULL CHECK (length(TRIM(vendor_name)) > 0),
  business_name text NOT NULL CHECK (length(TRIM(business_name)) > 0),
  email text NOT NULL CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  gstin text,
  billing_address text NOT NULL CHECK (length(TRIM(billing_address)) > 0),
  city text,
  state text,
  country text DEFAULT 'India',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_email ON public.vendors(email);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own vendors"
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON public.vendors
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON public.vendors
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);