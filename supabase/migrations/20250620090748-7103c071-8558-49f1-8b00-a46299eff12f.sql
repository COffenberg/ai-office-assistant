
-- Fix storage permissions for documents bucket
-- First, ensure the documents bucket exists and is properly configured
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Service role can read all documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role can insert documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create policy for service role to read documents
CREATE POLICY "Service role can read all documents"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'documents');

-- Create policy for service role to insert documents (if needed)
CREATE POLICY "Service role can insert documents"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'documents');

-- Ensure authenticated users can upload documents
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure authenticated users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
