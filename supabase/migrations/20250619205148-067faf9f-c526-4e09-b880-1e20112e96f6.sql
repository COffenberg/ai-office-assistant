
-- First, let's create the storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Create storage policies for the documents bucket
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create document_chunks table for storing processed document content
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_vector TEXT, -- For future vector search implementation
  page_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

-- Enable RLS on document_chunks
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "All authenticated users can view document chunks" ON public.document_chunks;
DROP POLICY IF EXISTS "Admins can manage document chunks" ON public.document_chunks;

-- RLS policies for document_chunks
CREATE POLICY "All authenticated users can view document chunks"
ON public.document_chunks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage document chunks"
ON public.document_chunks FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create search_analytics table for tracking search patterns
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  clicked_result_id UUID,
  clicked_result_type TEXT, -- 'qa_pair' or 'document'
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on search_analytics
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Users can insert their own search analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can view all search analytics" ON public.search_analytics;

-- RLS policies for search_analytics
CREATE POLICY "Users can view their own search analytics"
ON public.search_analytics FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own search analytics"
ON public.search_analytics FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all search analytics"
ON public.search_analytics FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Update documents table to include processing status and content summary
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS content_summary TEXT,
ADD COLUMN IF NOT EXISTS total_chunks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Create function to update document processing status
CREATE OR REPLACE FUNCTION public.update_document_processing_status(
  doc_id UUID,
  status TEXT,
  summary TEXT DEFAULT NULL,
  chunk_count INTEGER DEFAULT NULL,
  doc_keywords TEXT[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.documents 
  SET 
    processing_status = status,
    content_summary = COALESCE(summary, content_summary),
    total_chunks = COALESCE(chunk_count, total_chunks),
    keywords = COALESCE(doc_keywords, keywords),
    updated_at = NOW()
  WHERE id = doc_id;
END;
$$;

-- Create function for enhanced search across Q&A pairs and documents
CREATE OR REPLACE FUNCTION public.enhanced_search(
  search_query TEXT,
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  content TEXT,
  source TEXT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Search Q&A pairs
  SELECT 
    'qa_pair'::TEXT as result_type,
    qa.id as result_id,
    qa.question as title,
    qa.answer as content,
    CONCAT('Q&A - ', qa.category) as source,
    (
      CASE 
        WHEN qa.question ILIKE '%' || search_query || '%' THEN 1.0
        WHEN qa.answer ILIKE '%' || search_query || '%' THEN 0.8
        WHEN qa.category ILIKE '%' || search_query || '%' THEN 0.6
        ELSE 0.3
      END
    ) as relevance_score
  FROM public.qa_pairs qa
  WHERE qa.is_active = true
    AND (
      qa.question ILIKE '%' || search_query || '%' OR
      qa.answer ILIKE '%' || search_query || '%' OR
      qa.category ILIKE '%' || search_query || '%' OR
      search_query = ANY(qa.tags)
    )
  
  UNION ALL
  
  -- Search document chunks
  SELECT 
    'document'::TEXT as result_type,
    d.id as result_id,
    d.name as title,
    dc.content as content,
    CONCAT('Document - ', d.name) as source,
    (
      CASE 
        WHEN d.name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN dc.content ILIKE '%' || search_query || '%' THEN 0.9
        WHEN d.content_summary ILIKE '%' || search_query || '%' THEN 0.7
        WHEN search_query = ANY(d.keywords) THEN 0.8
        ELSE 0.4
      END
    ) as relevance_score
  FROM public.documents d
  JOIN public.document_chunks dc ON d.id = dc.document_id
  WHERE d.processing_status = 'processed'
    AND (
      d.name ILIKE '%' || search_query || '%' OR
      dc.content ILIKE '%' || search_query || '%' OR
      d.content_summary ILIKE '%' || search_query || '%' OR
      search_query = ANY(d.keywords)
    )
  
  ORDER BY relevance_score DESC
  LIMIT limit_results;
END;
$$;
