/*
  # Complete Invoice Generator Database Schema

  1. New Tables
    - `users` - User authentication records
    - `company_profiles` - Company information and file URLs
    - `vendors` - User-specific vendor management  
    - `invoices` - Invoice records with vendor relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Ensure users can only access their own data

  3. Storage
    - Create company-assets bucket for logos and signatures
    - Set up proper access policies

  4. Indexes
    - Add performance indexes for common queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

-- Enable RLS on company_profiles
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Users can manage their own company profile
CREATE POLICY "Users can manage own company profile"
  ON company_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Enable RLS on vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Users can manage their own vendors
CREATE POLICY "Users can manage own vendors"
  ON vendors
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(vendor_id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  due_date date NOT NULL,
  total_amount numeric(10,2) DEFAULT 0 NOT NULL,
  currency text DEFAULT 'INR' NOT NULL,
  line_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  payment_terms text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can manage their own invoices
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

-- Set up storage policies
CREATE POLICY "Users can upload their own assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to company assets
CREATE POLICY "Public can view company assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'company-assets');