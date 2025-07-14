-- Drop and recreate the ai_enhanced_search function with proper semantic matching
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
  qa_results RECORD;
  doc_results RECORD;
BEGIN
  -- Normalize the search query for better semantic matching
  normalized_query := LOWER(TRIM(search_query));
  
  -- Create a temporary table to collect results
  CREATE TEMP TABLE IF NOT EXISTS temp_search_results (
    result_type TEXT,
    result_id UUID,
    title TEXT,
    content TEXT,
    source TEXT,
    relevance_score FLOAT,
    context_match FLOAT
  );
  
  -- Clear any existing results
  DELETE FROM temp_search_results;
  
  -- Search Q&A pairs with enhanced semantic matching
  FOR qa_results IN
    SELECT 
      qa.id,
      qa.question,
      qa.answer,
      qa.category,
      qa.tags,
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
      ) AS calculated_relevance
    FROM public.qa_pairs qa
    WHERE qa.is_active = true
  LOOP
    -- Only insert results with meaningful relevance scores
    IF qa_results.calculated_relevance > 0.5 THEN
      INSERT INTO temp_search_results VALUES (
        'qa_pair',
        qa_results.id,
        qa_results.question,
        qa_results.answer,
        CONCAT('Q&A - ', qa_results.category),
        qa_results.calculated_relevance,
        CASE 
          WHEN user_context ? qa_results.category THEN 0.2
          ELSE 0.0
        END
      );
    END IF;
  END LOOP;
  
  -- Search documents with lower priority than Q&A
  FOR doc_results IN
    SELECT 
      d.id,
      d.name,
      COALESCE(dc.content, d.ai_summary, d.content_summary, 'No content available') as doc_content,
      d.ai_summary,
      d.keywords,
      d.file_type,
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
      ) AS calculated_relevance
    FROM public.documents d
    LEFT JOIN public.document_chunks dc ON d.id = dc.document_id
    WHERE d.processing_status IN ('processed', 'uploaded')
  LOOP
    -- Only insert document results with meaningful relevance scores
    IF doc_results.calculated_relevance > 0.3 THEN
      INSERT INTO temp_search_results VALUES (
        'document',
        doc_results.id,
        doc_results.name,
        doc_results.doc_content,
        CONCAT('Document - ', doc_results.name, CASE WHEN doc_results.ai_summary IS NOT NULL THEN ' (AI Enhanced)' ELSE '' END),
        doc_results.calculated_relevance,
        CASE 
          WHEN doc_results.file_type = (user_context->>'preferred_file_type') THEN 0.1
          ELSE 0.0
        END
      );
    END IF;
  END LOOP;
  
  -- Return results ordered by relevance, with Q&A pairs prioritized
  RETURN QUERY
  SELECT 
    tsr.result_type,
    tsr.result_id,
    tsr.title,
    tsr.content,
    tsr.source,
    tsr.relevance_score,
    tsr.context_match
  FROM temp_search_results tsr
  ORDER BY 
    (tsr.relevance_score + tsr.context_match) DESC,
    CASE WHEN tsr.result_type = 'qa_pair' THEN 0 ELSE 1 END,
    tsr.result_type ASC
  LIMIT limit_results;
  
  -- Clean up temp table
  DROP TABLE temp_search_results;
END;
$$;