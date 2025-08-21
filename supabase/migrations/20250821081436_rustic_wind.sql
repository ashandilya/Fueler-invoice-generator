/*
  # Create invoices table with proper error handling

  1. New Tables
    - `invoices`
      - `invoice_id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `vendor_id` (uuid, foreign key to vendors, nullable)
      - `invoice_number` (text, unique per user)
      - `date` (date)
      - `due_date` (date)
      - `total_amount` (numeric)
      - `currency` (text, USD/INR)
      - `line_items` (jsonb, stores invoice items and metadata)
      - `notes` (text, nullable)
      - `payment_terms` (text, nullable)
      - `status` (text, draft/sent/paid/overdue)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `invoices` table
    - Add policy for users to manage their own invoices only

  3. Indexes
    - Add indexes for better query performance
*/

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(vendor_id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR' CHECK (currency IN ('USD', 'INR')),
  line_items jsonb DEFAULT '[]'::jsonb,
  notes text,
  payment_terms text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;

-- Create the policy
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- Create unique constraint for invoice numbers per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'invoices_user_invoice_number_unique'
  ) THEN
    ALTER TABLE invoices 
    ADD CONSTRAINT invoices_user_invoice_number_unique 
    UNIQUE (user_id, invoice_number);
  END IF;
END $$;