/*
  # Create invoices table with RLS policies

  1. New Tables
    - `invoices`
      - `invoice_id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `vendor_id` (uuid, foreign key to vendors, nullable)
      - `invoice_number` (text, not null)
      - `date` (date, default current date)
      - `due_date` (date, not null)
      - `total_amount` (numeric, default 0)
      - `currency` (text, default 'INR')
      - `line_items` (jsonb, default empty array)
      - `notes` (text)
      - `payment_terms` (text)
      - `status` (text, default 'draft')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `invoices` table
    - Add policy for authenticated users to manage their own invoices
  3. Indexes
    - Index on user_id, vendor_id, and date for performance
*/

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Users can manage own invoices" ON public.invoices;

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.vendors(vendor_id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  line_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  payment_terms text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON public.invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage own invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);