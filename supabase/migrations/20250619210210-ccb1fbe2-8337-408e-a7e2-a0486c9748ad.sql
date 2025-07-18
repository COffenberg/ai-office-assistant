
-- Add OpenAI processing status and metadata to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS last_processed_at TIMESTAMP WITH TIME ZONE;

-- Create table for storing conversation context
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on conversation_context
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_context
CREATE POLICY "Users can manage their own conversation context"
ON public.conversation_context FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- Create table for knowledge gap tracking
CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  suggested_action TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'addressed', 'ignored')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on knowledge_gaps
ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;

-- RLS policies for knowledge_gaps (admin only)
CREATE POLICY "Admins can manage knowledge gaps"
ON public.knowledge_gaps FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Create function to track knowledge gaps
CREATE OR REPLACE FUNCTION public.track_knowledge_gap(
  query_text TEXT,
  results_found INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only track if no good results were found
  IF results_found < 2 THEN
    INSERT INTO public.knowledge_gaps (search_query, frequency, last_searched)
    VALUES (query_text, 1, NOW())
    ON CONFLICT (search_query) 
    DO UPDATE SET 
      frequency = knowledge_gaps.frequency + 1,
      last_searched = NOW();
  END IF;
END;
$$;

-- Add unique constraint for knowledge gaps
ALTER TABLE public.knowledge_gaps 
ADD CONSTRAINT unique_search_query UNIQUE (search_query);

-- Create function for AI-enhanced search with context
CREATE OR REPLACE FUNCTION public.ai_enhanced_search(
  search_query TEXT,
  user_context JSONB DEFAULT '{}'::jsonb,
  limit_results INTEGER DEFAULT 15
)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  title TEXT,
  content TEXT,
  source TEXT,
  relevance_score FLOAT,
  context_match FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Enhanced Q&A search with context scoring
  SELECT 
    'qa_pair'::TEXT as result_type,
    qa.id as result_id,
    qa.question as title,
    qa.answer as content,
    CONCAT('Q&A - ', qa.category) as source,
    (
      CASE 
        WHEN qa.question ILIKE '%' || search_query || '%' THEN 1.0
        WHEN qa.answer ILIKE '%' || search_query || '%' THEN 0.9
        WHEN qa.category ILIKE '%' || search_query || '%' THEN 0.7
        WHEN search_query = ANY(qa.tags) THEN 0.8
        ELSE 0.4
      END
    ) as relevance_score,
    (
      CASE 
        WHEN user_context ? qa.category THEN 0.2
        ELSE 0.0
      END
    ) as context_match
  FROM public.qa_pairs qa
  WHERE qa.is_active = true
    AND (
      qa.question ILIKE '%' || search_query || '%' OR
      qa.answer ILIKE '%' || search_query || '%' OR
      qa.category ILIKE '%' || search_query || '%' OR
      search_query = ANY(qa.tags)
    )
  
  UNION ALL
  
  -- Enhanced document search with AI summary
  SELECT 
    'document'::TEXT as result_type,
    d.id as result_id,
    d.name as title,
    COALESCE(dc.content, d.ai_summary, 'No content available') as content,
    CONCAT('Document - ', d.name, CASE WHEN d.ai_summary IS NOT NULL THEN ' (AI Enhanced)' ELSE '' END) as source,
    (
      CASE 
        WHEN d.name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN dc.content ILIKE '%' || search_query || '%' THEN 0.95
        WHEN d.ai_summary ILIKE '%' || search_query || '%' THEN 0.85
        WHEN d.content_summary ILIKE '%' || search_query || '%' THEN 0.75
        WHEN search_query = ANY(d.keywords) THEN 0.8
        ELSE 0.3
      END
    ) as relevance_score,
    (
      CASE 
        WHEN d.file_type = (user_context->>'preferred_file_type') THEN 0.1
        ELSE 0.0
      END
    ) as context_match
  FROM public.documents d
  LEFT JOIN public.document_chunks dc ON d.id = dc.document_id
  WHERE d.processing_status IN ('processed', 'uploaded')
    AND (
      d.name ILIKE '%' || search_query || '%' OR
      dc.content ILIKE '%' || search_query || '%' OR
      d.ai_summary ILIKE '%' || search_query || '%' OR
      d.content_summary ILIKE '%' || search_query || '%' OR
      search_query = ANY(d.keywords)
    )
  
  ORDER BY (relevance_score + context_match) DESC
  LIMIT limit_results;
END;
$$;

-- Update the existing enhanced_search function to track knowledge gaps
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
DECLARE
  results_count INTEGER;
BEGIN
  -- Get results using the AI enhanced search
  RETURN QUERY
  SELECT 
    aes.result_type,
    aes.result_id,
    aes.title,
    aes.content,
    aes.source,
    (aes.relevance_score + aes.context_match) as relevance_score
  FROM public.ai_enhanced_search(search_query, '{}'::jsonb, limit_results) aes;
  
  -- Count results for knowledge gap tracking
  GET DIAGNOSTICS results_count = ROW_COUNT;
  
  -- Track potential knowledge gap
  PERFORM public.track_knowledge_gap(search_query, results_count);
END;
$$;
