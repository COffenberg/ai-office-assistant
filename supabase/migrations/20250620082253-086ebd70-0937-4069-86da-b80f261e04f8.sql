
-- Fix the ai_enhanced_search function to resolve column ambiguity
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
    )::FLOAT as relevance_score,
    (
      CASE 
        WHEN user_context ? qa.category THEN 0.2
        ELSE 0.0
      END
    )::FLOAT as context_match
  FROM public.qa_pairs qa
  WHERE qa.is_active = true
    AND (
      qa.question ILIKE '%' || search_query || '%' OR
      qa.answer ILIKE '%' || search_query || '%' OR
      qa.category ILIKE '%' || search_query || '%' OR
      search_query = ANY(qa.tags)
    )
  
  UNION ALL
  
  -- Enhanced document search with AI summary (fixed ambiguity)
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
    )::FLOAT as relevance_score,
    (
      CASE 
        WHEN d.file_type = (user_context->>'preferred_file_type') THEN 0.1
        ELSE 0.0
      END
    )::FLOAT as context_match
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
