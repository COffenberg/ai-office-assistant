
import { useQAPairs } from './useQAPairs';
import { useDocuments } from './useDocuments';
import { useSearchAnalytics } from './useSearchAnalytics';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  type: 'qa_pair' | 'document';
  id: string;
  question?: string;
  answer: string;
  source: string;
  category?: string;
  relevanceScore: number;
}

export interface EnhancedSearchResult {
  result_type: 'qa_pair' | 'document';
  result_id: string;
  title: string;
  content: string;
  source: string;
  relevance_score: number;
}

export const useKnowledgeBase = () => {
  const { qaPairs, searchQAPairs } = useQAPairs();
  const { documents } = useDocuments();
  const { trackSearch } = useSearchAnalytics();

  const searchKnowledgeBase = async (query: string): Promise<SearchResult[]> => {
    try {
      // Use the enhanced search function from the database
      const { data: results, error } = await supabase.rpc('enhanced_search', {
        search_query: query,
        limit_results: 20
      });

      if (error) {
        console.error('Enhanced search error:', error);
        // Fallback to basic search
        return await basicSearch(query);
      }

      // Track the search
      trackSearch({
        search_query: query,
        results_count: results?.length || 0,
      });

      // Convert database results to SearchResult format
      const searchResults: SearchResult[] = (results as EnhancedSearchResult[])?.map(result => ({
        type: result.result_type,
        id: result.result_id,
        question: result.result_type === 'qa_pair' ? result.title : undefined,
        answer: result.content,
        source: result.source,
        relevanceScore: result.relevance_score,
      })) || [];

      return searchResults;
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return await basicSearch(query);
    }
  };

  const basicSearch = async (query: string): Promise<SearchResult[]> => {
    // Fallback to original search method
    const qaResults = await searchQAPairs(query);
    
    const qaSearchResults: SearchResult[] = qaResults.map(qa => ({
      type: 'qa_pair' as const,
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      source: `Q&A - ${qa.category}`,
      category: qa.category,
      relevanceScore: calculateRelevanceScore(query, qa.question + ' ' + qa.answer),
    }));

    return qaSearchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const generateAnswer = async (question: string): Promise<{
    answer: string;
    source?: string;
    sourceType?: 'qa_pair' | 'document' | 'ai_generated';
    sourceId?: string;
    searchResults?: SearchResult[];
  }> => {
    // Search for relevant content
    const results = await searchKnowledgeBase(question);
    
    if (results.length > 0) {
      const bestMatch = results[0];
      
      // If we have a high-confidence match, use it
      if (bestMatch.relevanceScore > 0.7) {
        // Increment usage count for Q&A pairs
        if (bestMatch.type === 'qa_pair') {
          await supabase.rpc('increment_qa_usage', { qa_id: bestMatch.id });
        }
        
        return {
          answer: bestMatch.answer,
          source: bestMatch.source,
          sourceType: bestMatch.type,
          sourceId: bestMatch.id,
          searchResults: results.slice(0, 3), // Include top 3 results for context
        };
      }
      
      // If we have moderate matches, provide a synthesized answer
      if (results.length > 1 && bestMatch.relevanceScore > 0.4) {
        const topResults = results.slice(0, 3);
        const synthesizedAnswer = `Based on available information:\n\n${topResults.map((result, index) => 
          `${index + 1}. ${result.answer} (Source: ${result.source})`
        ).join('\n\n')}`;
        
        return {
          answer: synthesizedAnswer,
          source: `Multiple sources (${topResults.length} references)`,
          sourceType: 'ai_generated',
          searchResults: topResults,
        };
      }
    }

    // No good match found
    return {
      answer: "I couldn't find a specific answer to your question in the current knowledge base. Here are some suggestions:\n\n1. Try rephrasing your question with different keywords\n2. Check if your question relates to company policies, procedures, or guidelines\n3. Contact your administrator if this topic should be added to the knowledge base",
      sourceType: 'ai_generated',
      searchResults: results.slice(0, 5), // Show some related results anyway
    };
  };

  const getSuggestedQuestions = async (): Promise<string[]> => {
    // Get popular questions from analytics and Q&A pairs
    const recentQA = qaPairs
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 5)
      .map(qa => qa.question);

    return recentQA;
  };

  return {
    qaPairs,
    documents,
    searchKnowledgeBase,
    generateAnswer,
    getSuggestedQuestions,
  };
};

// Enhanced relevance scoring
function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const contentWords = content.toLowerCase();
  
  let exactMatches = 0;
  let partialMatches = 0;
  
  queryWords.forEach(queryWord => {
    if (contentWords.includes(queryWord)) {
      exactMatches++;
    } else if (contentWords.includes(queryWord.substring(0, queryWord.length - 1))) {
      partialMatches++;
    }
  });
  
  const exactScore = exactMatches / queryWords.length;
  const partialScore = partialMatches / queryWords.length * 0.5;
  
  return Math.min(exactScore + partialScore, 1.0);
}
