-- Fix the ai_enhanced_search function to resolve column ambiguity issues
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
  
  -- Enhanced document search with AI summary (fixed column references)
  SELECT 
    'document'::TEXT as result_type,
    d.id as result_id,
    d.name as title,
    COALESCE(dc.content, d.ai_summary, d.content_summary, 'No content available') as content,
    CONCAT('Document - ', d.name, CASE WHEN d.ai_summary IS NOT NULL THEN ' (AI Enhanced)' ELSE '' END) as source,
    (
      CASE 
        WHEN d.name ILIKE '%' || search_query || '%' THEN 1.0
        WHEN dc.content ILIKE '%' || search_query || '%' THEN 0.95
        WHEN d.ai_summary ILIKE '%' || search_query || '%' THEN 0.85
        WHEN d.content_summary ILIKE '%' || search_query || '%' THEN 0.75
        WHEN search_query = ANY(d.keywords) THEN 0.8
        -- Enhanced matching for equipment, packages, and installation terms
        WHEN (search_query ILIKE '%equipment%' OR search_query ILIKE '%package%' OR search_query ILIKE '%standard%') 
             AND (dc.content ILIKE '%equipment%' OR dc.content ILIKE '%package%' OR dc.content ILIKE '%standard%') THEN 0.9
        WHEN (search_query ILIKE '%installation%' OR search_query ILIKE '%install%') 
             AND (dc.content ILIKE '%installation%' OR dc.content ILIKE '%install%') THEN 0.9
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
      search_query = ANY(d.keywords) OR
      -- Enhanced matching for common question types
      (search_query ILIKE '%equipment%' AND dc.content ILIKE '%equipment%') OR
      (search_query ILIKE '%package%' AND dc.content ILIKE '%package%') OR
      (search_query ILIKE '%standard%' AND dc.content ILIKE '%standard%') OR
      (search_query ILIKE '%installation%' AND dc.content ILIKE '%installation%')
    )
  
  -- Fixed ORDER BY using column positions to avoid ambiguity
  ORDER BY 6 + 7 DESC
  LIMIT limit_results;
END;
$$;