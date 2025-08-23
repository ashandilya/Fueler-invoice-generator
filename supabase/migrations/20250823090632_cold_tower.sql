/*
  # Create clients table

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, required)
      - `email` (text, required)
      - `business_name` (text, required)
      - `phone` (text, optional)
      - `gstin` (text, optional)
      - `city` (text, optional)
      - `state` (text, optional)
      - `country` (text, default 'India')
      - `billing_address` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `clients` table
    - Add policies for authenticated users to manage their own clients
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  business_name text NOT NULL,
  phone text,
  gstin text,
  city text,
  state text,
  country text DEFAULT 'India',
  billing_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);