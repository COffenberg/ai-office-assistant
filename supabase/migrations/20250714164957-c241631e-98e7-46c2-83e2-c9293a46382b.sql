-- Fix the ai_enhanced_search function to remove the problematic DELETE statement
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
DECLARE
  normalized_query TEXT;
BEGIN
  -- Normalize the search query for better semantic matching
  normalized_query := LOWER(TRIM(search_query));
  
  -- Return combined Q&A and document results
  RETURN QUERY
  
  -- Search Q&A pairs with enhanced semantic matching
  SELECT 
    'qa_pair'::TEXT as result_type,
    qa.id as result_id,
    qa.question as title,
    qa.answer as content,
    CONCAT('Q&A - ', qa.category) as source,
    (
      CASE 
        -- Exact question matches get highest priority
        WHEN LOWER(qa.question) LIKE '%' || normalized_query || '%' THEN 1.0
        WHEN LOWER(qa.answer) LIKE '%' || normalized_query || '%' THEN 0.95
        
        -- Phone/Support semantic matching patterns
        WHEN (
          normalized_query ~ '(phone|number|call|contact).*support' OR
          normalized_query ~ 'support.*(phone|number|call|contact)' OR
          normalized_query ~ 'how.*(contact|reach).*support' OR
          normalized_query ~ 'what.*number.*support'
        ) AND (
          LOWER(qa.question) ~ '(phone|number|support|contact)' OR 
          LOWER(qa.answer) ~ '(phone|number|support|contact)'
        ) THEN 0.98
        
        -- Customer communication patterns
        WHEN (
          normalized_query ~ '(call|contact).*customer' OR
          normalized_query ~ 'customer.*(call|contact)' OR
          normalized_query ~ 'should.*call.*customer' OR
          normalized_query ~ 'before.*installation'
        ) AND (
          LOWER(qa.question) ~ '(customer|call|before|installation)' OR 
          LOWER(qa.answer) ~ '(customer|call|before|installation)'
        ) THEN 0.96
        
        -- Equipment and installation patterns
        WHEN (
          normalized_query ~ '(equipment|package|standard|installation)' OR
          normalized_query ~ 'what.*included' OR
          normalized_query ~ 'comes.*with'
        ) AND (
          LOWER(qa.question) ~ '(equipment|package|standard|installation|included)' OR 
          LOWER(qa.answer) ~ '(equipment|package|standard|installation|included)'
        ) THEN 0.90
        
        -- Process and procedure patterns
        WHEN (
          normalized_query ~ '(how.*to|process|procedure|steps)' OR
          normalized_query ~ 'what.*should.*do'
        ) AND (
          LOWER(qa.question) ~ '(how|process|procedure|should|steps)' OR 
          LOWER(qa.answer) ~ '(process|procedure|should|steps)'
        ) THEN 0.85
        
        -- Category and tag matches
        WHEN LOWER(qa.category) LIKE '%' || normalized_query || '%' THEN 0.75
        WHEN EXISTS (
          SELECT 1 FROM unnest(qa.tags) AS tag 
          WHERE LOWER(tag) LIKE '%' || normalized_query || '%'
        ) THEN 0.80
        
        -- Word-by-word semantic matching
        WHEN (
          SELECT COUNT(*) 
          FROM unnest(string_to_array(normalized_query, ' ')) AS query_word
          WHERE LOWER(qa.question) LIKE '%' || query_word || '%' 
             OR LOWER(qa.answer) LIKE '%' || query_word || '%'
             OR LOWER(qa.category) LIKE '%' || query_word || '%'
        ) >= GREATEST(1, array_length(string_to_array(normalized_query, ' '), 1) / 2) THEN 0.60
        
        ELSE 0.0
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
      -- Only include results with meaningful relevance scores
      (LOWER(qa.question) LIKE '%' || normalized_query || '%') OR
      (LOWER(qa.answer) LIKE '%' || normalized_query || '%') OR
      (LOWER(qa.category) LIKE '%' || normalized_query || '%') OR
      (
        (normalized_query ~ '(phone|number|call|contact).*support' OR
         normalized_query ~ 'support.*(phone|number|call|contact)' OR
         normalized_query ~ 'how.*(contact|reach).*support' OR
         normalized_query ~ 'what.*number.*support') 
        AND 
        (LOWER(qa.question) ~ '(phone|number|support|contact)' OR 
         LOWER(qa.answer) ~ '(phone|number|support|contact)')
      ) OR
      (
        (normalized_query ~ '(call|contact).*customer' OR
         normalized_query ~ 'customer.*(call|contact)' OR
         normalized_query ~ 'should.*call.*customer' OR
         normalized_query ~ 'before.*installation') 
        AND 
        (LOWER(qa.question) ~ '(customer|call|before|installation)' OR 
         LOWER(qa.answer) ~ '(customer|call|before|installation)')
      ) OR
      (
        (normalized_query ~ '(equipment|package|standard|installation)' OR
         normalized_query ~ 'what.*included' OR
         normalized_query ~ 'comes.*with') 
        AND 
        (LOWER(qa.question) ~ '(equipment|package|standard|installation|included)' OR 
         LOWER(qa.answer) ~ '(equipment|package|standard|installation|included)')
      )
    )
  
  UNION ALL
  
  -- Search documents with lower priority than Q&A
  SELECT 
    'document'::TEXT as result_type,
    d.id as result_id,
    d.name as title,
    COALESCE(dc.content, d.ai_summary, d.content_summary, 'No content available') as content,
    CONCAT('Document - ', d.name, CASE WHEN d.ai_summary IS NOT NULL THEN ' (AI Enhanced)' ELSE '' END) as source,
    (
      CASE 
        WHEN LOWER(d.name) LIKE '%' || normalized_query || '%' THEN 0.7
        WHEN LOWER(COALESCE(dc.content, '')) LIKE '%' || normalized_query || '%' THEN 0.65
        WHEN LOWER(COALESCE(d.ai_summary, '')) LIKE '%' || normalized_query || '%' THEN 0.6
        WHEN LOWER(COALESCE(d.content_summary, '')) LIKE '%' || normalized_query || '%' THEN 0.55
        WHEN EXISTS (
          SELECT 1 FROM unnest(d.keywords) AS keyword 
          WHERE LOWER(keyword) LIKE '%' || normalized_query || '%'
        ) THEN 0.6
        ELSE 0.0
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
      LOWER(d.name) LIKE '%' || normalized_query || '%' OR
      LOWER(COALESCE(dc.content, '')) LIKE '%' || normalized_query || '%' OR
      LOWER(COALESCE(d.ai_summary, '')) LIKE '%' || normalized_query || '%' OR
      LOWER(COALESCE(d.content_summary, '')) LIKE '%' || normalized_query || '%' OR
      EXISTS (
        SELECT 1 FROM unnest(d.keywords) AS keyword 
        WHERE LOWER(keyword) LIKE '%' || normalized_query || '%'
      )
    )
  
  -- Order by relevance, prioritizing Q&A pairs
  ORDER BY 
    (relevance_score + context_match) DESC,
    CASE WHEN result_type = 'qa_pair' THEN 0 ELSE 1 END,
    result_type ASC
  LIMIT limit_results;
END;
$$;