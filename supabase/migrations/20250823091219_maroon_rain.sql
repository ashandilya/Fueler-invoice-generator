/*
  # Create storage bucket for company assets

  1. Storage Setup
    - Create `company-assets` bucket for logos and signatures
    - Set bucket to public for easy access to uploaded files
  
  2. Security
    - Add RLS policy for authenticated users to manage their own assets
    - Users can only upload/delete files in their own folder (user_id)
*/

-- Create storage bucket for company assets (logos, signatures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for company assets (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = 'company-assets' 
    AND name = 'Users can upload own company assets'
  ) THEN
    CREATE POLICY "Users can upload own company assets"
      ON storage.objects
      FOR ALL
      TO authenticated
      USING (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'company-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;