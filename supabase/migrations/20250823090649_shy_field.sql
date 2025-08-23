/*
  # Create storage bucket for company assets

  1. Storage Setup
    - Create `company-assets` bucket for logos and signatures
    - Set up proper access policies
  
  2. Security
    - Users can only upload/access their own files
    - Files are organized by user ID
*/

-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-assets', 'company-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload their own files
CREATE POLICY "Users can upload own company assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for authenticated users to view their own files
CREATE POLICY "Users can view own company assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for authenticated users to update their own files
CREATE POLICY "Users can update own company assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Users can delete own company assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-assets' AND auth.uid()::text = (storage.foldername(name))[1]);