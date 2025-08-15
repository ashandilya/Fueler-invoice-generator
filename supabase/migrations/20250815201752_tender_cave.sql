/*
  # Create company profiles table with RLS policies

  1. New Tables
    - `company_profiles`
      - `user_id` (uuid, primary key, foreign key to users)
      - `company_name` (text)
      - `company_address` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text, default 'India')
      - `company_logo_url` (text)
      - `digital_signature_url` (text)
      - `invoice_prefix` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `company_profiles` table
    - Add policy for authenticated users to manage their own profile
*/

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Users can manage own company profile" ON public.company_profiles;

-- Create company_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.company_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
  company_name text,
  company_address text,
  city text,
  state text,
  country text DEFAULT 'India',
  company_logo_url text,
  digital_signature_url text,
  invoice_prefix text DEFAULT 'FLB',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage own company profile"
  ON public.company_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);