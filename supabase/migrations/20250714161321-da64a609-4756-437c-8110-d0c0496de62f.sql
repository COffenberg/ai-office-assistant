-- Enhanced ai_enhanced_search function with better semantic matching and prioritization
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
  -- Enhanced Q&A search with improved semantic matching and prioritization
  SELECT 
    'qa_pair'::TEXT as result_type,
    qa.id as result_id,
    qa.question as title,
    qa.answer as content,
    CONCAT('Q&A - ', qa.category) as source,
    (
      CASE 
        -- Exact question matches get highest priority
        WHEN qa.question ILIKE '%' || search_query || '%' THEN 1.0
        -- Enhanced phone/support number matching
        WHEN (search_query ILIKE '%support%phone%number%' OR search_query ILIKE '%number%call%support%' OR search_query ILIKE '%call%reach%support%') 
             AND (qa.question ILIKE '%phone%' OR qa.question ILIKE '%number%' OR qa.question ILIKE '%support%' OR qa.question ILIKE '%call%') THEN 0.95
        -- Enhanced customer call matching with specific patterns
        WHEN (search_query ILIKE '%call%customer%' OR search_query ILIKE '%customer%before%' OR search_query ILIKE '%wiring%required%') 
             AND (qa.question ILIKE '%customer%' OR qa.question ILIKE '%call%' OR qa.question ILIKE '%before%' OR qa.question ILIKE '%wiring%') THEN 0.95
        -- Answer content matches
        WHEN qa.answer ILIKE '%' || search_query || '%' THEN 0.9
        -- Category matches
        WHEN qa.category ILIKE '%' || search_query || '%' THEN 0.7
        -- Tag matches
        WHEN search_query = ANY(qa.tags) THEN 0.8
        -- Enhanced semantic matching for common question patterns
        WHEN (search_query ILIKE '%number%call%' OR search_query ILIKE '%call%number%') 
             AND (qa.question ILIKE '%phone%' OR qa.question ILIKE '%number%') THEN 0.85
        WHEN (search_query ILIKE '%call customer%' OR search_query ILIKE '%customer%before%') 
             AND (qa.question ILIKE '%customer%' OR qa.answer ILIKE '%customer%') THEN 0.85
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
      search_query = ANY(qa.tags) OR
      -- Enhanced semantic matching patterns for phone/support
      (search_query ILIKE '%support%phone%number%' AND (qa.question ILIKE '%phone%' OR qa.question ILIKE '%support%')) OR
      (search_query ILIKE '%number%call%' AND (qa.question ILIKE '%phone%' OR qa.question ILIKE '%number%')) OR
      (search_query ILIKE '%call%number%' AND (qa.question ILIKE '%phone%' OR qa.question ILIKE '%number%')) OR
      -- Enhanced semantic matching patterns for customer communication
      (search_query ILIKE '%call customer%' AND (qa.question ILIKE '%customer%' OR qa.answer ILIKE '%customer%')) OR
      (search_query ILIKE '%customer%before%' AND (qa.question ILIKE '%customer%' OR qa.answer ILIKE '%customer%')) OR
      (search_query ILIKE '%wiring%required%' AND (qa.question ILIKE '%wiring%' OR qa.question ILIKE '%customer%'))
    )
  
  UNION ALL
  
  -- Enhanced document search with better content prioritization
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
        -- Enhanced matching for customer communication questions with specific patterns
        WHEN (search_query ILIKE '%call customer%' OR search_query ILIKE '%customer%before%' OR search_query ILIKE '%wiring%required%') 
             AND (dc.content ILIKE '%always call%customer%' OR dc.content ILIKE '%call%customer%before%' OR dc.content ILIKE '%customer%wiring%') THEN 0.95
        WHEN (search_query ILIKE '%support%phone%number%' OR search_query ILIKE '%number%call%support%') 
             AND (dc.content ILIKE '%phone%' OR dc.content ILIKE '%support%' OR dc.content ILIKE '%contact%') THEN 0.9
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
      -- Enhanced matching for customer communication with specific content patterns
      (search_query ILIKE '%call customer%' AND (dc.content ILIKE '%always call%customer%' OR dc.content ILIKE '%call%customer%before%')) OR
      (search_query ILIKE '%customer%before%' AND (dc.content ILIKE '%customer%' OR dc.content ILIKE '%before%')) OR
      (search_query ILIKE '%wiring%required%' AND (dc.content ILIKE '%wiring%' OR dc.content ILIKE '%customer%')) OR
      (search_query ILIKE '%support%phone%number%' AND (dc.content ILIKE '%phone%' OR dc.content ILIKE '%support%')) OR
      (search_query ILIKE '%number%call%support%' AND (dc.content ILIKE '%phone%' OR dc.content ILIKE '%support%')) OR
      -- Enhanced matching for common question types
      (search_query ILIKE '%equipment%' AND dc.content ILIKE '%equipment%') OR
      (search_query ILIKE '%package%' AND dc.content ILIKE '%package%') OR
      (search_query ILIKE '%standard%' AND dc.content ILIKE '%standard%') OR
      (search_query ILIKE '%installation%' AND dc.content ILIKE '%installation%')
    )
  
  -- Order by total relevance score (Q&A results will be prioritized due to higher base scores)
  ORDER BY (relevance_score + context_match) DESC, result_type ASC
  LIMIT limit_results;
END;
$$;