/*
  # Create invoices table

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `invoice_number` (text, required)
      - `date` (date, required)
      - `due_date` (date, required)
      - `company` (jsonb, company information)
      - `client` (jsonb, client information)
      - `items` (jsonb, line items array)
      - `subtotal` (numeric, calculated total before tax/discount)
      - `tax` (numeric, tax amount)
      - `tax_rate` (numeric, tax percentage)
      - `discount` (numeric, discount amount)
      - `discount_type` (text, 'percentage' or 'fixed')
      - `total` (numeric, final total)
      - `currency` (text, 'USD' or 'INR')
      - `exchange_rate` (numeric, exchange rate used)
      - `notes` (text, optional notes)
      - `payment_terms` (text, payment terms)
      - `status` (text, invoice status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `invoices` table
    - Add policies for authenticated users to manage their own invoices
*/

CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  company jsonb NOT NULL DEFAULT '{}',
  client jsonb NOT NULL DEFAULT '{}',
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) DEFAULT 0,
  tax numeric(10,2) DEFAULT 0,
  tax_rate numeric(5,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  total numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'INR' CHECK (currency IN ('USD', 'INR')),
  exchange_rate numeric(10,4) DEFAULT 1,
  notes text DEFAULT '',
  payment_terms text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);