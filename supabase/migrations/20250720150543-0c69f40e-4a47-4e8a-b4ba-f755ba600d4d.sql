
-- Update the documents bucket to allow all required MIME types
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800, -- 50MB limit
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'text/plain',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'audio/x-m4a',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
WHERE id = 'documents';

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can read all documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can insert documents" ON storage.objects;

-- Create comprehensive storage policies for authenticated users
CREATE POLICY "Authenticated users can upload to documents bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Create service role policies for admin access
CREATE POLICY "Service role can manage all documents"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'documents');
