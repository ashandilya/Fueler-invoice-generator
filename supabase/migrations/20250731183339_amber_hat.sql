/*
  # User Authentication and Profile Management Schema

  1. New Tables
    - `users`
      - `user_id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `company_profiles`
      - `user_id` (uuid, foreign key)
      - `company_name` (text)
      - `company_address` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `company_logo_url` (text)
      - `digital_signature_url` (text)
    - `vendors`
      - `vendor_id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `vendor_name` (text)
      - `business_name` (text)
      - `email` (text)
      - `phone` (text)
      - `gstin` (text)
      - `billing_address` (text)
      - `city` (text)
      - `state` (text)
      - `country` (text)
    - `invoices`
      - `invoice_id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `vendor_id` (uuid, foreign key)
      - `invoice_number` (text)
      - `date` (date)
      - `due_date` (date)
      - `total_amount` (decimal)
      - `currency` (text)
      - `line_items` (jsonb)
      - `notes` (text)
      - `payment_terms` (text)
      - `status` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own vendors and invoices

  3. Storage
    - Create bucket for company assets (logos, signatures)
    - Set up public access for uploaded files
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create company_profiles table
CREATE TABLE IF NOT EXISTS company_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  company_name text,
  company_address text,
  city text,
  state text,
  country text DEFAULT 'India',
  company_logo_url text,
  digital_signature_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
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

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(vendor_id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  line_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  payment_terms text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policies for company_profiles table
CREATE POLICY "Users can manage own company profile"
  ON company_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for vendors table
CREATE POLICY "Users can manage own vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for invoices table
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for company assets
CREATE POLICY "Users can upload own company assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own company assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own company assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own company assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);