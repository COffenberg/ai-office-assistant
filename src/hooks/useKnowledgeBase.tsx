
import { useQAPairs } from './useQAPairs';
import { useDocuments } from './useDocuments';
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

export const useKnowledgeBase = () => {
  const { qaPairs, searchQAPairs } = useQAPairs();
  const { documents } = useDocuments();

  const searchKnowledgeBase = async (query: string): Promise<SearchResult[]> => {
    try {
      // Search Q&A pairs
      const qaResults = await searchQAPairs(query);
      
      // Convert Q&A results to SearchResult format
      const qaSearchResults: SearchResult[] = qaResults.map(qa => ({
        type: 'qa_pair' as const,
        id: qa.id,
        question: qa.question,
        answer: qa.answer,
        source: `Q&A - ${qa.category}`,
        category: qa.category,
        relevanceScore: calculateRelevanceScore(query, qa.question + ' ' + qa.answer),
      }));

      // For now, we'll focus on Q&A pairs. Document search would require 
      // more complex text processing and vector search capabilities
      const allResults = [...qaSearchResults];

      // Sort by relevance score
      return allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return [];
    }
  };

  const generateAnswer = async (question: string): Promise<{
    answer: string;
    source?: string;
    sourceType?: 'qa_pair' | 'document' | 'ai_generated';
    sourceId?: string;
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
        };
      }
    }

    // No good match found
    return {
      answer: "Sorry, I couldn't find an answer based on the current material. Try rephrasing your question, and if this topic should be included, feel free to let your admin know.",
      sourceType: 'ai_generated',
    };
  };

  return {
    qaPairs,
    documents,
    searchKnowledgeBase,
    generateAnswer,
  };
};

// Simple relevance scoring based on keyword matching
function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentWords = content.toLowerCase().split(/\s+/);
  
  let matches = 0;
  queryWords.forEach(queryWord => {
    if (contentWords.some(contentWord => 
      contentWord.includes(queryWord) || queryWord.includes(contentWord)
    )) {
      matches++;
    }
  });
  
  return matches / queryWords.length;
}
