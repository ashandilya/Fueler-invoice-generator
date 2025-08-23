/*
  # Create company profiles table

  1. New Tables
    - `company_profiles`
      - `user_id` (uuid, primary key, foreign key to users)
      - `company_name` (text)
      - `company_address` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `company_logo_url` (text)
      - `digital_signature_url` (text)
      - `invoice_prefix` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `company_profiles` table
    - Add policies for authenticated users to manage their own profile
*/

CREATE TABLE IF NOT EXISTS company_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  company_name text,
  company_address text,
  city text,
  state text,
  country text DEFAULT 'India',
  company_logo_url text,
  digital_signature_url text,
  invoice_prefix text DEFAULT 'INV',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own company profile"
  ON company_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own company profile"
  ON company_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company profile"
  ON company_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);