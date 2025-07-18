-- Completely rewrite ai_enhanced_search function with proper semantic matching for Q&A pairs
DROP FUNCTION IF EXISTS public.ai_enhanced_search(text, jsonb, integer);

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
  -- Enhanced Q&A search with comprehensive semantic matching
  SELECT 
    'qa_pair'::TEXT,
    qa.id,
    qa.question,
    qa.answer,
    CONCAT('Q&A - ', qa.category),
    (
      CASE 
        -- Exact question matches get highest priority
        WHEN qa.question ILIKE '%' || search_query || '%' THEN 1.0
        WHEN qa.answer ILIKE '%' || search_query || '%' THEN 0.95
        
        -- Comprehensive phone/support number semantic matching
        WHEN (
          -- User asking for phone/support number in various ways
          search_query ~* '(how.*contact.*support.*phone|what.*number.*call.*support|number.*available.*support|phone.*number.*support|support.*phone|contact.*support.*phone)' 
          AND 
          -- Q&A is about phone numbers or support contact
          (qa.question ~* '(phone|number|support|contact)' OR qa.answer ~* '(phone|number|support|contact)')
        ) THEN 0.98
        
        -- Customer communication semantic matching
        WHEN (
          search_query ~* '(call.*customer|customer.*before|wiring.*required|should.*call)' 
          AND 
          (qa.question ~* '(customer|call|before|wiring)' OR qa.answer ~* '(customer|call|before)')
        ) THEN 0.96
        
        -- Installation and equipment semantic matching
        WHEN (
          search_query ~* '(equipment|package|standard|installation)' 
          AND 
          (qa.question ~* '(equipment|package|standard|installation)' OR qa.answer ~* '(equipment|package|standard)')
        ) THEN 0.90
        
        -- Keyword-based semantic scoring for common question patterns
        WHEN (
          -- Support queries variations
          (search_query ~* '(support|help|assistance)' AND qa.question ~* '(support|help|assistance)') OR
          -- Contact queries variations  
          (search_query ~* '(contact|reach|get.*touch)' AND qa.question ~* '(contact|reach|phone|number)') OR
          -- Phone queries variations
          (search_query ~* '(phone|number|call)' AND qa.question ~* '(phone|number|call)') OR
          -- Process queries variations
          (search_query ~* '(process|procedure|how.*to)' AND qa.question ~* '(process|procedure|how|should)')
        ) THEN 0.85
        
        -- Category matches
        WHEN qa.category ILIKE '%' || search_query || '%' THEN 0.75
        
        -- Tag matches
        WHEN search_query = ANY(qa.tags) THEN 0.80
        
        -- Default semantic matching for any overlap
        ELSE 0.3
      END
    )::FLOAT,
    (
      CASE 
        WHEN user_context ? qa.category THEN 0.2
        ELSE 0.0
      END
    )::FLOAT
  FROM public.qa_pairs qa
  WHERE qa.is_active = true
    AND (
      qa.question ILIKE '%' || search_query || '%' OR
      qa.answer ILIKE '%' || search_query || '%' OR
      qa.category ILIKE '%' || search_query || '%' OR
      search_query = ANY(qa.tags) OR
      
      -- Enhanced semantic pattern matching for phone/support
      (search_query ~* '(how.*contact.*support.*phone|what.*number.*call.*support|number.*available.*support|phone.*number.*support|support.*phone|contact.*support.*phone)' 
       AND (qa.question ~* '(phone|number|support|contact)' OR qa.answer ~* '(phone|number|support|contact)')) OR
      
      -- Enhanced semantic pattern matching for customer communication
      (search_query ~* '(call.*customer|customer.*before|wiring.*required|should.*call)' 
       AND (qa.question ~* '(customer|call|before|wiring)' OR qa.answer ~* '(customer|call|before)')) OR
      
      -- Enhanced semantic pattern matching for equipment
      (search_query ~* '(equipment|package|standard|installation)' 
       AND (qa.question ~* '(equipment|package|standard|installation)' OR qa.answer ~* '(equipment|package|standard)')) OR
       
      -- General semantic patterns for common question types
      (search_query ~* '(support|help|assistance)' AND qa.question ~* '(support|help|assistance)') OR
      (search_query ~* '(contact|reach|get.*touch)' AND qa.question ~* '(contact|reach|phone|number)') OR
      (search_query ~* '(phone|number|call)' AND qa.question ~* '(phone|number|call)') OR
      (search_query ~* '(process|procedure|how.*to)' AND qa.question ~* '(process|procedure|how|should)')
    )
  
  UNION ALL
  
  -- Document search with improved relevance
  SELECT 
    'document'::TEXT,
    d.id,
    d.name,
    COALESCE(dc.content, d.ai_summary, d.content_summary, 'No content available'),
    CONCAT('Document - ', d.name, CASE WHEN d.ai_summary IS NOT NULL THEN ' (AI Enhanced)' ELSE '' END),
    (
      CASE 
        WHEN d.name ILIKE '%' || search_query || '%' THEN 0.7
        WHEN dc.content ILIKE '%' || search_query || '%' THEN 0.65
        WHEN d.ai_summary ILIKE '%' || search_query || '%' THEN 0.6
        WHEN d.content_summary ILIKE '%' || search_query || '%' THEN 0.55
        WHEN search_query = ANY(d.keywords) THEN 0.6
        -- Specific document content semantic matching (lower than Q&A)
        WHEN (search_query ~* '(call.*customer|customer.*before|wiring.*required)' 
             AND dc.content ~* '(always call.*customer|call.*customer.*before|customer.*wiring)') THEN 0.6
        WHEN (search_query ~* '(support.*phone.*number|number.*call.*support)' 
             AND dc.content ~* '(phone|support|contact)') THEN 0.55
        ELSE 0.2
      END
    )::FLOAT,
    (
      CASE 
        WHEN d.file_type = (user_context->>'preferred_file_type') THEN 0.1
        ELSE 0.0
      END
    )::FLOAT
  FROM public.documents d
  LEFT JOIN public.document_chunks dc ON d.id = dc.document_id
  WHERE d.processing_status IN ('processed', 'uploaded')
    AND (
      d.name ILIKE '%' || search_query || '%' OR
      dc.content ILIKE '%' || search_query || '%' OR
      d.ai_summary ILIKE '%' || search_query || '%' OR
      d.content_summary ILIKE '%' || search_query || '%' OR
      search_query = ANY(d.keywords) OR
      -- Document semantic matching patterns
      (search_query ~* '(call.*customer|customer.*before|wiring.*required)' 
       AND dc.content ~* '(customer|call|before|wiring)') OR
      (search_query ~* '(support.*phone.*number|number.*call.*support)' 
       AND dc.content ~* '(phone|support|contact)') OR
      (search_query ~* '(equipment|package|standard|installation)' 
       AND dc.content ~* '(equipment|package|standard|installation)')
    )
  
  -- Order by combined relevance score, prioritizing Q&A over documents
  ORDER BY (relevance_score + context_match) DESC, 
           CASE WHEN result_type = 'qa_pair' THEN 0 ELSE 1 END,
           result_type ASC
  LIMIT limit_results;
END;
$$;